"use client";

import * as React from "react";
import { toast } from "sonner";
import { UnitStatus } from "@makazi/shared-types";
import { ApiError } from "@/lib/api";
import { listUnits, assignTenant, type Unit } from "@/lib/properties";
import { registerTenant } from "@/lib/tenants";
import { Modal } from "@/components/shared/modal";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";

/**
 * A first-time-onboarding shortcut that collects everything in one go
 * (identity + property + unit + lease), then calls the same registerTenant
 * + assignTenant endpoints the two-step Tenants-page flow uses — kept
 * separate from RegisterTenantModal/AssignTenantModal, which correctly
 * serve the "register now, assign later" case.
 */
export function AddTenantWizard({
  open,
  onOpenChange,
  properties,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: { id: string; name: string }[];
  onAdded: () => void;
}) {
  const [propertyId, setPropertyId] = React.useState(properties[0]?.id ?? "");
  const [units, setUnits] = React.useState<Unit[]>([]);
  const [unitId, setUnitId] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [leaseStart, setLeaseStart] = React.useState(new Date().toISOString().slice(0, 10));
  const [leaseEnd, setLeaseEnd] = React.useState("");
  const [rentAmount, setRentAmount] = React.useState("");
  const [depositAmount, setDepositAmount] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [generatedCode, setGeneratedCode] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setPropertyId(properties[0]?.id ?? "");
      setUnitId("");
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      setLeaseEnd("");
      setRentAmount("");
      setDepositAmount("");
      setError(null);
      setGeneratedCode(null);
    }
  }, [open, properties]);

  React.useEffect(() => {
    if (!propertyId) return;
    setUnitId("");
    listUnits(propertyId, { status: UnitStatus.VACANT }).then(setUnits);
  }, [propertyId]);

  function handleUnitChange(id: string) {
    setUnitId(id);
    const unit = units.find((u) => u.id === id);
    if (unit?.rentAmount) setRentAmount(String(Number(unit.rentAmount)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!unitId) {
      setError("Select a vacant unit.");
      return;
    }
    setSubmitting(true);
    try {
      const { tenant } = await registerTenant({ firstName, lastName, phone, email: email || undefined });
      const { tenantCode } = await assignTenant(unitId, {
        existingTenantId: tenant.id,
        leaseStart,
        leaseEnd: leaseEnd || undefined,
        rentAmount: Number(rentAmount),
        depositAmount: depositAmount ? Number(depositAmount) : undefined,
      });
      if (tenantCode) {
        setGeneratedCode(tenantCode);
      } else {
        toast("Tenant added.");
        onAdded();
        onOpenChange(false);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDoneAfterCodeReveal() {
    onAdded();
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
          <h3 className="font-display font-bold text-xl mb-2">Tenant added</h3>
          <p className="text-[13px] text-[var(--stone)] mb-5">
            {firstName} has no email on file, so share this code with them directly — it won&apos;t be shown again.
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
    <Modal open={open} onOpenChange={onOpenChange} maxWidth={480}>
      <h3 className="font-display font-bold text-xl mb-[6px]">Add a tenant</h3>
      <p className="text-[13px] text-[var(--stone)] mb-5">Registers and assigns them to a unit in one step.</p>

      {error && <InlineError>{error}</InlineError>}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-[14px] mb-[14px]">
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">Property</label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">Vacant unit</label>
            <select
              required
              value={unitId}
              onChange={(e) => handleUnitChange(e.target.value)}
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
            >
              <option value="" disabled>
                {units.length ? "Select a unit" : "No vacant units"}
              </option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-[14px] mb-[14px]">
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">First name</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">Last name</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-[14px] mb-[14px]">
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">Phone</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+254 7XX XXX XXX"
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">
              Email <span className="text-[var(--stone)] font-normal">(optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
            />
          </div>
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
          {submitting ? "Adding…" : "Add tenant"}
        </FormButton>
      </form>
    </Modal>
  );
}
