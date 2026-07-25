"use client";

import * as React from "react";
import { ApiError } from "@/lib/api";
import { registerTenant, type RegisterTenantResult } from "@/lib/tenants";
import { Modal } from "@/components/shared/modal";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";

export function RegisterTenantModal({
  open,
  onOpenChange,
  onRegistered,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegistered: () => void;
}) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<RegisterTenantResult | null>(null);

  React.useEffect(() => {
    if (open) {
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      setError(null);
      setResult(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      setResult(await registerTenant({ firstName, lastName, phone, email: email || undefined }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDone() {
    onRegistered();
    onOpenChange(false);
  }

  if (result) {
    return (
      <Modal open={open} onOpenChange={onOpenChange} maxWidth={420}>
        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-full bg-[var(--green-soft)] flex items-center justify-center mx-auto mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--green-deep)" strokeWidth={2}>
              <path d="M4 12l5 5L20 6" />
            </svg>
          </div>
          <h3 className="font-display font-bold text-xl mb-2">
            {result.reused ? "Existing tenant found" : "Tenant registered"}
          </h3>
          {result.reused ? (
            <p className="text-[13px] text-[var(--stone)] mb-6">
              {firstName} already has a Makazi account. Assign them to a unit from a property&apos;s Units tab — they&apos;ll
              get an invite to accept the new tenancy.
            </p>
          ) : result.tenantCode ? (
            <>
              <p className="text-[13px] text-[var(--stone)] mb-5">
                {firstName} isn&apos;t assigned to a unit yet — do that from a property&apos;s Units tab. Share this code with
                them so they can set up their own login — it won&apos;t be shown again.
              </p>
              <div className="font-mono text-2xl font-bold tracking-wide bg-[var(--paper)] border border-[var(--line)] rounded-[12px] py-4 mb-6">
                {result.tenantCode}
              </div>
            </>
          ) : (
            <p className="text-[13px] text-[var(--stone)] mb-6">
              {firstName} isn&apos;t assigned to a unit yet — do that from a property&apos;s Units tab.
            </p>
          )}
          <FormButton onClick={handleDone}>Done</FormButton>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} maxWidth={460}>
      <h3 className="font-display font-bold text-xl mb-[6px]">Register tenant</h3>
      <p className="text-[13px] text-[var(--stone)] mb-5">
        Creates the tenant&apos;s identity. Assign them to a unit afterwards from Properties.
      </p>

      {error && <InlineError>{error}</InlineError>}

      <form onSubmit={handleSubmit}>
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
        <div className="grid grid-cols-2 gap-[14px] mb-[22px]">
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

        <FormButton type="submit" disabled={submitting}>
          {submitting ? "Registering…" : "Register tenant"}
        </FormButton>
      </form>
    </Modal>
  );
}
