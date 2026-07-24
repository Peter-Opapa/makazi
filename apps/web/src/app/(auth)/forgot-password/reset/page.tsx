"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getAuthDraft, resetPassword } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    const draft = getAuthDraft();
    if (!draft.forgotEmail || !draft.forgotCode) {
      router.replace("/forgot-password");
      return;
    }
    setEmail(draft.forgotEmail);
    setCode(draft.forgotCode);
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      setError("Passwords don't match. Please try again.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await resetPassword({ email, code, newPassword });
      router.push("/forgot-password/success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="font-display font-bold text-[26px] tracking-[-0.02em] mb-2">Set a new password</h2>
      <p className="text-sm text-[var(--stone)] mb-6">Choose something you haven&apos;t used before.</p>

      {error && <InlineError icon={false}>{error}</InlineError>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-[13px] font-semibold mb-[6px]">New password</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full px-[14px] py-3 border-[1.5px] border-[var(--line-2)] rounded-[10px] focus:outline-2 focus:outline-[var(--green)] focus:outline-offset-1"
          />
        </div>
        <div className="mb-[22px]">
          <label className="block text-[13px] font-semibold mb-[6px]">Confirm password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            className="w-full px-[14px] py-3 border-[1.5px] border-[var(--line-2)] rounded-[10px] focus:outline-2 focus:outline-[var(--green)] focus:outline-offset-1"
          />
        </div>
        <FormButton type="submit" disabled={submitting}>
          {submitting ? "Resetting…" : "Reset password"}
        </FormButton>
      </form>
    </div>
  );
}
