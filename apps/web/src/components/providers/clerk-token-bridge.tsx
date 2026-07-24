"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { setClerkTokenGetter } from "@/lib/api";

/**
 * Feeds apiFetch a fresh Clerk session token on every request, for
 * Landlord/Caretaker/Tenant (Admin/staff still uses the old localStorage JWT
 * — untouched). Rendered once in the root layout, inside <ClerkProvider>.
 * No UI — just wires useAuth()'s getToken into lib/api.ts's module-level getter.
 */
export function ClerkTokenBridge() {
  const { isSignedIn, getToken } = useAuth();

  React.useEffect(() => {
    setClerkTokenGetter(isSignedIn ? getToken : null);
    return () => setClerkTokenGetter(null);
  }, [isSignedIn, getToken]);

  return null;
}
