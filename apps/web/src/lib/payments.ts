import type { PaymentChannel, PaymentStatus } from "@makazi/shared-types";
import { apiFetch } from "./api";

export interface PaymentDestination {
  method: "paybill" | "till" | "bank";
  payBillNumber: string | null;
  tillNumber: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
}

export interface Payment {
  id: string;
  tenancyId: string;
  amount: string;
  channel: PaymentChannel;
  status: PaymentStatus;
  reference: string | null;
  receiptUrl: string | null;
  dueDate: string | null;
  paidAt: string | null;
  payerPhone: string | null;
  accountReference: string | null;
  createdAt: string;
  updatedAt: string;
  paymentAccount: PaymentDestination | null;
}

export interface PaymentHistoryItem extends Payment {
  tenancy: { id: string; unit: { id: string; code: string; property: { id: string; name: string } } };
}

export interface PaymentLedgerItem extends Payment {
  tenancy: {
    id: string;
    tenant: { id: string; firstName: string; lastName: string; phone: string | null };
    unit: { id: string; code: string; property: { id: string; name: string } };
  };
}

export interface UnmatchedPayment {
  id: string;
  businessShortCode: string;
  amount: string;
  payerPhone: string;
  accountReference: string;
  transactionId: string;
  createdAt: string;
  matchedProperty: { id: string; name: string } | null;
}

export interface RentalPassport {
  hasHistory: boolean;
  score: number | null;
  label: string;
  onTimeRate: number | null;
  monthsAsTenant: number;
  totalPayments: number;
}

export function getRentStatus() {
  return apiFetch<Payment>("/payments/rent-status");
}

export function initiatePayment(channel: PaymentChannel) {
  return apiFetch<Payment>("/payments/initiate", { method: "POST", body: JSON.stringify({ channel }) });
}

export function getPayment(id: string) {
  return apiFetch<Payment>(`/payments/${id}`);
}

export function listPayments() {
  return apiFetch<PaymentHistoryItem[]>("/payments");
}

export function getReceipt(id: string) {
  return apiFetch<{ url: string }>(`/payments/${id}/receipt`);
}

export function getRentalPassport() {
  return apiFetch<RentalPassport>("/payments/rental-passport");
}

// ---------- Landlord / Caretaker ledger ----------

export function listLedger(params?: { propertyId?: string; status?: PaymentStatus }) {
  const qs = new URLSearchParams();
  if (params?.propertyId) qs.set("propertyId", params.propertyId);
  if (params?.status) qs.set("status", params.status);
  const str = qs.toString();
  return apiFetch<PaymentLedgerItem[]>(`/payments/ledger${str ? `?${str}` : ""}`);
}

export function listUnmatchedPayments(propertyId?: string) {
  return apiFetch<UnmatchedPayment[]>(`/payments/unmatched${propertyId ? `?propertyId=${propertyId}` : ""}`);
}

export function resolveUnmatchedPayment(id: string, tenancyId: string) {
  return apiFetch<Payment>(`/payments/unmatched/${id}/resolve`, {
    method: "POST",
    body: JSON.stringify({ tenancyId }),
  });
}
