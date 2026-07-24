"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getAuthDraft, updateAuthDraft, verifyResetOtp, forgotPassword } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { OtpInput } from "@/components/shared/otp-input";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";

const RESEND_SECONDS = 30;

export default function ForgotPasswordVerifyPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState<string[]>(Array(6).fill(""));
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [countdown, setCountdown] = React.useState(RESEND_SECONDS);

  React.useEffect(() => {
    const draft = getAuthDraft();
    if (!draft.forgotEmail) {
      router.replace("/forgot-password");
      return;
    }
    setEmail(draft.forgotEmail);
  }, [router]);

  React.useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  async function handleVerify() {
    setError(null);
    setSubmitting(true);
    try {
      const otp = code.join("");
      await verifyResetOtp({ email, code: otp });
      updateAuthDraft({ forgotCode: otp });
      router.push("/forgot-password/reset");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (countdown > 0) return;
    try {
      await forgotPassword({ email });
      setCountdown(RESEND_SECONDS);
    } catch {
      // Non-fatal — the user can just try again once the countdown allows.
    }
  }

  return (
    <div>
      <h2 className="font-display font-bold text-[26px] tracking-[-0.02em] mb-2">Enter reset code</h2>
      <p className="text-sm text-[var(--stone)] mb-[26px]">
        Sent to <strong>{email || "you@example.com"}</strong>
      </p>

      {error && <InlineError>{error}</InlineError>}

      <OtpInput value={code} onChange={setCode} disabled={submitting} label="Password reset code" />

      <FormButton onClick={handleVerify} disabled={submitting || code.join("").length !== 6} className="mb-4">
        {submitting ? "Verifying…" : "Verify"}
      </FormButton>
      <p className="text-center text-[13px] text-[var(--stone)]">
        {countdown > 0 ? (
          `Resend in ${countdown}s`
        ) : (
          <>
            Didn&apos;t get it?{" "}
            <button type="button" onClick={handleResend} className="font-semibold text-[var(--green)]">
              Resend code
            </button>
          </>
        )}
      </p>
    </div>
  );
}
