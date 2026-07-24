import { Injectable } from "@nestjs/common";
import { MaintenanceStatus } from "@makazi/shared-types";
import { PrismaService } from "../../../prisma/prisma.service";
import { MaintenanceService } from "../../maintenance/maintenance.service";
import { AuditLogService } from "../../audit-log/audit-log.service";

@Injectable()
export class AdminMaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly maintenanceService: MaintenanceService,
    private readonly auditLog: AuditLogService,
  ) {}

  async list() {
    const tickets = await this.maintenanceService.listAllTickets();
    return tickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      issue: t.issue,
      property: t.unit.property.name,
      technician: t.technician?.name ?? "Unassigned",
      priority: t.priority,
      status: t.status,
      createdAt: t.createdAt,
    }));
  }

  async statusCounts() {
    const counts = await this.prisma.maintenanceTicket.groupBy({ by: ["status"], _count: { _all: true } });
    const byStatus: Record<string, number> = Object.fromEntries(Object.values(MaintenanceStatus).map((s) => [s, 0]));
    for (const c of counts) byStatus[c.status] = c._count._all;
    return byStatus;
  }

  async getDetail(id: string) {
    const ticket = await this.maintenanceService.adminFindTicket(id);
    const eligibleTechnicians = await this.maintenanceService.adminListEligibleTechnicians(id);

    return {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      issue: ticket.issue,
      category: ticket.category,
      property: ticket.unit.property.name,
      unitCode: ticket.unit.code,
      reportedBy: `${ticket.reportedBy.firstName} ${ticket.reportedBy.lastName}`,
      technician: ticket.technician ? { id: ticket.technician.id, name: ticket.technician.name } : null,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt,
      eligibleTechnicians: eligibleTechnicians.map((t) => ({ id: t.id, name: t.name, specialty: t.specialty })),
    };
  }

  async reassignTechnician(actorId: string, id: string, technicianId: string) {
    const updated = await this.maintenanceService.adminReassignTechnician(actorId, id, technicianId);

    await this.auditLog.record({
      actorId,
      action: "Reassigned maintenance technician",
      targetType: "MaintenanceTicket",
      targetId: id,
      metadata: { ticketNumber: updated.ticketNumber, technicianId },
    });

    return updated;
  }

  async escalate(actorId: string, id: string) {
    const updated = await this.maintenanceService.adminEscalate(actorId, id);

    await this.auditLog.record({
      actorId,
      action: "Escalated maintenance ticket",
      targetType: "MaintenanceTicket",
      targetId: id,
      metadata: { ticketNumber: updated.ticketNumber },
    });

    return updated;
  }
}
