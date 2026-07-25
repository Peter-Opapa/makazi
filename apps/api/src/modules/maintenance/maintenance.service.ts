import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomInt } from "crypto";
import {
  CaretakerInviteStatus,
  MaintenanceActivityType,
  MaintenancePriority,
  MaintenanceStatus,
  NotificationType,
  TenancyStatus,
  UserRole,
} from "@makazi/shared-types";
import { Prisma } from "../../../generated/prisma";
import { PrismaService } from "../../prisma/prisma.service";
import { PropertyAccessService, type ActingUser } from "../../common/services/property-access.service";
import { NotificationsService } from "../notifications/notifications.service";
import { STORAGE_GATEWAY, type StorageGateway } from "../../integrations/storage/storage-gateway.types";
import { TechniciansService } from "../technicians/technicians.service";
import { CreateMaintenanceTicketDto } from "./dto/create-maintenance-ticket.dto";
import { UpdateMaintenanceStatusDto } from "./dto/update-maintenance-status.dto";
import { QueryMaintenanceDto } from "./dto/query-maintenance.dto";
import { AssignTechnicianDto } from "./dto/assign-technician.dto";
import { CreateCommentDto } from "./dto/create-comment.dto";

const TICKET_INCLUDE = {
  unit: { include: { property: { select: { id: true, name: true } } } },
  reportedBy: { select: { id: true, firstName: true, lastName: true } },
  technician: true,
} satisfies Prisma.MaintenanceTicketInclude;

