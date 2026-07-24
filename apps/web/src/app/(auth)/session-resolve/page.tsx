"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { UserRole } from "@makazi/shared-types";
import { getClerkProfileStatus, roleDashboardPath, getAuthDraft } from "@/lib/auth";
import { FormButton } from "@/components/shared/form-button";

const NOT_FOUND_COPY: Record<UserRole, string> = {
  [UserRole.LANDLORD]: "We couldn't find a Makazi account for you yet. New here? Create your landlord account below.",
  [UserRole.CARETAKER]:
    "We couldn't find a Makazi caretaker account for you. Caretakers join Makazi through an invitation from their landlord — check your email for an invite link.",
  [UserRole.TENANT]:
    "We couldn't find a Makazi tenant account for you. Tenants join Makazi through an invitation from their landlord — check your email for an invite link.",
  [UserRole.ADMIN]: "We couldn't find a Makazi account for you.",
};

/** Lands here right after Clerk sign-in from the /login role picker — the real account's role always wins over whatever was picked there. */
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

  const pickedRole = getAuthDraft().role ?? UserRole.LANDLORD;

  return (
    <div>
      <h2 className="font-display font-bold text-[26px] tracking-[-0.02em] mb-2">Account not found</h2>
      <p className="text-sm text-[var(--stone)] mb-6">{NOT_FOUND_COPY[pickedRole]}</p>
      {pickedRole === UserRole.LANDLORD && (
        <FormButton onClick={() => router.push("/register")}>Create your landlord account</FormButton>
      )}
    </div>
  );
}
