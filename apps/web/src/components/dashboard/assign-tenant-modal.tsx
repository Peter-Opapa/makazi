"use client";

import * as React from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { assignTenant, type Unit } from "@/lib/properties";
import { listTenants, type TenantListItem } from "@/lib/tenants";
import { Modal } from "@/components/shared/modal";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";

export function AssignTenantModal({
  open,
  onOpenChange,
  unit,
  onAssigned,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: Unit;
  onAssigned: () => void;
}) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<TenantListItem[]>([]);
  const [selected, setSelected] = React.useState<TenantListItem | null>(null);
  const [leaseStart, setLeaseStart] = React.useState(new Date().toISOString().slice(0, 10));
  const [leaseEnd, setLeaseEnd] = React.useState("");
  const [rentAmount, setRentAmount] = React.useState(unit.rentAmount ? String(Number(unit.rentAmount)) : "");
  const [depositAmount, setDepositAmount] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [generatedCode, setGeneratedCode] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelected(null);
      setLeaseEnd("");
      setDepositAmount("");
      setError(null);
      setGeneratedCode(null);
    }
  }, [open]);

  React.useEffect(() => {
    if (selected) return;
    const timer = setTimeout(async () => {
      const res = await listTenants(query || undefined);
      setResults(res);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, selected]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selected) {
      setError("Select a tenant first.");
      return;
    }

    setSubmitting(true);
    try {
      const { tenantCode } = await assignTenant(unit.id, {
        existingTenantId: selected.id,
        leaseStart,
        leaseEnd: leaseEnd || undefined,
        rentAmount: Number(rentAmount),
        depositAmount: depositAmount ? Number(depositAmount) : undefined,
      });

      if (tenantCode) {
        setGeneratedCode(tenantCode);
      } else {
        toast("Tenant assigned.");
        onAssigned();
        onOpenChange(false);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDoneAfterCodeReveal() {
    onAssigned();
    onOpenChange(false);
  }

  if (generatedCode) {
    return (
      <Modal open={open} onOpenChange={onOpenChange} maxWidth={420}>
        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-full bg-[var(--green-soft)] flex items-center justify-center mx-auto mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--green-deep)" strokeWidth={2}>
              <path d="M4 12l5 5L20 6" />
            </svg>
          </div>
          <h3 className="font-display font-bold text-xl mb-2">Tenant assigned</h3>
          <p className="text-[13px] text-[var(--stone)] mb-5">
            Share this code with {selected?.firstName} so they can set up their own login — it won&apos;t be shown again.
          </p>
          <div className="font-mono text-2xl font-bold tracking-wide bg-[var(--paper)] border border-[var(--line)] rounded-[12px] py-4 mb-6">
            {generatedCode}
          </div>
          <FormButton onClick={handleDoneAfterCodeReveal}>Done</FormButton>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} maxWidth={460}>
      <h3 className="font-display font-bold text-xl mb-[6px]">Assign tenant to {unit.code}</h3>
      <p className="text-[13px] text-[var(--stone)] mb-5">
        Pick a registered tenant who isn&apos;t already in a unit. Need to add someone new? Register them from the Tenants
        page first.
      </p>

      {error && <InlineError>{error}</InlineError>}

      <form onSubmit={handleSubmit}>
        <div className="mb-[14px]">
          <label className="block text-[13px] font-semibold mb-[6px]">Search tenants</label>
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
                {selected.firstName} {selected.lastName}
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
                    <div className="text-xs text-[var(--stone)]">{t.phone ?? t.email}</div>
                  </button>
                ))}
              </div>
            )
          )}
        </div>

        <div className="grid grid-cols-2 gap-[14px] mb-[14px]">
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">Lease start</label>
            <input
              type="date"
              required
              value={leaseStart}
              onChange={(e) => setLeaseStart(e.target.value)}
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">
              Lease end <span className="text-[var(--stone)] font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={leaseEnd}
              onChange={(e) => setLeaseEnd(e.target.value)}
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-[14px] mb-[22px]">
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">Rent (KES)</label>
            <input
              type="number"
              required
              min={0}
              value={rentAmount}
              onChange={(e) => setRentAmount(e.target.value)}
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">
              Deposit (KES) <span className="text-[var(--stone)] font-normal">(optional)</span>
            </label>
            <input
              type="number"
              min={0}
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
            />
          </div>
        </div>

        <FormButton type="submit" disabled={submitting}>
          {submitting ? "Assigning…" : "Assign tenant"}
        </FormButton>
      </form>
    </Modal>
  );
}
