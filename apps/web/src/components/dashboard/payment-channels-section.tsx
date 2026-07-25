"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  listPaymentChannelTemplates,
  createPaymentChannelTemplate,
  updatePaymentChannelTemplate,
  deletePaymentChannelTemplate,
  setDefaultPaymentChannelTemplate,
  type PaymentChannelTemplate,
  type UpsertPaymentChannelTemplateInput,
} from "@/lib/payment-channels";
import { ApiError } from "@/lib/api";
import { FormButton } from "@/components/shared/form-button";
import { Modal } from "@/components/shared/modal";
import { Field, Input, Select } from "@/components/shared/field";
import { InlineError } from "@/components/shared/inline-error";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { SkeletonList } from "@/components/shared/skeletons";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

function summaryLine(c: PaymentChannelTemplate) {
  if (c.method === "till") return `Till ${c.tillNumber}`;
  if (c.method === "paybill") return `PayBill ${c.payBillNumber}`;
  return `${c.bankName ?? "Bank"} · PayBill ${c.payBillNumber}`;
}

/**
 * A landlord's saved payment-channel address book — separate from the live
 * per-property PaymentAccount that actually routes STK pushes. Saves
 * re-typing the same till/paybill for every property; "Fill from saved
 * channel" on the property payment form is what actually applies one.
 */
export function PaymentChannelsSection() {
  const [channels, setChannels] = React.useState<PaymentChannelTemplate[] | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PaymentChannelTemplate | null>(null);
  const [removing, setRemoving] = React.useState<PaymentChannelTemplate | null>(null);

  const refetch = React.useCallback(() => {
    listPaymentChannelTemplates().then(setChannels);
  }, []);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  async function handleSetDefault(id: string) {
    try {
      await setDefaultPaymentChannelTemplate(id);
      toast("Default channel updated.");
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="max-w-[560px]">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <div className="font-semibold text-[14px]">Saved payment channels</div>
          <p className="text-[13px] text-[var(--stone)] mt-1">
            Save a till, paybill or bank once, then reuse it when setting up any property&apos;s payment destination.
          </p>
        </div>
        <FormButton
          fullWidth={false}
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="px-4 shrink-0"
        >
          Add channel
        </FormButton>
      </div>

      {!channels && <SkeletonList rows={3} />}

      {channels && channels.length === 0 && (
        <EmptyState
          title="No saved channels yet"
          description="Add one to reuse it across properties instead of retyping the same till or paybill."
        />
      )}

      {channels && channels.length > 0 && (
        <div className="border border-[var(--line)] rounded-[14px] overflow-hidden bg-white">
          {channels.map((c, i) => (
            <div
              key={c.id}
              className="flex items-center justify-between px-4 py-[13px] gap-3 flex-wrap"
              style={i > 0 ? { borderTop: "1px solid var(--line)" } : undefined}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold truncate">{c.label}</span>
                  {c.isDefault && <StatusBadge tone="success">Default</StatusBadge>}
                </div>
                <div className="text-xs text-[var(--stone)] font-mono truncate">{summaryLine(c)}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {!c.isDefault && (
                  <button type="button" onClick={() => handleSetDefault(c.id)} className="text-[13px] font-semibold text-[var(--green)]">
                    Set default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setEditing(c);
                    setFormOpen(true);
                  }}
                  className="text-[13px] font-semibold text-[var(--stone)]"
                >
                  Edit
                </button>
                <button type="button" onClick={() => setRemoving(c)} className="text-[13px] font-semibold text-[var(--error)]">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PaymentChannelFormModal open={formOpen} onOpenChange={setFormOpen} initial={editing} onSaved={refetch} />

      {removing && (
        <ConfirmDialog
          open={Boolean(removing)}
          onOpenChange={(open) => !open && setRemoving(null)}
          title="Remove this payment channel?"
          description={`"${removing.label}" will be removed from your saved channels. Properties already using these details keep working — this only removes it from the reusable list.`}
          confirmLabel="Remove"
          onConfirm={async () => {
            await deletePaymentChannelTemplate(removing.id);
            toast("Channel removed.");
            refetch();
          }}
        />
      )}
    </div>
  );
}

function PaymentChannelFormModal({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: PaymentChannelTemplate | null;
  onSaved: () => void;
}) {
  const [label, setLabel] = React.useState("");
  const [method, setMethod] = React.useState<PaymentChannelTemplate["method"]>("paybill");
  const [payBillNumber, setPayBillNumber] = React.useState("");
  const [tillNumber, setTillNumber] = React.useState("");
  const [bankName, setBankName] = React.useState("");
  const [bankAccountNumber, setBankAccountNumber] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setLabel(initial?.label ?? "");
      setMethod(initial?.method ?? "paybill");
      setPayBillNumber(initial?.payBillNumber ?? "");
      setTillNumber(initial?.tillNumber ?? "");
      setBankName(initial?.bankName ?? "");
      setBankAccountNumber(initial?.bankAccountNumber ?? "");
      setError(null);
    }
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const input: UpsertPaymentChannelTemplateInput = { label, method, payBillNumber, tillNumber, bankName, bankAccountNumber };
      if (initial) await updatePaymentChannelTemplate(initial.id, input);
      else await createPaymentChannelTemplate(input);
      toast(initial ? "Channel updated." : "Channel added.");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} maxWidth={440}>
      <h3 className="font-display font-bold text-xl mb-5">{initial ? "Edit payment channel" : "Add payment channel"}</h3>
      {error && <InlineError>{error}</InlineError>}
      <form onSubmit={handleSubmit}>
        <Field label="Label" required className="mb-[14px]">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Main M-Pesa Till" required />
        </Field>
        <Field label="Method" required className="mb-[14px]">
          <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentChannelTemplate["method"])}>
            <option value="paybill">PayBill</option>
            <option value="till">Till</option>
            <option value="bank">Bank</option>
          </Select>
        </Field>
        {(method === "paybill" || method === "bank") && (
          <Field label={method === "bank" ? "Bank PayBill (business) number" : "Business number"} required className="mb-[14px]">
            <Input value={payBillNumber} onChange={(e) => setPayBillNumber(e.target.value)} placeholder="e.g. 542100" required />
          </Field>
        )}
        {method === "till" && (
          <Field label="Till number" required className="mb-[14px]">
            <Input value={tillNumber} onChange={(e) => setTillNumber(e.target.value)} placeholder="e.g. 897213" required />
          </Field>
        )}
        {method === "bank" && (
          <div className="grid grid-cols-2 gap-[14px] mb-[14px]">
            <Field label="Bank name">
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. Equity Bank" />
            </Field>
            <Field label="Account number">
              <Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="e.g. 0110xxxxxx" />
            </Field>
          </div>
        )}
        <div className="flex gap-[10px] mt-2">
          <FormButton variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </FormButton>
          <FormButton type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </FormButton>
        </div>
      </form>
    </Modal>
  );
}
