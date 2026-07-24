"use client";

import * as React from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { upsertPaymentAccount, type PaymentAccount } from "@/lib/properties";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";
import { cn } from "@/lib/utils";

const METHODS: { value: PaymentAccount["method"]; label: string }[] = [
  { value: "paybill", label: "PayBill" },
  { value: "till", label: "Till" },
  { value: "bank", label: "Bank" },
];

const METHOD_LABEL: Record<PaymentAccount["method"], string> = {
  paybill: "PayBill",
  till: "Till",
  bank: "Bank",
};

function CurrentPaymentSummary({
  account,
  onChangeClick,
}: {
  account: PaymentAccount;
  onChangeClick: () => void;
}) {
  const rows: { label: string; value: string }[] =
    account.method === "paybill"
      ? [{ label: "Business number", value: account.payBillNumber ?? "—" }]
      : account.method === "till"
        ? [{ label: "Till number", value: account.tillNumber ?? "—" }]
        : [
            { label: "Bank PayBill (business) number", value: account.payBillNumber ?? "—" },
            ...(account.bankName ? [{ label: "Bank", value: account.bankName }] : []),
            ...(account.bankAccountNumber ? [{ label: "Account number", value: account.bankAccountNumber }] : []),
          ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--green-soft)] text-[var(--green-deep)] px-3 py-1 text-xs font-semibold">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M4 12l5 5L20 6" />
          </svg>
          Active — {METHOD_LABEL[account.method]}
        </span>
      </div>
      <div className="flex flex-col gap-[10px] mb-5">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between text-[13px]">
            <span className="text-[var(--stone)]">{r.label}</span>
            <span className="font-mono font-semibold">{r.value}</span>
          </div>
        ))}
      </div>
      {account.method !== "till" && (
        <p className="text-xs text-[var(--stone)] mb-5">
          Each tenant's account number is filled in automatically as their unit code (e.g. A101) — that's how a
          payment is matched back to the right tenant on a shared business number.
        </p>
      )}
      <FormButton variant="outline" onClick={onChangeClick}>
        Change payment method
      </FormButton>
    </div>
  );
}

export function PropertySettingsForm({
  propertyId,
  initial,
  onSaved,
}: {
  propertyId: string;
  initial: PaymentAccount | null;
  onSaved: () => void;
}) {
  const [current, setCurrent] = React.useState<PaymentAccount | null>(initial);
  const [editing, setEditing] = React.useState(!initial);
  const [method, setMethod] = React.useState<PaymentAccount["method"]>(initial?.method ?? "paybill");
  const [payBillNumber, setPayBillNumber] = React.useState(initial?.payBillNumber ?? "");
  const [tillNumber, setTillNumber] = React.useState(initial?.tillNumber ?? "");
  const [bankName, setBankName] = React.useState(initial?.bankName ?? "");
  const [bankAccountNumber, setBankAccountNumber] = React.useState(initial?.bankAccountNumber ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    setCurrent(initial);
    setEditing(!initial);
  }, [initial]);

  function startEditing() {
    setMethod(current?.method ?? "paybill");
    setPayBillNumber(current?.payBillNumber ?? "");
    setTillNumber(current?.tillNumber ?? "");
    setBankName(current?.bankName ?? "");
    setBankAccountNumber(current?.bankAccountNumber ?? "");
    setError(null);
    setEditing(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const saved = await upsertPaymentAccount(propertyId, { method, payBillNumber, tillNumber, bankName, bankAccountNumber });
      setCurrent(saved);
      setEditing(false);
      toast("Payment destination saved.");
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border border-[var(--line)] rounded-2xl bg-white p-5 max-w-[420px]">
      <div className="text-xs font-semibold text-[var(--stone)] uppercase tracking-wide mb-4">Payment destination</div>
      <p className="text-[13px] text-[var(--stone)] mb-4">Tenants pay directly here — Makazi never touches the money.</p>

      {error && <InlineError icon={false}>{error}</InlineError>}

      {!editing && current ? (
        <CurrentPaymentSummary account={current} onChangeClick={startEditing} />
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2 mb-[18px]">
            {METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMethod(m.value)}
                className={cn(
                  "flex-1 rounded-[9px] py-[10px] text-[13px] font-semibold",
                  method === m.value ? "bg-[var(--ink)] text-white" : "bg-transparent border-[1.5px] border-[var(--line-2)] text-[var(--ink)]",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          {method === "paybill" && (
            <div className="mb-[10px]">
              <label className="block text-[13px] font-semibold mb-[6px]">Business number</label>
              <input
                type="text"
                required
                value={payBillNumber}
                onChange={(e) => setPayBillNumber(e.target.value)}
                placeholder="e.g. 542100"
                className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
              />
              <p className="text-xs text-[var(--stone)] mt-[10px] mb-[12px]">
                This is the shared PayBill business number tenants pay to. You don't set an account number — each
                tenant's is filled in automatically as their unit code (e.g. A101), so every payment is matched back
                to the right tenant.
              </p>
            </div>
          )}
          {method === "till" && (
            <div className="mb-[22px]">
              <label className="block text-[13px] font-semibold mb-[6px]">Till number</label>
              <input
                type="text"
                required
                value={tillNumber}
                onChange={(e) => setTillNumber(e.target.value)}
                placeholder="e.g. 897213"
                className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
              />
            </div>
          )}
          {method === "bank" && (
            <div className="mb-[22px]">
              <p className="text-xs text-[var(--stone)] mb-3">
                Paid via your bank&apos;s own PayBill number (e.g. KCB Paybill, Equity Paybill) — Makazi still routes the
                payment through M-Pesa, it just lands in your bank account.
              </p>
              <div className="mb-[14px]">
                <label className="block text-[13px] font-semibold mb-[6px]">Bank PayBill (business) number</label>
                <input
                  type="text"
                  required
                  value={payBillNumber}
                  onChange={(e) => setPayBillNumber(e.target.value)}
                  placeholder="e.g. 522533"
                  className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-[14px]">
                <div>
                  <label className="block text-[13px] font-semibold mb-[6px]">
                    Bank name <span className="text-[var(--stone)] font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Equity Bank"
                    className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold mb-[6px]">
                    Account number <span className="text-[var(--stone)] font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="e.g. 0110xxxxxx"
                    className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-[10px]">
            {current && (
              <FormButton variant="outline" type="button" onClick={() => setEditing(false)} disabled={submitting}>
                Cancel
              </FormButton>
            )}
            <FormButton type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save payment destination"}
            </FormButton>
          </div>
        </form>
      )}
    </div>
  );
}
