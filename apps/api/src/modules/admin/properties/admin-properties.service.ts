import { Injectable, NotFoundException } from "@nestjs/common";
import { CaretakerInviteStatus, MaintenanceStatus, TenancyStatus, UnitStatus } from "@makazi/shared-types";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AdminPropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(county: string | undefined, search: string | undefined) {
    const properties = await this.prisma.property.findMany({
      where: {
        ...(county ? { county } : {}),
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        landlord: { select: { firstName: true, lastName: true } },
        units: { select: { status: true } },
      },
      take: 200,
    });

    return properties.map((p) => {
      const total = p.units.length;
      const occupied = p.units.filter((u) => u.status === UnitStatus.OCCUPIED).length;
      return {
        id: p.id,
        name: p.name,
        county: p.county,
        location: p.location,
        landlord: `${p.landlord.firstName} ${p.landlord.lastName}`,
        units: total,
        occupancyPct: total > 0 ? Math.round((occupied / total) * 100) : 0,
      };
    });
  }

  async getDetail(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        landlord: { select: { firstName: true, lastName: true } },
        units: { select: { id: true, status: true } },
        caretakerAssignments: {
          where: { inviteStatus: CaretakerInviteStatus.ACCEPTED },
          include: { caretaker: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    if (!property) throw new NotFoundException("Property not found");

    const unitIds = property.units.map((u) => u.id);
    const total = property.units.length;
    const occupied = property.units.filter((u) => u.status === UnitStatus.OCCUPIED).length;

    const [tenantCount, maintenanceTotal, maintenanceOpen] = await Promise.all([
      this.prisma.tenancy.count({ where: { unitId: { in: unitIds }, status: TenancyStatus.ACTIVE } }),
      this.prisma.maintenanceTicket.count({ where: { unitId: { in: unitIds } } }),
      this.prisma.maintenanceTicket.count({
        where: {
          unitId: { in: unitIds },
          status: { in: [MaintenanceStatus.REPORTED, MaintenanceStatus.ASSIGNED, MaintenanceStatus.IN_PROGRESS] },
        },
      }),
    ]);

    return {
      id: property.id,
      name: property.name,
      county: property.county,
      location: property.location,
      propertyType: property.propertyType,
      landlord: `${property.landlord.firstName} ${property.landlord.lastName}`,
      units: total,
      occupancyPct: total > 0 ? Math.round((occupied / total) * 100) : 0,
      caretakers: property.caretakerAssignments.map((a) => `${a.caretaker.firstName} ${a.caretaker.lastName}`).join(", ") || "Unassigned",
      tenants: tenantCount,
      maintenanceTotal,
      maintenanceOpen,
    };
  }
}
