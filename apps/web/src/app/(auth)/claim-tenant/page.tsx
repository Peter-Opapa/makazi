"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, SignIn, SignUp } from "@clerk/nextjs";
import { UserRole } from "@makazi/shared-types";
import { verifyTenantCode, claimTenantWithClerk, roleDashboardPath, type TenantCodePreview } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";
import { ProfileExtrasForm } from "@/components/auth/profile-extras-form";
import { cn } from "@/lib/utils";

function ClaimTenantInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();
  const [tenantCode, setTenantCode] = React.useState(searchParams.get("code")?.toUpperCase() ?? "");
  const [preview, setPreview] = React.useState<TenantCodePreview | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<"sign-up" | "sign-in">("sign-up");
  const [claimed, setClaimed] = React.useState(false);

  const verify = React.useCallback(async (code: string) => {
    setError(null);
    setSubmitting(true);
    try {
      const result = await verifyTenantCode({ tenantCode: code });
      setPreview(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, []);

  // A link from an emailed invitation carries ?code= — jump straight to the preview.
  React.useEffect(() => {
    const fromLink = searchParams.get("code");
    if (fromLink) verify(fromLink.trim().toUpperCase());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    await verify(tenantCode.trim().toUpperCase());
  }

  async function handleClaim() {
    setError(null);
    setSubmitting(true);
    try {
      await claimTenantWithClerk({ tenantCode: tenantCode.trim().toUpperCase() });
      setClaimed(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (claimed) {
    return <ProfileExtrasForm role={UserRole.TENANT} onDone={() => router.push(roleDashboardPath[UserRole.TENANT])} />;
  }

  return (
    <div>
      <div className="w-[52px] h-[52px] rounded-[14px] bg-[var(--green-soft)] flex items-center justify-center mb-5">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--green-deep)" strokeWidth={1.7}>
          <path d="M4 4h16v16H4z" />
          <path d="M4 6l8 7 8-7" />
        </svg>
      </div>
      <h2 className="font-display font-bold text-[26px] tracking-[-0.02em] mb-2">Welcome to Makazi</h2>
      <p className="text-sm text-[var(--stone)] mb-6">Your caretaker or landlord has registered you as a tenant.</p>

      {error && <InlineError>{error}</InlineError>}

      {!preview ? (
        <form onSubmit={handleVerify}>
          <div className="mb-[22px]">
            <label className="block text-[13px] font-semibold mb-[6px]">Tenant code</label>
            <input
              type="text"
              required
              value={tenantCode}
              onChange={(e) => setTenantCode(e.target.value)}
              placeholder="MKZ-XXXXX"
              className="w-full px-[14px] py-3 border-[1.5px] border-[var(--line-2)] rounded-[10px] font-mono uppercase focus:outline-2 focus:outline-[var(--green)] focus:outline-offset-1"
            />
          </div>
          <FormButton type="submit" disabled={submitting}>
            {submitting ? "Checking…" : "Open invitation"}
          </FormButton>
        </form>
      ) : (
        <div>
          <div className="border border-[var(--line)] rounded-[14px] p-[18px] mb-6 flex flex-col gap-[10px]">
            {preview.unit ? (
              <>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[var(--stone)]">Property</span>
                  <span className="font-semibold">{preview.unit.property.name}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[var(--stone)]">Unit</span>
                  <span className="font-semibold">{preview.unit.code}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[var(--stone)]">Monthly rent</span>
                  <span className="font-semibold font-mono">KES {Number(preview.unit.rentAmount).toLocaleString("en-KE")}</span>
                </div>
              </>
            ) : (
              <p className="text-[13px] text-[var(--stone)] m-0">
                Welcome, {preview.firstName} {preview.lastName}.
              </p>
            )}
          </div>

          {isLoaded && isSignedIn ? (
            <FormButton onClick={handleClaim} disabled={submitting}>
              {submitting ? "Linking your account…" : "Confirm & continue"}
            </FormButton>
          ) : (
            <div>
              <p className="text-[13px] text-[var(--stone)] mb-4">Sign in or create your Makazi account to claim this invitation.</p>
              <div className="flex gap-[10px] mb-4 text-[13px]">
                <button
                  type="button"
                  onClick={() => setAuthMode("sign-up")}
                  className={cn("font-semibold", authMode === "sign-up" ? "text-[var(--green)]" : "text-[var(--stone)]")}
                >
                  Sign up
                </button>
                <span className="text-[var(--stone)]">·</span>
                <button
                  type="button"
                  onClick={() => setAuthMode("sign-in")}
                  className={cn("font-semibold", authMode === "sign-in" ? "text-[var(--green)]" : "text-[var(--stone)]")}
                >
                  Sign in
                </button>
              </div>
              {authMode === "sign-up" ? (
                <SignUp routing="hash" fallbackRedirectUrl="/claim-tenant" appearance={clerkAppearance} />
              ) : (
                <SignIn routing="hash" fallbackRedirectUrl="/claim-tenant" appearance={clerkAppearance} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ClaimTenantPage() {
  return (
    <Suspense fallback={null}>
      <ClaimTenantInner />
    </Suspense>
  );
}
