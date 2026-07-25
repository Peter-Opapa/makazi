"use client";

import * as React from "react";
import { ApiError } from "@/lib/api";
import { Modal } from "@/components/shared/modal";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";
import { Field, Input } from "@/components/shared/field";

/** Shared by the Caretakers and Tenants pages — same shape (email/phone), only editable before the person claims their invite. */
export function EditContactModal({
  open,
  onOpenChange,
  name,
  currentEmail,
  currentPhone,
  onSubmit,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  currentEmail: string | null;
  currentPhone: string | null;
  onSubmit: (input: { email?: string; phone?: string }) => Promise<unknown>;
  onUpdated: () => void;
}) {
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setEmail(currentEmail ?? "");
      setPhone(currentPhone ?? "");
      setError(null);
    }
  }, [open, currentEmail, currentPhone]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ email: email || undefined, phone: phone || undefined });
      onUpdated();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} maxWidth={420}>
      <h3 className="font-display font-bold text-xl mb-[6px]">Edit {name}&apos;s contact info</h3>
      <p className="text-[13px] text-[var(--stone)] mb-5">
        Only editable before they join Makazi — once they claim their invite, they manage this themselves.
      </p>
      {error && <InlineError>{error}</InlineError>}
      <form onSubmit={handleSubmit}>
        <Field label="Phone" required className="mb-[14px]">
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" />
        </Field>
        <Field label="Email" className="mb-[22px]">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <FormButton type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save changes"}
        </FormButton>
      </form>
    </Modal>
  );
}
