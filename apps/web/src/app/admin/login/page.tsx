"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { staffLogin, verifyStaffMfa, forgotPassword, updateAuthDraft } from "@/lib/auth";
import { setToken, ApiError } from "@/lib/api";
import { OtpInput } from "@/components/shared/otp-input";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";

type Step = "creds" | "mfa" | "forgot";

export default function StaffLoginPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("creds");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [mfaCode, setMfaCode] = React.useState<string[]>(Array(6).fill(""));
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmitCreds(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await staffLogin({ email, password });
      setStep("mfa");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitMfa() {
    setError(null);
    setSubmitting(true);
    try {
      const { accessToken } = await verifyStaffMfa({ email, password, code: mfaCode.join("") });
      setToken(accessToken);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  async function handleSendReset(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await forgotPassword({ email });
    } finally {
      updateAuthDraft({ forgotEmail: email });
      router.push("/forgot-password/verify");
    }
  }

  return (
    <div className="min-h-screen flex flex-wrap">
      <div
        className="flex flex-col justify-between text-white"
        style={{ flex: "1 1 300px", minWidth: 280, maxWidth: 400, background: "var(--green-deep)", padding: "clamp(32px,4vw,56px)" }}
      >
        <div>
          <div className="flex items-center gap-[10px] mb-20">
            <img src="/makazi-mark-light.png" alt="" className="h-[26px]" />
            <span className="font-display font-extrabold tracking-[0.12em] text-[15px]">MAKAZI ADMIN</span>
          </div>
          <h1 className="font-display font-bold text-[28px] tracking-[-0.02em] leading-[1.25] mb-[18px]">
            Internal operations portal
          </h1>
          <p className="text-sm leading-[1.6]" style={{ color: "#C7CEC9" }}>
            Restricted to authorized Makazi staff. All actions are logged and audited.
          </p>
        </div>
        <div className="text-xs" style={{ color: "#8FB0A2" }}>
          Protected by MFA · SOC2-style access controls
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10" style={{ minWidth: 300 }}>
        <div className="w-full max-w-[380px]">
          {step === "creds" && (
            <>
              <h2 className="font-display font-bold text-2xl mb-2">Staff sign in</h2>
              <p className="text-[13px] text-[var(--stone)] mb-[22px]">Use your Makazi staff credentials.</p>

              {error && <InlineError>{error}</InlineError>}

              <form onSubmit={handleSubmitCreds}>
                <div className="mb-[14px]">
                  <label className="block text-[13px] font-semibold mb-[6px]">Work email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@makazi.co.ke"
                    className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px] focus:outline-2 focus:outline-[var(--green)] focus:outline-offset-1"
                  />
                </div>
                <div className="mb-5">
                  <label className="block text-[13px] font-semibold mb-[6px]">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px] focus:outline-2 focus:outline-[var(--green)] focus:outline-offset-1"
                  />
                </div>
                <FormButton type="submit" disabled={submitting} className="mb-3">
                  {submitting ? "Signing in…" : "Continue"}
                </FormButton>
              </form>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep("forgot");
                }}
                className="block w-full text-center text-[13px]"
              >
                Forgot password?
              </button>
            </>
          )}

          {step === "mfa" && (
            <>
              <div className="w-12 h-12 rounded-xl bg-[var(--green-soft)] flex items-center justify-center mb-[18px]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green-deep)" strokeWidth={1.7}>
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
              </div>
              <h2 className="font-display font-bold text-[22px] mb-2">Two-factor verification</h2>
              <p className="text-[13px] text-[var(--stone)] mb-5">Enter the 6-digit code from your authenticator app.</p>

              {error && <InlineError>{error}</InlineError>}

              <OtpInput value={mfaCode} onChange={setMfaCode} disabled={submitting} label="Two-factor code" />

              <FormButton onClick={handleSubmitMfa} disabled={submitting || mfaCode.join("").length !== 6}>
                {submitting ? "Verifying…" : "Verify & sign in"}
              </FormButton>
            </>
          )}

          {step === "forgot" && (
            <>
              <h2 className="font-display font-bold text-[22px] mb-2">Reset your password</h2>
              <p className="text-[13px] text-[var(--stone)] mb-5">We&apos;ll send a 6-digit code to your work email.</p>
              <form onSubmit={handleSendReset}>
                <div className="mb-5">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@makazi.co.ke"
                    className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px] focus:outline-2 focus:outline-[var(--green)] focus:outline-offset-1"
                  />
                </div>
                <FormButton type="submit" disabled={submitting} className="mb-[14px]">
                  {submitting ? "Sending…" : "Send reset code"}
                </FormButton>
              </form>
              <button type="button" onClick={() => setStep("creds")} className="block w-full text-center text-[13px]">
                ← Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
