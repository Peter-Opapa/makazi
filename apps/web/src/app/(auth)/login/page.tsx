"use client";

import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";

// No role picker here — a Clerk identity always maps to exactly one Makazi
// account with a fixed role, so there's nothing to choose at sign-in time.
// /session-resolve looks up the real role after Clerk authenticates and
// sends you there directly, regardless of anything picked beforehand.
export default function LoginPage() {
  return <SignIn routing="hash" fallbackRedirectUrl="/session-resolve" appearance={clerkAppearance} />;
}
