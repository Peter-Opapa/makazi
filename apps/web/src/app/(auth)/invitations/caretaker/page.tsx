"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, SignIn, SignUp } from "@clerk/nextjs";
import { UserRole } from "@makazi/shared-types";
import {
  verifyCaretakerInvite,
  claimCaretakerInviteWithClerk,
  roleDashboardPath,
  type CaretakerInvitePreview,
} from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";
import { ProfileExtrasForm } from "@/components/auth/profile-extras-form";
import { cn } from "@/lib/utils";

function CaretakerInvitationInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { isLoaded, isSignedIn } = useAuth();

  const [preview, setPreview] = React.useState<CaretakerInvitePreview | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [checking, setChecking] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<"sign-up" | "sign-in">("sign-up");
  const [claimed, setClaimed] = React.useState(false);

  React.useEffect(() => {
    if (!token) {
      setError("This invitation link is missing its token.");
      setChecking(false);
      return;
    }
    verifyCaretakerInvite({ token })
      .then(setPreview)
      .catch((err) => setError(err instanceof ApiError ? err.message : "This invitation link is invalid or has expired."))
      .finally(() => setChecking(false));
  }, [token]);

  async function handleClaim() {
    setError(null);
    setSubmitting(true);
    try {
      await claimCaretakerInviteWithClerk({ token });
      setClaimed(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (checking) return null;

  if (claimed) {
    return <ProfileExtrasForm role={UserRole.CARETAKER} onDone={() => router.push(roleDashboardPath[UserRole.CARETAKER])} />;
  }

  return (
    <div>
      <div className="w-[52px] h-[52px] rounded-[14px] bg-[var(--green-soft)] flex items-center justify-center mb-5">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--green-deep)" strokeWidth={1.7}>
          <path d="M14.7 3.3a4 4 0 0 0-5.4 5.4L3 15l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6z" />
        </svg>
      </div>
      <h2 className="font-display font-bold text-[26px] tracking-[-0.02em] mb-2">Welcome to Makazi</h2>
      <p className="text-sm text-[var(--stone)] mb-6">You've been invited to help manage a property.</p>

      {error && <InlineError>{error}</InlineError>}

      {preview && (
        <div className="border border-[var(--line)] rounded-[14px] p-[18px] mb-6 flex flex-col gap-[10px]">
          {preview.landlordName && (
            <div className="flex justify-between text-[13px]">
              <span className="text-[var(--stone)]">Invited by</span>
              <span className="font-semibold">{preview.landlordName}</span>
            </div>
          )}
          <div className="flex justify-between text-[13px]">
            <span className="text-[var(--stone)]">{preview.properties.length > 1 ? "Properties" : "Property"}</span>
            <span className="font-semibold text-right">{preview.properties.map((p) => p.name).join(", ")}</span>
          </div>
        </div>
      )}

      {preview &&
        (isLoaded && isSignedIn ? (
          <FormButton onClick={handleClaim} disabled={submitting}>
            {submitting ? "Joining…" : "Accept invitation"}
          </FormButton>
        ) : (
          <div>
            <p className="text-[13px] text-[var(--stone)] mb-4">Sign in or create your Makazi account to accept.</p>
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
              <SignUp routing="hash" fallbackRedirectUrl={`/invitations/caretaker?token=${token}`} appearance={clerkAppearance} />
            ) : (
              <SignIn routing="hash" fallbackRedirectUrl={`/invitations/caretaker?token=${token}`} appearance={clerkAppearance} />
            )}
          </div>
        ))}
    </div>
  );
}

export default function CaretakerInvitationPage() {
  return (
    <Suspense fallback={null}>
      <CaretakerInvitationInner />
    </Suspense>
  );
}
