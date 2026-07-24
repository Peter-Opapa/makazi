import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { UserRole } from "@makazi/shared-types";
import { PrismaService } from "../../prisma/prisma.service";
import { PropertyAccessService, type ActingUser } from "../../common/services/property-access.service";
import { CreateTechnicianDto } from "./dto/create-technician.dto";
import { UpdateTechnicianDto } from "./dto/update-technician.dto";

@Injectable()
export class TechniciansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: PropertyAccessService,
  ) {}

  async create(user: ActingUser, dto: CreateTechnicianDto) {
    const landlordId = await this.resolveLandlordId(user, dto.propertyId);
    return this.prisma.technician.create({
      data: { landlordId, name: dto.name, phone: dto.phone, specialty: dto.specialty },
    });
  }

  async findMany(user: ActingUser) {
    const landlordIds = await this.relevantLandlordIds(user);
    if (landlordIds.length === 0) return [];
    return this.prisma.technician.findMany({
      where: { landlordId: { in: landlordIds }, active: true },
      orderBy: { name: "asc" },
    });
  }

  async update(user: ActingUser, id: string, dto: UpdateTechnicianDto) {
    const technician = await this.assertAccessible(user, id);
    return this.prisma.technician.update({ where: { id: technician.id }, data: dto });
  }

  /** Verifies this technician is on a roster the acting user can see, without exposing which landlord owns it. */
  async assertAssignable(user: ActingUser, id: string) {
    return this.assertAccessible(user, id);
  }

  private async resolveLandlordId(user: ActingUser, propertyId?: string): Promise<string> {
    if (user.role === UserRole.LANDLORD) return user.id;
    if (!propertyId) throw new BadRequestException("propertyId is required when adding a technician as a caretaker");
    await this.access.assertAccess(user, propertyId);
    const property = await this.prisma.property.findUniqueOrThrow({ where: { id: propertyId } });
    return property.landlordId;
  }

  private async relevantLandlordIds(user: ActingUser): Promise<string[]> {
    if (user.role === UserRole.LANDLORD) return [user.id];
    const propertyIds = await this.access.accessiblePropertyIds(user);
    if (propertyIds.length === 0) return [];
    const properties = await this.prisma.property.findMany({
      where: { id: { in: propertyIds } },
      select: { landlordId: true },
    });
    return [...new Set(properties.map((p) => p.landlordId))];
  }

  private async assertAccessible(user: ActingUser, id: string) {
    const technician = await this.prisma.technician.findUnique({ where: { id } });
    if (!technician) throw new NotFoundException("Technician not found");
    const landlordIds = await this.relevantLandlordIds(user);
    if (!landlordIds.includes(technician.landlordId)) throw new NotFoundException("Technician not found");
    return technician;
  }
}
