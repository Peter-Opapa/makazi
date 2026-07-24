"use client";

import * as React from "react";
import { ApiError } from "@/lib/api";
import { resolveUnmatchedPayment, type UnmatchedPayment } from "@/lib/payments";
import { listTenants, type TenantListItem } from "@/lib/tenants";
import { Modal } from "@/components/shared/modal";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";

function fmtKES(amount: string) {
  return `KES ${Number(amount).toLocaleString("en-KE")}`;
}

export function ResolveUnmatchedPaymentModal({
  open,
  onOpenChange,
  payment,
  onResolved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: UnmatchedPayment;
  onResolved: () => void;
}) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<TenantListItem[]>([]);
  const [selected, setSelected] = React.useState<TenantListItem | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelected(null);
      setError(null);
    }
  }, [open]);

  React.useEffect(() => {
    if (selected) return;
    const timer = setTimeout(async () => {
      const res = await listTenants(query || undefined);
      setResults(res.filter((t) => t.tenancies.length > 0));
    }, 250);
    return () => clearTimeout(timer);
  }, [query, selected]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selected || !selected.tenancies[0]) {
      setError("Select a tenant with an active tenancy.");
      return;
    }
    setSubmitting(true);
    try {
      await resolveUnmatchedPayment(payment.id, selected.tenancies[0].id);
      onResolved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} maxWidth={440}>
      <h3 className="font-display font-bold text-xl mb-[6px]">Resolve payment</h3>
      <p className="text-[13px] text-[var(--stone)] mb-5">
        {fmtKES(payment.amount)} from {payment.payerPhone}, reference &quot;{payment.accountReference}&quot; — assign it to
        the right tenant.
      </p>

      {error && <InlineError>{error}</InlineError>}

      <form onSubmit={handleSubmit}>
        <div className="mb-[22px]">
          <label className="block text-[13px] font-semibold mb-[6px]">Tenant</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, phone or email"
            className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px] mb-2"
          />
          {selected ? (
            <div className="flex justify-between items-center border border-[var(--green)] bg-[var(--green-soft)] rounded-[9px] px-3 py-[10px]">
              <span className="text-[13px] font-semibold">
                {selected.firstName} {selected.lastName} — {selected.tenancies[0]?.unit.property.name} ·{" "}
                {selected.tenancies[0]?.unit.code}
              </span>
              <button type="button" onClick={() => setSelected(null)} className="text-xs text-[var(--stone)]">
                Change
              </button>
            </div>
          ) : (
            results.length > 0 && (
              <div className="border border-[var(--line)] rounded-[9px] overflow-hidden">
                {results.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="w-full text-left px-3 py-[10px] text-[13px] border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--paper)]"
                  >
                    <div className="font-semibold">
                      {t.firstName} {t.lastName}
                    </div>
                    <div className="text-xs text-[var(--stone)]">
                      {t.tenancies[0]?.unit.property.name} · {t.tenancies[0]?.unit.code}
                    </div>
                  </button>
                ))}
              </div>
            )
          )}
        </div>

        <FormButton type="submit" disabled={submitting}>
          {submitting ? "Resolving…" : "Assign payment"}
        </FormButton>
      </form>
    </Modal>
  );
}
