import { Injectable, NotFoundException } from "@nestjs/common";
import { CaretakerInviteStatus, UserRole } from "@makazi/shared-types";
import { PrismaService } from "../../prisma/prisma.service";

export interface ActingUser {
  id: string;
  role: string;
}

/**
 * A landlord has full access to properties they own; a caretaker has access
 * only to properties they've been assigned to AND accepted (see
 * CaretakersService). Every module that scopes data by property (Units,
 * Tenants, Maintenance, Inspections) goes through this instead of checking
 * landlordId directly, so caretaker access stays consistent everywhere.
 * Per 10-implementation-notes.md: caretakers get read/write on assigned
 * properties' units/tenants/maintenance/inspections, never on property
 * CRUD, payment settings, or properties they aren't assigned to.
 */
@Injectable()
export class PropertyAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertAccess(user: ActingUser, propertyId: string): Promise<void> {
    const ok = await this.hasAccess(user, propertyId);
    if (!ok) throw new NotFoundException("Property not found");
  }

  async hasAccess(user: ActingUser, propertyId: string): Promise<boolean> {
    if (user.role === UserRole.LANDLORD) {
      const property = await this.prisma.property.findFirst({ where: { id: propertyId, landlordId: user.id } });
      return !!property;
    }
    if (user.role === UserRole.CARETAKER) {
      const assignment = await this.prisma.caretakerAssignment.findFirst({
        where: { propertyId, caretakerId: user.id, inviteStatus: CaretakerInviteStatus.ACCEPTED },
      });
      return !!assignment;
    }
    return false;
  }

  /** Property IDs this user may read/write — used to scope list queries (Tenants, Maintenance, ...). */
  async accessiblePropertyIds(user: ActingUser): Promise<string[]> {
    if (user.role === UserRole.LANDLORD) {
      const properties = await this.prisma.property.findMany({ where: { landlordId: user.id }, select: { id: true } });
      return properties.map((p) => p.id);
    }
    if (user.role === UserRole.CARETAKER) {
      const assignments = await this.prisma.caretakerAssignment.findMany({
        where: { caretakerId: user.id, inviteStatus: CaretakerInviteStatus.ACCEPTED },
        select: { propertyId: true },
      });
      return assignments.map((a) => a.propertyId);
    }
    return [];
  }

  /** For a Unit-scoped operation: resolve the unit and verify access via its property. */
  async assertUnitAccess(user: ActingUser, unitId: string) {
    const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) throw new NotFoundException("Unit not found");
    const ok = await this.hasAccess(user, unit.propertyId);
    if (!ok) throw new NotFoundException("Unit not found");
    return unit;
  }
}
