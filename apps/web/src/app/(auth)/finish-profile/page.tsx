"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { getClerkProfileStatus, completeClerkProfile, roleDashboardPath } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";

export default function FinishProfilePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [checking, setChecking] = React.useState(true);
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/login");
      return;
    }
    getClerkProfileStatus()
      .then((status) => {
        if (status.exists && status.user) {
          router.replace(roleDashboardPath[status.user.role]);
          return;
        }
        setFirstName(status.identity?.firstName ?? "");
        setLastName(status.identity?.lastName ?? "");
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [isLoaded, isSignedIn, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await completeClerkProfile({ phone: phone.trim(), firstName: firstName.trim(), lastName: lastName.trim() });
      router.push("/welcome");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (checking) return null;

  return (
    <div>
      <h2 className="font-display font-bold text-[26px] tracking-[-0.02em] mb-2">One more thing</h2>
      <p className="text-sm text-[var(--stone)] mb-6">
        A couple of details so tenants and caretakers know who they're dealing with. Property details come later —
        you're almost in.
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
              className="w-full px-[14px] py-3 border-[1.5px] border-[var(--line-2)] rounded-[10px] focus:outline-2 focus:outline-[var(--green)] focus:outline-offset-1"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">Last name</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-[14px] py-3 border-[1.5px] border-[var(--line-2)] rounded-[10px] focus:outline-2 focus:outline-[var(--green)] focus:outline-offset-1"
            />
          </div>
        </div>
        <div className="mb-[22px]">
          <label className="block text-[13px] font-semibold mb-[6px]">Phone number</label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07XX XXX XXX"
            className="w-full px-[14px] py-3 border-[1.5px] border-[var(--line-2)] rounded-[10px] focus:outline-2 focus:outline-[var(--green)] focus:outline-offset-1"
          />
        </div>
        <FormButton type="submit" disabled={submitting || !phone.trim() || !firstName.trim() || !lastName.trim()}>
          {submitting ? "Saving…" : "Continue to dashboard"}
        </FormButton>
      </form>
    </div>
  );
}
