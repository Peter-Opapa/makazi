"use client";

import * as React from "react";
import { Modal } from "@/components/shared/modal";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";
import { ApiError } from "@/lib/api";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void>;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) setError(null);
  }, [open]);

  async function handleConfirm() {
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} maxWidth={400}>
      <h3 className="font-display font-bold text-xl mb-[6px]">{title}</h3>
      <p className="text-[13px] text-[var(--stone)] mb-5">{description}</p>
      {error && <InlineError icon={false}>{error}</InlineError>}
      <div className="flex gap-[10px]">
        <FormButton variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
          Cancel
        </FormButton>
        <FormButton variant="destructive" onClick={handleConfirm} disabled={submitting}>
          {submitting ? "Please wait…" : confirmLabel}
        </FormButton>
      </div>
    </Modal>
  );
}
