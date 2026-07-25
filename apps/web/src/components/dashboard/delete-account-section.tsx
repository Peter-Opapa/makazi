"use client";

import * as React from "react";
import { toast } from "sonner";
import { createSupportTicket } from "@/lib/support-tickets";
import { ApiError } from "@/lib/api";
import { Modal } from "@/components/shared/modal";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";

/**
 * Account deletion isn't self-service — it's handled by the team so tenancies,
 * caretaker access and records are unwound safely first. The request is filed
 * as a support ticket (visible in the Admin Portal); the operator follows up
 * and performs the actual removal.
 */
export function DeleteAccountSection() {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setReason("");
      setError(null);
      setDone(false);
    }
  }, [open]);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await createSupportTicket({
        subject: "Account deletion request",
        message: reason.trim() || "No reason provided.",
      });
      setDone(true);
      toast("Request received.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8 border-t border-[var(--line)] pt-6">
      <div className="font-semibold text-[14px] mb-1">Delete my account</div>
      <p className="text-[13px] text-[var(--stone)] mb-3 max-w-[520px]">
        Deletion is handled by our team so your tenancies and records are wound down safely. Send a request and
        we&apos;ll get back to you to assist.
      </p>
      <FormButton variant="outline" fullWidth={false} onClick={() => setOpen(true)} className="px-5 text-[var(--error)]">
        Request account deletion
      </FormButton>

      <Modal open={open} onOpenChange={setOpen} maxWidth={420}>
        {done ? (
          <div className="text-center py-2">
            <h3 className="font-display font-bold text-xl mb-2">Request received</h3>
            <p className="text-[13px] text-[var(--stone)] mb-6">
              Our team will get back to you in under 30 minutes to help with your account deletion.
            </p>
            <FormButton onClick={() => setOpen(false)}>Done</FormButton>
          </div>
        ) : (
          <>
            <h3 className="font-display font-bold text-xl mb-[6px]">Request account deletion</h3>
            <p className="text-[13px] text-[var(--stone)] mb-5">
              Tell us why you&apos;d like to delete your account. Our team will reach out in under 30 minutes to
              assist — your account stays active until then.
            </p>
            {error && <InlineError>{error}</InlineError>}
            <label className="block text-[13px] font-semibold mb-[6px]">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Let us know why you're leaving"
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px] mb-5"
            />
            <div className="flex gap-[10px]">
              <FormButton variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                Cancel
              </FormButton>
              <FormButton variant="destructive" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Sending…" : "Send request"}
              </FormButton>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
