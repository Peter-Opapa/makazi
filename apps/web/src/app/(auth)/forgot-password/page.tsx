"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { forgotPassword, updateAuthDraft } from "@/lib/auth";
import { FormButton } from "@/components/shared/form-button";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await forgotPassword({ email });
    } finally {
      // Always proceed to the OTP screen, whether or not the email is
      // registered — the backend never reveals which, to avoid account
      // enumeration.
      updateAuthDraft({ forgotEmail: email });
      router.push("/forgot-password/verify");
    }
  }

  return (
    <div>
      <h2 className="font-display font-bold text-[26px] tracking-[-0.02em] mb-2">Reset your password</h2>
      <p className="text-sm text-[var(--stone)] mb-6">Enter your email and we&apos;ll send you a reset code.</p>

      <form onSubmit={handleSubmit}>
        <div className="mb-[22px]">
          <label className="block text-[13px] font-semibold mb-[6px]">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-[14px] py-3 border-[1.5px] border-[var(--line-2)] rounded-[10px] focus:outline-2 focus:outline-[var(--green)] focus:outline-offset-1"
          />
        </div>
        <FormButton type="submit" disabled={submitting} className="mb-4">
          {submitting ? "Sending…" : "Send reset code"}
        </FormButton>
      </form>
      <p className="text-center text-sm">
        <Link href="/login">← Back to log in</Link>
      </p>
    </div>
  );
}
