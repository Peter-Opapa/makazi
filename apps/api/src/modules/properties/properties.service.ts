import { ConflictException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { TenancyStatus, UserRole } from "@makazi/shared-types";
import { Prisma, UnitStatus } from "../../../generated/prisma";
import { PrismaService } from "../../prisma/prisma.service";
import { STORAGE_GATEWAY, type StorageGateway } from "../../integrations/storage/storage-gateway.types";
import { MAPS_GATEWAY, type MapsGateway } from "../../integrations/maps/maps-gateway.types";
import { PropertyAccessService, type ActingUser } from "../../common/services/property-access.service";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";
import { QueryPropertiesDto } from "./dto/query-properties.dto";
import { PresignPhotoDto } from "./dto/presign-photo.dto";
import { ConfirmPhotoDto } from "./dto/confirm-photo.dto";
import { UpsertPaymentAccountDto } from "./dto/upsert-payment-account.dto";

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_GATEWAY) private readonly s3: StorageGateway,
    @Inject(MAPS_GATEWAY) private readonly maps: MapsGateway,
    private readonly access: PropertyAccessService,
  ) {}

  async create(landlordId: string, dto: CreatePropertyDto) {
    const property = await this.prisma.property.create({ data: { ...dto, landlordId } });
    this.geocodeInBackground(property.id, property.location, property.county);
    return property;
  }

  async findAll(user: ActingUser, query: QueryPropertiesDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const scope: Prisma.PropertyWhereInput =
      user.role === UserRole.LANDLORD
        ? { landlordId: user.id }
        : { id: { in: await this.access.accessiblePropertyIds(user) } };

    const where: Prisma.PropertyWhereInput = {
      ...scope,
      ...(query.county ? { county: query.county } : {}),
      ...(query.propertyType ? { propertyType: query.propertyType } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { location: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          units: { select: { status: true } },
          _count: { select: { photos: true } },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      data: properties.map((p) => this.withOccupancy(p)),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async findOne(user: ActingUser, id: string) {
    await this.access.assertAccess(user, id);
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        units: {
          orderBy: [{ floor: "asc" }, { code: "asc" }],
          include: {
            tenancies: {
              where: { status: { in: [TenancyStatus.PENDING, TenancyStatus.ACTIVE] } },
              include: { tenant: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } } },
            },
          },
        },
        photos: { orderBy: { order: "asc" } },
        paymentAccount: true,
      },
    });
    if (!property) throw new NotFoundException("Property not found");
    return property;
  }

  async update(landlordId: string, id: string, dto: UpdatePropertyDto) {
    await this.assertOwnership(landlordId, id);
    const updated = await this.prisma.property.update({ where: { id }, data: dto });
    if (dto.location || dto.county) {
      this.geocodeInBackground(updated.id, updated.location, updated.county);
    }
    return updated;
  }

  async remove(landlordId: string, id: string) {
    await this.assertOwnership(landlordId, id);

    const unitCount = await this.prisma.unit.count({ where: { propertyId: id } });
    if (unitCount > 0) {
      throw new ConflictException("Remove all units from this property before deleting it");
    }

    const photos = await this.prisma.propertyPhoto.findMany({ where: { propertyId: id } });
    await Promise.all(photos.map((photo) => this.s3.deleteObjectByUrl(photo.url).catch(() => undefined)));

    await this.prisma.property.delete({ where: { id } });
    return { message: "Property deleted" };
  }

  async presignPhoto(landlordId: string, propertyId: string, dto: PresignPhotoDto) {
    await this.assertOwnership(landlordId, propertyId);
    return this.s3.createPresignedUploadUrl(`properties/${propertyId}`, dto.contentType);
  }

  async confirmPhoto(landlordId: string, propertyId: string, dto: ConfirmPhotoDto) {
    await this.assertOwnership(landlordId, propertyId);
    const url = this.s3.publicUrlFor(dto.key);
    const highest = await this.prisma.propertyPhoto.aggregate({
      where: { propertyId },
      _max: { order: true },
    });
    return this.prisma.propertyPhoto.create({
      data: { propertyId, url, order: (highest._max.order ?? -1) + 1 },
    });
  }

  async deletePhoto(landlordId: string, propertyId: string, photoId: string) {
    await this.assertOwnership(landlordId, propertyId);
    const photo = await this.prisma.propertyPhoto.findFirst({ where: { id: photoId, propertyId } });
    if (!photo) throw new NotFoundException("Photo not found");
    await this.s3.deleteObjectByUrl(photo.url).catch(() => undefined);
    await this.prisma.propertyPhoto.delete({ where: { id: photoId } });
    return { message: "Photo deleted" };
  }

  async upsertPaymentAccount(landlordId: string, propertyId: string, dto: UpsertPaymentAccountDto) {
    await this.assertOwnership(landlordId, propertyId);
    // Clear whatever doesn't apply to the chosen method, so switching methods
    // never leaves a stale shortcode behind for the payment flow to pick up.
    const data = {
      method: dto.method,
      payBillNumber: dto.method === "paybill" || dto.method === "bank" ? dto.payBillNumber : null,
      tillNumber: dto.method === "till" ? dto.tillNumber : null,
      bankName: dto.method === "bank" ? dto.bankName : null,
      bankAccountNumber: dto.method === "bank" ? dto.bankAccountNumber : null,
    };
    return this.prisma.paymentAccount.upsert({
      where: { propertyId },
      create: { propertyId, ...data },
      update: data,
    });
  }

  private async assertOwnership(landlordId: string, propertyId: string) {
    const property = await this.prisma.property.findFirst({ where: { id: propertyId, landlordId } });
    if (!property) throw new NotFoundException("Property not found");
  }

  /** Never blocks or fails the caller — same fire-and-forget principle as notification fan-out. */
  private geocodeInBackground(propertyId: string, location: string, county: string | null) {
    const address = county ? `${location}, ${county}, Kenya` : `${location}, Kenya`;
    this.maps
      .geocode(address)
      .then((result) => {
        if (!result) return;
        return this.prisma.property.update({
          where: { id: propertyId },
          data: { latitude: result.lat, longitude: result.lng, geocodedAt: new Date() },
        });
      })
      .catch((err) => this.logger.warn(`Geocoding failed for property ${propertyId}: ${err}`));
  }

  private withOccupancy<T extends { units: { status: UnitStatus }[] }>(property: T) {
    const { units, ...rest } = property;
    const count = (status: UnitStatus) => units.filter((u) => u.status === status).length;
    return {
      ...rest,
      occupancy: {
        total: units.length,
        occupied: count(UnitStatus.OCCUPIED),
        vacant: count(UnitStatus.VACANT),
        reserved: count(UnitStatus.RESERVED),
        underMaintenance: count(UnitStatus.UNDER_MAINTENANCE),
      },
    };
  }
}
