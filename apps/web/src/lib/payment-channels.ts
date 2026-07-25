import { apiFetch } from "./api";

export interface PaymentChannelTemplate {
  id: string;
  label: string;
  method: "paybill" | "till" | "bank";
  payBillNumber: string | null;
  tillNumber: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertPaymentChannelTemplateInput {
  label: string;
  method: "paybill" | "till" | "bank";
  payBillNumber?: string;
  tillNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
}

/** A landlord's saved payment-channel address book — a reusable starting point when setting up a property's payment destination. Separate from the live per-property PaymentAccount that actually routes payments. */
export function listPaymentChannelTemplates() {
  return apiFetch<PaymentChannelTemplate[]>("/payment-channel-templates");
}

export function createPaymentChannelTemplate(input: UpsertPaymentChannelTemplateInput) {
  return apiFetch<PaymentChannelTemplate>("/payment-channel-templates", { method: "POST", body: JSON.stringify(input) });
}

export function updatePaymentChannelTemplate(id: string, input: UpsertPaymentChannelTemplateInput) {
  return apiFetch<PaymentChannelTemplate>(`/payment-channel-templates/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deletePaymentChannelTemplate(id: string) {
  return apiFetch<void>(`/payment-channel-templates/${id}`, { method: "DELETE" });
}

export function setDefaultPaymentChannelTemplate(id: string) {
  return apiFetch<void>(`/payment-channel-templates/${id}/set-default`, { method: "POST" });
}
