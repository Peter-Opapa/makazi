import { ConflictException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { CaretakerInviteStatus, NotificationType, PaymentChannel, PaymentStatus, TenancyStatus } from "@makazi/shared-types";
import { Prisma } from "../../../generated/prisma";
import { PrismaService } from "../../prisma/prisma.service";
import { STORAGE_GATEWAY, type StorageGateway } from "../../integrations/storage/storage-gateway.types";
import { NotificationsService } from "../notifications/notifications.service";
import { PropertyAccessService, type ActingUser } from "../../common/services/property-access.service";
import {
  PAYMENT_GATEWAY,
  type C2bConfirmationPayload,
  type ParsedStkCallback,
  type PaymentGateway,
} from "./gateway/payment-gateway.types";
import { InitiatePaymentDto } from "./dto/initiate-payment.dto";
import { ListLedgerDto } from "./dto/list-ledger.dto";

const PAYMENT_HISTORY_INCLUDE = {
  tenancy: { include: { unit: { include: { property: { select: { id: true, name: true } } } } } },
} satisfies Prisma.PaymentInclude;

const TENANCY_WITH_DESTINATION_INCLUDE = {
  unit: { include: { property: { include: { paymentAccount: true } } } },
} satisfies Prisma.TenancyInclude;

type TenancyWithDestination = Prisma.TenancyGetPayload<{ include: typeof TENANCY_WITH_DESTINATION_INCLUDE }>;
type PaymentAccountRow = Prisma.PaymentAccountGetPayload<Record<string, never>>;

/** Placeholder channel from the original design prototype, not a real Safaricom rail — kept working exactly as before, isolated from the STK/USSD/PayBill architecture below. */
const WHATSAPP_SUCCESS_RATE = 0.8;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  /** Payment IDs with an STK push awaiting callback, or a WhatsApp simulation in flight — guards against double-submitting "Pay Rent". */
  private readonly resolving = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_GATEWAY) private readonly s3: StorageGateway,
    private readonly notifications: NotificationsService,
    private readonly access: PropertyAccessService,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
  ) {}

  // ---------- Tenant self-service ----------

  async getRentStatus(tenantId: string) {
    const tenancy = await this.getActiveTenancyOrThrow(tenantId);
    const due = await this.getOrCreateCurrentDue(tenancy);
    return this.withDestination(due, tenancy.unit.property.paymentAccount);
  }

  async initiatePayment(tenantId: string, dto: InitiatePaymentDto) {
    const tenancy = await this.getActiveTenancyOrThrow(tenantId);
    const due = await this.getOrCreateCurrentDue(tenancy);
    if (due.status === PaymentStatus.PAID) throw new ConflictException("Rent for this period is already paid");

    const paymentAccount = tenancy.unit.property.paymentAccount;
    if (!paymentAccount) throw new ConflictException("This property hasn't set up a payment destination yet");

    const accountReference = tenancy.unit.code;

    if (dto.channel === PaymentChannel.STK_PUSH) {
      const updated = await this.initiateStk(due, tenancy, paymentAccount, accountReference);
      return this.withDestination(updated, paymentAccount);
    }

    if (dto.channel === PaymentChannel.WHATSAPP) {
      if (this.resolving.has(due.id)) throw new ConflictException("A payment attempt for this period is already in progress");
      const updated = await this.prisma.payment.update({
        where: { id: due.id },
        data: { status: PaymentStatus.PENDING, channel: dto.channel, accountReference, reference: null },
      });
      this.resolving.add(updated.id);
      this.scheduleWhatsappSimulation(updated.id, tenantId);
      return this.withDestination(updated, paymentAccount);
    }

    // USSD / PayBill direct: nothing to call — the tenant pays out-of-band
    // (dials the paybill themselves) and Safaricom's C2B confirmation is what
    // actually settles this (see PaymentWebhooksController). Makazi only
    // records what happens; it can't push or guarantee this one.
    const updated = await this.prisma.payment.update({
      where: { id: due.id },
      data: { status: due.status, channel: dto.channel, accountReference, reference: null, gatewayRequestId: null },
    });

    this.gateway.simulateExternalConfirmation?.({
      businessShortCode: (paymentAccount.payBillNumber || paymentAccount.tillNumber) as string,
      amount: Number(updated.amount),
      accountReference,
      payerPhone: await this.getTenantPhoneOrPlaceholder(tenantId),
    });

    return this.withDestination(updated, paymentAccount);
  }

  async getPayment(tenantId: string, id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { tenancy: { include: TENANCY_WITH_DESTINATION_INCLUDE } },
    });
    if (!payment || payment.tenancy.tenantId !== tenantId) throw new NotFoundException("Payment not found");
    const { tenancy, ...rest } = payment;
    return this.withDestination(rest, tenancy.unit.property.paymentAccount);
  }

  listPayments(tenantId: string) {
    return this.prisma.payment.findMany({
      where: { tenancy: { tenantId } },
      include: PAYMENT_HISTORY_INCLUDE,
      orderBy: { dueDate: "desc" },
      take: 100,
    });
  }

  async getReceipt(tenantId: string, id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        tenancy: {
          include: {
            tenant: { select: { firstName: true, lastName: true } },
            unit: { include: { property: { select: { name: true } } } },
          },
        },
      },
    });
    if (!payment || payment.tenancy.tenantId !== tenantId) throw new NotFoundException("Payment not found");
    if (payment.status !== PaymentStatus.PAID || !payment.paidAt) {
      throw new ConflictException("Only paid payments have a receipt");
    }
    if (payment.receiptUrl) return { url: payment.receiptUrl };

    const html = this.renderReceiptHtml({
      tenantName: `${payment.tenancy.tenant.firstName} ${payment.tenancy.tenant.lastName}`,
      propertyName: payment.tenancy.unit.property.name,
      unitCode: payment.tenancy.unit.code,
      amount: Number(payment.amount),
      channel: payment.channel,
      reference: payment.reference,
      paidAt: payment.paidAt,
    });
    const url = await this.s3.putObject(`receipts/${payment.id}`, html, "text/html");
    await this.prisma.payment.update({ where: { id: payment.id }, data: { receiptUrl: url } });
    return { url };
  }

  async getRentalPassport(tenantId: string) {
    const tenancies = await this.prisma.tenancy.findMany({
      where: { tenantId },
      include: { payments: true },
      orderBy: { leaseStart: "asc" },
    });

    if (tenancies.length === 0) {
      return { hasHistory: false, score: null, label: "No rental history yet", onTimeRate: null, monthsAsTenant: 0, totalPayments: 0 };
    }

    const monthsAsTenant = Math.max(
      0,
      Math.floor((Date.now() - tenancies[0].leaseStart.getTime()) / (1000 * 60 * 60 * 24 * 30)),
    );

    // LATE alone means "overdue, never attempted" — not a real outcome yet, so
    // it's excluded here. Only PAID and FAILED represent an actual attempt.
    const resolvedPayments = tenancies
      .flatMap((t) => t.payments)
      .filter((p) => p.status === PaymentStatus.PAID || p.status === PaymentStatus.FAILED);

    if (resolvedPayments.length === 0) {
      return { hasHistory: true, score: null, label: "Building history", onTimeRate: null, monthsAsTenant, totalPayments: 0 };
    }

    const paidPayments = resolvedPayments.filter((p) => p.status === PaymentStatus.PAID);
    const onTimeCount = paidPayments.filter((p) => p.paidAt && p.dueDate && p.paidAt <= p.dueDate).length;
    const onTimeRate = paidPayments.length > 0 ? onTimeCount / paidPayments.length : 0;

    // Heuristic "alternative credit score" preview, not a real bureau score:
    // on-time rate carries most of the weight, tenure adds a modest bonus
    // (capped at 2 years), plus a small bonus just for having a resolved
    // payment history at all.
    const rateScore = onTimeRate * 70;
    const tenureScore = (Math.min(monthsAsTenant, 24) / 24) * 20;
    const participationBonus = 10;
    const score = Math.round(Math.min(100, rateScore + tenureScore + participationBonus));
    const label = score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 50 ? "Fair" : "Building history";

    return { hasHistory: true, score, label, onTimeRate, monthsAsTenant, totalPayments: resolvedPayments.length };
  }

  // ---------- Landlord / Caretaker ledger ----------

  async listLedger(user: ActingUser, query: ListLedgerDto) {
    let propertyIds: string[];
    if (query.propertyId) {
      await this.access.assertAccess(user, query.propertyId);
      propertyIds = [query.propertyId];
    } else {
      propertyIds = await this.access.accessiblePropertyIds(user);
    }

    return this.prisma.payment.findMany({
      where: {
        tenancy: { unit: { propertyId: { in: propertyIds } } },
        ...(query.status ? { status: query.status } : {}),
      },
      include: {
        tenancy: {
          include: {
            tenant: { select: { id: true, firstName: true, lastName: true, phone: true } },
            unit: { include: { property: { select: { id: true, name: true } } } },
          },
        },
      },
      orderBy: { dueDate: "desc" },
      take: 200,
    });
  }

  async listUnmatchedPayments(user: ActingUser, propertyId?: string) {
    const propertyIds = propertyId ? [propertyId] : await this.access.accessiblePropertyIds(user);
    if (propertyId) await this.access.assertAccess(user, propertyId);

    return this.prisma.unmatchedPayment.findMany({
      where: { matchedPropertyId: { in: propertyIds }, resolvedAt: null },
      include: { matchedProperty: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async resolveUnmatchedPayment(user: ActingUser, id: string, tenancyId: string) {
    const tenancy = await this.prisma.tenancy.findUnique({
      where: { id: tenancyId },
      include: TENANCY_WITH_DESTINATION_INCLUDE,
    });
    if (!tenancy) throw new NotFoundException("Tenancy not found");
    await this.access.assertAccess(user, tenancy.unit.propertyId);

    return this.resolveUnmatchedPaymentInternal(id, tenancy);
  }

  /** Admin Portal variant — platform-wide, no landlord/caretaker property-access scoping (see AdminPermissionGuard instead). */
  async resolveUnmatchedPaymentAsAdmin(id: string, tenancyId: string) {
    const tenancy = await this.prisma.tenancy.findUnique({
      where: { id: tenancyId },
      include: TENANCY_WITH_DESTINATION_INCLUDE,
    });
    if (!tenancy) throw new NotFoundException("Tenancy not found");

    return this.resolveUnmatchedPaymentInternal(id, tenancy);
  }

  private async resolveUnmatchedPaymentInternal(
    id: string,
    tenancy: TenancyWithDestination & { id: string; tenantId: string; rentAmount: Prisma.Decimal; leaseStart: Date },
  ) {
    const unmatched = await this.prisma.unmatchedPayment.findUnique({ where: { id } });
    if (!unmatched || unmatched.resolvedAt) throw new NotFoundException("Unmatched payment not found");

    const payment = await this.applyExternalPayment(tenancy, {
      amount: Number(unmatched.amount),
      payerPhone: unmatched.payerPhone,
      transactionId: unmatched.transactionId,
      accountReference: unmatched.accountReference,
      rawPayload: unmatched.rawPayload as Prisma.InputJsonValue,
    });

    await this.prisma.unmatchedPayment.update({
      where: { id },
      data: { resolvedAt: new Date(), resolvedPaymentId: payment.id },
    });
    return payment;
  }

  // ---------- Gateway callbacks (see PaymentWebhooksController) ----------

  async handleStkCallback(callback: ParsedStkCallback) {
    const payment = await this.prisma.payment.findUnique({ where: { gatewayRequestId: callback.checkoutRequestId } });
    if (!payment) {
      this.logger.warn(`STK callback for unknown CheckoutRequestID ${callback.checkoutRequestId} (merchant ${callback.merchantRequestId})`);
      return;
    }
    // Idempotency: Safaricom may redeliver the same callback.
    if (payment.status === PaymentStatus.PAID || payment.status === PaymentStatus.FAILED) return;

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: callback.success
        ? { status: PaymentStatus.PAID, paidAt: new Date(), reference: callback.mpesaReceiptNumber ?? payment.reference }
        : { status: PaymentStatus.FAILED },
    });
    this.resolving.delete(payment.id);

    const tenancy = await this.prisma.tenancy.findUniqueOrThrow({ where: { id: payment.tenancyId } });
    await this.notifyPaymentResolved(tenancy.tenantId, updated, callback.success);
  }

  async handleC2bConfirmation(payload: C2bConfirmationPayload) {
    const existingPayment = await this.prisma.payment.findFirst({ where: { reference: payload.TransID } });
    const existingUnmatched = await this.prisma.unmatchedPayment.findUnique({ where: { transactionId: payload.TransID } });
    if (existingPayment || existingUnmatched) return; // already recorded — Safaricom retries deliveries

    const paymentAccount = await this.prisma.paymentAccount.findFirst({
      where: { OR: [{ payBillNumber: payload.BusinessShortCode }, { tillNumber: payload.BusinessShortCode }] },
    });
    const amount = Number(payload.TransAmount);
    const reference = payload.BillRefNumber?.trim();

    const tenancy = paymentAccount && reference ? await this.findActiveTenancyByReference(paymentAccount.propertyId, reference) : null;

    if (tenancy) {
      await this.applyExternalPayment(tenancy, {
        amount,
        payerPhone: payload.MSISDN,
        transactionId: payload.TransID,
        accountReference: reference as string,
        rawPayload: payload as unknown as Prisma.InputJsonValue,
      });
      return;
    }

    await this.prisma.unmatchedPayment.create({
      data: {
        businessShortCode: payload.BusinessShortCode,
        amount,
        payerPhone: payload.MSISDN,
        accountReference: reference || "(none given)",
        transactionId: payload.TransID,
        rawPayload: payload as unknown as Prisma.InputJsonValue,
        matchedPropertyId: paymentAccount?.propertyId ?? null,
      },
    });

    if (paymentAccount) {
      const property = await this.prisma.property.findUnique({ where: { id: paymentAccount.propertyId } });
      if (property) {
        await this.notifications.create(
          property.landlordId,
          NotificationType.PAYMENT_ALERT,
          `Received KES ${amount.toLocaleString("en-KE")} via PayBill with reference "${reference}" — couldn't match it to a tenant. Check Payments to resolve it.`,
        );
      }
    }
  }

  // ---------- Internals ----------

  private async initiateStk(
    due: { id: string; amount: Prisma.Decimal },
    tenancy: TenancyWithDestination,
    paymentAccount: PaymentAccountRow,
    accountReference: string,
  ) {
    if (this.resolving.has(due.id)) throw new ConflictException("A payment attempt for this period is already in progress");

    const shortcode = paymentAccount.method === "till" ? paymentAccount.tillNumber : paymentAccount.payBillNumber;
    if (!shortcode) throw new ConflictException("This property's PayBill/Till number isn't configured yet");

    const tenant = await this.prisma.user.findUniqueOrThrow({ where: { id: tenancy.tenantId } });
    const phoneNumber = this.normalizePhone(tenant.phone);

    const result = await this.gateway.initiateStkPush({
      businessShortCode: shortcode,
      phoneNumber,
      amount: Number(due.amount),
      accountReference,
      transactionDesc: `Rent - ${accountReference}`,
    });

    this.resolving.add(due.id);
    return this.prisma.payment.update({
      where: { id: due.id },
      data: {
        status: PaymentStatus.PENDING,
        channel: PaymentChannel.STK_PUSH,
        accountReference,
        gatewayRequestId: result.checkoutRequestId,
        gatewayResponse: result as unknown as Prisma.InputJsonValue,
        reference: null,
      },
    });
  }

  private scheduleWhatsappSimulation(paymentId: string, tenantId: string) {
    const delayMs = 3000 + Math.floor(Math.random() * 1500);
    setTimeout(async () => {
      try {
        const succeeds = Math.random() < WHATSAPP_SUCCESS_RATE;
        const payment = await this.prisma.payment.update({
          where: { id: paymentId },
          data: succeeds ? { status: PaymentStatus.PAID, paidAt: new Date() } : { status: PaymentStatus.FAILED },
        });
        await this.notifyPaymentResolved(tenantId, payment, succeeds);
      } finally {
        this.resolving.delete(paymentId);
      }
    }, delayMs);
  }

  private async applyExternalPayment(
    tenancy: { id: string; tenantId: string; rentAmount: Prisma.Decimal; leaseStart: Date },
    input: { amount: number; payerPhone: string; transactionId: string; accountReference: string; rawPayload: Prisma.InputJsonValue },
  ) {
    const due = await this.getOrCreateCurrentDue(tenancy);
    const updated = await this.prisma.payment.update({
      where: { id: due.id },
      data: {
        status: PaymentStatus.PAID,
        channel: PaymentChannel.PAYBILL_DIRECT,
        amount: input.amount, // record what Safaricom actually confirmed, not what was expected
        reference: input.transactionId,
        payerPhone: input.payerPhone,
        accountReference: input.accountReference,
        gatewayResponse: input.rawPayload,
        paidAt: new Date(),
      },
    });
    await this.notifyPaymentResolved(tenancy.tenantId, updated, true);
    return updated;
  }

  private async notifyPaymentResolved(tenantId: string, payment: { amount: Prisma.Decimal }, success: boolean) {
    const amountLabel = `KES ${Number(payment.amount).toLocaleString("en-KE")}`;
    await this.notifications.create(
      tenantId,
      success ? NotificationType.PAYMENT_SUCCEEDED : NotificationType.PAYMENT_FAILED,
      success ? `Payment of ${amountLabel} received — thank you` : `Your payment of ${amountLabel} didn't go through. Please try again`,
    );
  }

  private async findActiveTenancyByReference(propertyId: string, reference: string) {
    const normalized = reference.trim();

    const unit = await this.prisma.unit.findFirst({
      where: { propertyId, code: { equals: normalized, mode: "insensitive" } },
      include: { tenancies: { where: { status: TenancyStatus.ACTIVE }, take: 1 } },
    });
    if (unit?.tenancies[0]) return unit.tenancies[0];

    const tenant = await this.prisma.user.findFirst({ where: { tenantCode: normalized.toUpperCase() } });
    if (tenant) {
      const tenancy = await this.prisma.tenancy.findFirst({ where: { tenantId: tenant.id, status: TenancyStatus.ACTIVE, unit: { propertyId } } });
      if (tenancy) return tenancy;
    }
    return null;
  }

  private async getTenantPhoneOrPlaceholder(tenantId: string): Promise<string> {
    const tenant = await this.prisma.user.findUnique({ where: { id: tenantId } });
    return tenant?.phone ?? "254700000000";
  }

  private normalizePhone(phone: string | null): string {
    if (!phone) throw new ConflictException("Add a phone number in Settings before paying via M-Pesa");
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("254")) return digits;
    if (digits.startsWith("0")) return `254${digits.slice(1)}`;
    if (digits.startsWith("7") || digits.startsWith("1")) return `254${digits}`;
    throw new ConflictException("That phone number doesn't look valid for M-Pesa");
  }

  /** The current unpaid period for this tenancy, creating the next one if the last is already settled. */
  private async getOrCreateCurrentDue(tenancy: { id: string; rentAmount: Prisma.Decimal; leaseStart: Date }) {
    let due = await this.prisma.payment.findFirst({
      where: { tenancyId: tenancy.id, status: { not: PaymentStatus.PAID } },
      orderBy: { dueDate: "desc" },
    });

    if (!due) {
      const lastPaid = await this.prisma.payment.findFirst({
        where: { tenancyId: tenancy.id, status: PaymentStatus.PAID },
        orderBy: { dueDate: "desc" },
      });
      const dueDate = lastPaid ? this.addMonths(lastPaid.dueDate ?? tenancy.leaseStart, 1) : tenancy.leaseStart;
      due = await this.prisma.payment.create({
        data: {
          tenancyId: tenancy.id,
          amount: tenancy.rentAmount,
          channel: PaymentChannel.STK_PUSH,
          status: PaymentStatus.PENDING,
          dueDate,
        },
      });
    }

    if (due.status === PaymentStatus.PENDING && due.dueDate && due.dueDate < new Date()) {
      due = await this.prisma.payment.update({ where: { id: due.id }, data: { status: PaymentStatus.LATE } });
      await this.notifyOverdue(due);
    }

    return due;
  }

  private async notifyOverdue(payment: { tenancyId: string; amount: Prisma.Decimal }) {
    const tenancy = await this.prisma.tenancy.findUnique({
      where: { id: payment.tenancyId },
      include: { unit: { include: { property: true } }, tenant: { select: { firstName: true, lastName: true } } },
    });
    if (!tenancy) return;

    const staffIds = new Set<string>([tenancy.unit.property.landlordId]);
    const assignments = await this.prisma.caretakerAssignment.findMany({
      where: { propertyId: tenancy.unit.propertyId, inviteStatus: CaretakerInviteStatus.ACCEPTED },
      select: { caretakerId: true },
    });
    for (const a of assignments) staffIds.add(a.caretakerId);

    const amountLabel = `KES ${Number(payment.amount).toLocaleString("en-KE")}`;
    await Promise.all(
      [...staffIds].map((id) =>
        this.notifications.create(
          id,
          NotificationType.PAYMENT_ALERT,
          `${tenancy.tenant.firstName} ${tenancy.tenant.lastName}'s rent (${amountLabel}, unit ${tenancy.unit.code}) is now overdue`,
        ),
      ),
    );
  }

  private async getActiveTenancyOrThrow(tenantId: string): Promise<TenancyWithDestination & { tenantId: string }> {
    const tenancy = await this.prisma.tenancy.findFirst({
      where: { tenantId, status: TenancyStatus.ACTIVE },
      include: TENANCY_WITH_DESTINATION_INCLUDE,
    });
    if (!tenancy) throw new NotFoundException("No active lease found");
    return tenancy;
  }

  private addMonths(date: Date, months: number): Date {
    return new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
  }

  private withDestination<T extends object>(payment: T, paymentAccount: PaymentAccountRow | null) {
    return {
      ...payment,
      paymentAccount: paymentAccount
        ? {
            method: paymentAccount.method,
            payBillNumber: paymentAccount.payBillNumber,
            tillNumber: paymentAccount.tillNumber,
            bankName: paymentAccount.bankName,
            bankAccountNumber: paymentAccount.bankAccountNumber,
          }
        : null,
    };
  }

  private renderReceiptHtml(data: {
    tenantName: string;
    propertyName: string;
    unitCode: string;
    amount: number;
    channel: string;
    reference: string | null;
    paidAt: Date;
  }): string {
    const fmtKES = (n: number) => `KES ${n.toLocaleString("en-KE")}`;
    const fmtDate = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Receipt — ${data.reference ?? data.unitCode}</title>
<style>body{font-family:sans-serif;max-width:640px;margin:40px auto;color:#0B140F}
h1{font-size:22px}h2{font-size:15px;color:#5C665F;text-transform:uppercase;margin-top:28px}
table{width:100%;border-collapse:collapse;margin-top:8px}
td{padding:8px;border-bottom:1px solid #E4E2DA}
.total{font-weight:700}</style></head>
<body>
<h1>Payment Receipt</h1>
<p>${data.propertyName} — Unit ${data.unitCode}</p>
<h2>Payment</h2>
<table>
<tr><td>Tenant</td><td>${data.tenantName}</td></tr>
<tr><td>Reference</td><td>${data.reference ?? "—"}</td></tr>
<tr><td>Channel</td><td>${data.channel.replace("_", " ")}</td></tr>
<tr><td>Paid at</td><td>${fmtDate(data.paidAt)}</td></tr>
<tr class="total"><td>Amount</td><td>${fmtKES(data.amount)}</td></tr>
</table>
</body></html>`;
  }
}
