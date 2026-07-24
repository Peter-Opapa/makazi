"use client";

import { SignUp } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function RegisterPage() {
  return (
    <div>
      <p className="text-[13px] text-[var(--stone)] mb-5">
        Set up your Makazi account to start managing your properties. Caretakers and tenants join Makazi through an
        invitation from their landlord, not by signing up here.
      </p>
      <SignUp routing="hash" fallbackRedirectUrl="/finish-profile" appearance={clerkAppearance} />
    </div>
  );
}
