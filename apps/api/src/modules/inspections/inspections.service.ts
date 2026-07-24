import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { STORAGE_GATEWAY, type StorageGateway } from "../../integrations/storage/storage-gateway.types";
import { PropertyAccessService, type ActingUser } from "../../common/services/property-access.service";
import { CreateInspectionDto } from "./dto/create-inspection.dto";
import { QueryInspectionsDto } from "./dto/query-inspections.dto";

@Injectable()
export class InspectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: PropertyAccessService,
    @Inject(STORAGE_GATEWAY) private readonly s3: StorageGateway,
  ) {}

  async presignPhoto(user: ActingUser, unitId: string, contentType: string) {
    const unit = await this.access.assertUnitAccess(user, unitId);
    return this.s3.createPresignedUploadUrl(`inspections/${unit.id}`, contentType);
  }

  async create(user: ActingUser, dto: CreateInspectionDto) {
    await this.access.assertUnitAccess(user, dto.unitId);
    return this.prisma.inspection.create({
      data: {
        unitId: dto.unitId,
        type: dto.type,
        checklist: dto.checklist ?? {},
        photoUrls: dto.photoUrls ?? [],
      },
      include: { unit: { include: { property: { select: { id: true, name: true } } } } },
    });
  }

  async findMany(user: ActingUser, query: QueryInspectionsDto) {
    let propertyIds: string[];
    if (query.propertyId) {
      await this.access.assertAccess(user, query.propertyId);
      propertyIds = [query.propertyId];
    } else {
      propertyIds = await this.access.accessiblePropertyIds(user);
    }

    return this.prisma.inspection.findMany({
      where: {
        unit: { propertyId: { in: propertyIds } },
        ...(query.unitId ? { unitId: query.unitId } : {}),
        ...(query.type ? { type: query.type } : {}),
      },
      include: { unit: { include: { property: { select: { id: true, name: true } } } } },
      orderBy: { submittedAt: "desc" },
    });
  }
}
