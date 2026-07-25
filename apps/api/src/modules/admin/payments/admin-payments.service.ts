import { Injectable, NotFoundException } from "@nestjs/common";
import { PaymentStatus, TenancyStatus } from "@makazi/shared-types";
import { PrismaService } from "../../../prisma/prisma.service";
import { PaymentsService } from "../../payments/payments.service";
import { AuditLogService } from "../../audit-log/audit-log.service";

const PAYMENT_LIST_INCLUDE = {
  tenancy: {
    include: {
      tenant: { select: { firstName: true, lastName: true } },
      unit: { include: { property: { select: { id: true, name: true } } } },
    },
  },
} as const;

@Injectable()
export class AdminPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    private readonly auditLog: AuditLogService,
  ) {}

  async list(status: PaymentStatus | undefined, search: string | undefined) {
    const payments = await this.prisma.payment.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { reference: { contains: search, mode: "insensitive" } },
                { tenancy: { tenant: { firstName: { contains: search, mode: "insensitive" } } } },
                { tenancy: { tenant: { lastName: { contains: search, mode: "insensitive" } } } },
                { tenancy: { unit: { property: { name: { contains: search, mode: "insensitive" } } } } },
              ],
            }
          : {}),
      },
      include: PAYMENT_LIST_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return payments.map((p) => ({
      id: p.id,
      time: p.paidAt ?? p.createdAt,
      tenant: `${p.tenancy.tenant.firstName} ${p.tenancy.tenant.lastName}`,
      property: p.tenancy.unit.property.name,
      amount: Number(p.amount),
      channel: p.channel,
      status: p.status,
      reference: p.reference,
    }));
  }

  async getDetail(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id }, include: PAYMENT_LIST_INCLUDE });
    if (!payment) throw new NotFoundException("Payment not found");

    return {
      id: payment.id,
      tenant: `${payment.tenancy.tenant.firstName} ${payment.tenancy.tenant.lastName}`,
      property: payment.tenancy.unit.property.name,
      amount: Number(payment.amount),
      channel: payment.channel,
      status: payment.status,
      reference: payment.reference,
      gatewayRequestId: payment.gatewayRequestId,
      gatewayResponse: payment.gatewayResponse,
      dueDate: payment.dueDate,
      paidAt: payment.paidAt,
    };
  }

  async listUnmatched(search: string | undefined) {
    const unmatched = await this.prisma.unmatchedPayment.findMany({
      where: {
        resolvedAt: null,
        ...(search
          ? {
              OR: [
                { payerPhone: { contains: search, mode: "insensitive" } },
                { accountReference: { contains: search, mode: "insensitive" } },
                { transactionId: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { matchedProperty: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return unmatched.map((u) => ({
      id: u.id,
      time: u.createdAt,
      payerPhone: u.payerPhone,
      property: u.matchedProperty?.name ?? "Unmatched",
      amount: Number(u.amount),
      accountReference: u.accountReference,
      transactionId: u.transactionId,
    }));
  }

  /** Platform-wide tenant search for the "assign to tenant" step of reconciliation — no property-access scoping. */
  async searchActiveTenancies(search: string) {
    const tenancies = await this.prisma.tenancy.findMany({
      where: {
        status: TenancyStatus.ACTIVE,
        tenant: {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        },
      },
      include: {
        tenant: { select: { firstName: true, lastName: true } },
        unit: { include: { property: { select: { name: true } } } },
      },
      take: 20,
    });

    return tenancies.map((t) => ({
      tenancyId: t.id,
      tenantName: `${t.tenant.firstName} ${t.tenant.lastName}`,
      property: t.unit.property.name,
      unitCode: t.unit.code,
    }));
  }

  async resolveUnmatched(actorId: string, id: string, tenancyId: string) {
    const payment = await this.paymentsService.resolveUnmatchedPaymentAsAdmin(id, tenancyId);

    await this.auditLog.record({
      actorId,
      action: "Resolved unmatched payment",
      targetType: "UnmatchedPayment",
      targetId: id,
      metadata: { resolvedPaymentId: payment.id, amount: Number(payment.amount) },
    });

    return payment;
  }
}