type AccessibleTicket = Prisma.MaintenanceTicketGetPayload<{ include: typeof TICKET_INCLUDE }>;

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: PropertyAccessService,
    private readonly notifications: NotificationsService,
    @Inject(STORAGE_GATEWAY) private readonly s3: StorageGateway,
    private readonly technicians: TechniciansService,
  ) {}

  async presignPhoto(user: ActingUser, unitId: string, contentType: string) {
    const unit = await this.assertUnitAccessForTicket(user, unitId);
    return this.s3.createPresignedUploadUrl(`maintenance/${unit.id}`, contentType);
  }

  async create(user: ActingUser, dto: CreateMaintenanceTicketDto) {
    const unit = await this.assertUnitAccessForTicket(user, dto.unitId);

    const ticketNumber = await this.generateTicketNumber();
    const ticket = await this.prisma.maintenanceTicket.create({
      data: {
        ticketNumber,
        unitId: unit.id,
        reportedById: user.id,
        issue: dto.issue,
        category: dto.category,
        priority: dto.priority,
        photoUrls: dto.photoUrls ?? [],
      },
      include: TICKET_INCLUDE,
    });

    await this.logActivity(ticket.id, user.id, MaintenanceActivityType.CREATED, dto.issue);
    await this.notifyParticipants(
      ticket,
      user.id,
      NotificationType.MAINTENANCE_CREATED,
      `New maintenance ticket ${ticket.ticketNumber}: ${dto.issue}`,
      { ticketId: ticket.id },
    );

    return ticket;
  }

  async findMany(user: ActingUser, query: QueryMaintenanceDto) {
    let scope: Prisma.MaintenanceTicketWhereInput;

    if (user.role === UserRole.TENANT) {
      scope = { unit: { tenancies: { some: { tenantId: user.id, status: TenancyStatus.ACTIVE } } } };
    } else {
      if (query.propertyId) {
        await this.access.assertAccess(user, query.propertyId);
        scope = { unit: { propertyId: query.propertyId } };
      } else {
        const propertyIds = await this.access.accessiblePropertyIds(user);
        scope = { unit: { propertyId: { in: propertyIds } } };
      }
    }

    return this.prisma.maintenanceTicket.findMany({
      where: {
        ...scope,
        ...(query.status ? { status: query.status } : {}),
        ...(query.priority ? { priority: query.priority } : {}),
        ...(query.category ? { category: query.category } : {}),
      },
      include: TICKET_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  }

  findOne(user: ActingUser, id: string) {
    return this.findAccessibleTicket(user, id);
  }

  async updateStatus(user: ActingUser, id: string, dto: UpdateMaintenanceStatusDto) {
    const ticket = await this.findAccessibleTicket(user, id);
    const isCompleting = dto.status === MaintenanceStatus.COMPLETED;

    const updated = await this.prisma.maintenanceTicket.update({
      where: { id: ticket.id },
      data: {
        status: dto.status,
        resolutionNotes: dto.resolutionNotes ?? ticket.resolutionNotes,
        resolvedAt: isCompleting ? new Date() : ticket.resolvedAt,
      },
      include: TICKET_INCLUDE,
    });

    await this.logActivity(ticket.id, user.id, MaintenanceActivityType.STATUS_CHANGED, dto.resolutionNotes, {
      from: ticket.status,
      to: dto.status,
    });
    await this.notifyParticipants(
      ticket,
      user.id,
      NotificationType.MAINTENANCE_STATUS_CHANGED,
      `Maintenance ticket ${ticket.ticketNumber} is now ${dto.status.replace("_", " ").toLowerCase()}`,
      { ticketId: ticket.id },
    );

    return updated;
  }

  async assignTechnician(user: ActingUser, id: string, dto: AssignTechnicianDto) {
    const ticket = await this.findAccessibleTicket(user, id);
    const technician = await this.technicians.assertAssignable(user, dto.technicianId);

    const updated = await this.prisma.maintenanceTicket.update({
      where: { id: ticket.id },
      data: {
        technicianId: technician.id,
        status: ticket.status === MaintenanceStatus.REPORTED ? MaintenanceStatus.ASSIGNED : ticket.status,
      },
      include: TICKET_INCLUDE,
    });

    await this.logActivity(ticket.id, user.id, MaintenanceActivityType.TECHNICIAN_ASSIGNED, undefined, {
      technicianName: technician.name,
      technicianPhone: technician.phone,
    });
    await this.notifyParticipants(
      ticket,
      user.id,
      NotificationType.TECHNICIAN_ASSIGNED,
      `${technician.name} has been assigned to ticket ${ticket.ticketNumber}`,
      { ticketId: ticket.id },
    );

    return updated;
  }

  async addComment(user: ActingUser, id: string, dto: CreateCommentDto) {
    const ticket = await this.findAccessibleTicket(user, id);
    const activity = await this.logActivity(ticket.id, user.id, MaintenanceActivityType.COMMENT, dto.body);
    await this.notifyParticipants(
      ticket,
      user.id,
      NotificationType.MAINTENANCE_COMMENT,
      `New comment on ticket ${ticket.ticketNumber}`,
      { ticketId: ticket.id },
    );
    return activity;
  }

  async listActivities(user: ActingUser, id: string) {
    await this.findAccessibleTicket(user, id);
    return this.prisma.maintenanceActivity.findMany({
      where: { ticketId: id },
      include: { actor: { select: { id: true, firstName: true, lastName: true, role: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  // ---------- Admin Portal: platform-wide, no landlord/caretaker property-access scoping ----------

  listAllTickets() {
    return this.prisma.maintenanceTicket.findMany({ include: TICKET_INCLUDE, orderBy: { createdAt: "desc" }, take: 200 });
  }

  async adminFindTicket(id: string): Promise<AccessibleTicket> {
    const ticket = await this.prisma.maintenanceTicket.findUnique({ where: { id }, include: TICKET_INCLUDE });
    if (!ticket) throw new NotFoundException("Ticket not found");
    return ticket;
  }

  /** Technicians eligible for this ticket belong to the roster of the landlord who owns its property — same rule as the caretaker path (TechniciansService). */
  async adminListEligibleTechnicians(ticketId: string) {
    const ticket = await this.adminFindTicket(ticketId);
    const property = await this.prisma.property.findUnique({ where: { id: ticket.unit.propertyId } });
    if (!property) throw new NotFoundException("Property not found");
    return this.prisma.technician.findMany({ where: { landlordId: property.landlordId, active: true }, orderBy: { name: "asc" } });
  }

  async adminReassignTechnician(actorId: string, ticketId: string, technicianId: string) {
    const ticket = await this.adminFindTicket(ticketId);
    const property = await this.prisma.property.findUnique({ where: { id: ticket.unit.propertyId } });
    const technician = await this.prisma.technician.findUnique({ where: { id: technicianId } });
    if (!property || !technician || technician.landlordId !== property.landlordId) {
      throw new NotFoundException("Technician not found for this property's roster");
    }

    const updated = await this.prisma.maintenanceTicket.update({
      where: { id: ticket.id },
      data: {
        technicianId: technician.id,
        status: ticket.status === MaintenanceStatus.REPORTED ? MaintenanceStatus.ASSIGNED : ticket.status,
      },
      include: TICKET_INCLUDE,
    });

    await this.logActivity(ticket.id, actorId, MaintenanceActivityType.TECHNICIAN_ASSIGNED, undefined, {
      technicianName: technician.name,
      technicianPhone: technician.phone,
      reassignedByAdmin: true,
    });
    await this.notifyParticipants(
      ticket,
      actorId,
      NotificationType.TECHNICIAN_ASSIGNED,
      `${technician.name} has been assigned to ticket ${ticket.ticketNumber}`,
      { ticketId: ticket.id },
    );

    return updated;
  }

  async adminEscalate(actorId: string, ticketId: string) {
    const ticket = await this.adminFindTicket(ticketId);

    const updated = await this.prisma.maintenanceTicket.update({
      where: { id: ticket.id },
      data: { priority: MaintenancePriority.URGENT },
      include: TICKET_INCLUDE,
    });

    await this.logActivity(ticket.id, actorId, MaintenanceActivityType.STATUS_CHANGED, "Escalated by Admin support", {
      escalated: true,
      previousPriority: ticket.priority,
    });
    await this.notifyParticipants(
      ticket,
      actorId,
      NotificationType.MAINTENANCE_STATUS_CHANGED,
      `Maintenance ticket ${ticket.ticketNumber} has been escalated`,
      { ticketId: ticket.id },
    );

    return updated;
  }

  private logActivity(ticketId: string, actorId: string, type: MaintenanceActivityType, body?: string, metadata?: Prisma.InputJsonValue) {
    return this.prisma.maintenanceActivity.create({ data: { ticketId, actorId, type, body, metadata } });
  }

  /** Everyone with a stake in this ticket (property staff + the original reporter), minus whoever just acted. */
  private async notifyParticipants(
    ticket: { reportedById: string; unit: { propertyId: string } },
    actorId: string,
    type: NotificationType,
    message: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    const staffIds = await this.getPropertyStaffIds(ticket.unit.propertyId);
    const recipientIds = new Set<string>([...staffIds, ticket.reportedById]);
    recipientIds.delete(actorId);
    await Promise.all([...recipientIds].map((id) => this.notifications.create(id, type, message, undefined, metadata)));
  }

  private async assertUnitAccessForTicket(user: ActingUser, unitId: string) {
    const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) throw new NotFoundException("Unit not found");

    if (user.role === UserRole.TENANT) {
      const tenancy = await this.prisma.tenancy.findFirst({
        where: { unitId: unit.id, tenantId: user.id, status: TenancyStatus.ACTIVE },
      });
      if (!tenancy) throw new ForbiddenException("You can only report issues for your own unit");
    } else {
      await this.access.assertAccess(user, unit.propertyId);
    }
    return unit;
  }

  private async findAccessibleTicket(user: ActingUser, id: string): Promise<AccessibleTicket> {
    const ticket = await this.prisma.maintenanceTicket.findUnique({ where: { id }, include: TICKET_INCLUDE });
    if (!ticket) throw new NotFoundException("Ticket not found");

    if (user.role === UserRole.TENANT) {
      if (ticket.reportedById !== user.id) throw new NotFoundException("Ticket not found");
    } else {
      const ok = await this.access.hasAccess(user, ticket.unit.propertyId);
      if (!ok) throw new NotFoundException("Ticket not found");
    }
    return ticket;
  }

  private async getPropertyStaffIds(propertyId: string): Promise<string[]> {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    const assignments = await this.prisma.caretakerAssignment.findMany({
      where: { propertyId, inviteStatus: CaretakerInviteStatus.ACCEPTED },
      select: { caretakerId: true },
    });
    const ids = assignments.map((a) => a.caretakerId);
    if (property) ids.push(property.landlordId);
    return ids;
  }

  private async generateTicketNumber(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const ticketNumber = `MKZ-T${randomInt(1000, 9999)}`;
      const existing = await this.prisma.maintenanceTicket.findUnique({ where: { ticketNumber } });
      if (!existing) return ticketNumber;
    }
    throw new Error("Could not generate a unique ticket number");
  }
}
