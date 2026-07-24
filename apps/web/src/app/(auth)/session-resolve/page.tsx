"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { getClerkProfileStatus, roleDashboardPath } from "@/lib/auth";
import { FormButton } from "@/components/shared/form-button";

/** Lands here right after Clerk sign-in — resolves the authenticated identity to its real Makazi account and role. */
export default function SessionResolvePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [notFound, setNotFound] = React.useState(false);

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
        setNotFound(true);
      })
      .catch(() => setNotFound(true));
  }, [isLoaded, isSignedIn, router]);

  if (!notFound) return null;

  return (
    <div>
      <h2 className="font-display font-bold text-[26px] tracking-[-0.02em] mb-2">Account not found</h2>
      <p className="text-sm text-[var(--stone)] mb-6">
        We couldn&apos;t find a Makazi account for this sign-in. If you&apos;re a landlord, you can create an
        account below. Caretakers and tenants join Makazi through an invitation from their landlord — check your
        email for an invite link.
      </p>
      <FormButton onClick={() => router.push("/register")}>Create your landlord account</FormButton>
    </div>
  );
}
