import { NotFoundException, Injectable } from "@nestjs/common";
import { randomInt } from "crypto";
import { NotificationType, SupportTicketStatus } from "@makazi/shared-types";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { AuditLogService } from "../audit-log/audit-log.service";

const TICKET_INCLUDE = {
  customer: { select: { id: true, firstName: true, lastName: true, role: true } },
  agent: { select: { id: true, firstName: true, lastName: true } },
} as const;

@Injectable()
export class SupportTicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(customerId: string, subject: string, message: string) {
    const ticketNumber = await this.generateTicketNumber();
    return this.prisma.supportTicket.create({
      data: { ticketNumber, customerId, subject, message },
      include: TICKET_INCLUDE,
    });
  }

  async list() {
    const tickets = await this.prisma.supportTicket.findMany({
      include: TICKET_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return tickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      subject: t.subject,
      customer: `${t.customer.firstName} ${t.customer.lastName}`,
      agent: t.agent ? `${t.agent.firstName} ${t.agent.lastName}` : "Unassigned",
      agentId: t.agentId,
      status: t.status,
      createdAt: t.createdAt,
    }));
  }

  async statusCounts() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [open, escalated, resolvedToday] = await Promise.all([
      this.prisma.supportTicket.count({ where: { status: SupportTicketStatus.OPEN } }),
      this.prisma.supportTicket.count({ where: { status: SupportTicketStatus.ESCALATED } }),
      this.prisma.supportTicket.count({ where: { status: SupportTicketStatus.RESOLVED, resolvedAt: { gte: startOfToday } } }),
    ]);
    return { open, escalated, resolvedToday };
  }

  async getDetail(id: string) {
    const ticket = await this.findOrThrow(id);
    return {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      message: ticket.message,
      customer: `${ticket.customer.firstName} ${ticket.customer.lastName}`,
      customerRole: ticket.customer.role,
      agentId: ticket.agentId,
      agent: ticket.agent ? `${ticket.agent.firstName} ${ticket.agent.lastName}` : "Unassigned",
      internalNotes: ticket.internalNotes,
      status: ticket.status,
      createdAt: ticket.createdAt,
      resolvedAt: ticket.resolvedAt,
    };
  }

  async assignAgent(actorId: string, id: string, agentId: string | null | undefined) {
    const ticket = await this.findOrThrow(id);
    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: { agentId: agentId || null },
      include: TICKET_INCLUDE,
    });

    await this.auditLog.record({
      actorId,
      action: "Assigned support agent",
      targetType: "SupportTicket",
      targetId: id,
      metadata: { ticketNumber: ticket.ticketNumber, agentId: agentId ?? null },
    });

    return updated;
  }

  async updateNotes(actorId: string, id: string, notes: string) {
    const ticket = await this.findOrThrow(id);
    const updated = await this.prisma.supportTicket.update({ where: { id }, data: { internalNotes: notes }, include: TICKET_INCLUDE });

    await this.auditLog.record({
      actorId,
      action: "Updated support ticket notes",
      targetType: "SupportTicket",
      targetId: id,
      metadata: { ticketNumber: ticket.ticketNumber },
    });

    return updated;
  }

  async escalate(actorId: string, id: string) {
    const ticket = await this.findOrThrow(id);
    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: { status: SupportTicketStatus.ESCALATED },
      include: TICKET_INCLUDE,
    });

    await this.auditLog.record({
      actorId,
      action: "Escalated support ticket",
      targetType: "SupportTicket",
      targetId: id,
      metadata: { ticketNumber: ticket.ticketNumber },
    });

    return updated;
  }

  async resolve(actorId: string, id: string) {
    const ticket = await this.findOrThrow(id);
    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: { status: SupportTicketStatus.RESOLVED, resolvedAt: new Date() },
      include: TICKET_INCLUDE,
    });

    await this.notifications.create(
      ticket.customerId,
      NotificationType.GENERAL,
      `Your support ticket ${ticket.ticketNumber} has been resolved`,
      "Reply to this ticket if you need further help.",
    );

    await this.auditLog.record({
      actorId,
      action: "Resolved support ticket",
      targetType: "SupportTicket",
      targetId: id,
      metadata: { ticketNumber: ticket.ticketNumber },
    });

    return updated;
  }

  private async findOrThrow(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id }, include: TICKET_INCLUDE });
    if (!ticket) throw new NotFoundException("Support ticket not found");
    return ticket;
  }

  private async generateTicketNumber(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const ticketNumber = `TCK-${randomInt(10000, 99999)}`;
      const existing = await this.prisma.supportTicket.findUnique({ where: { ticketNumber } });
      if (!existing) return ticketNumber;
    }
    throw new Error("Could not generate a unique ticket number");
  }
}
