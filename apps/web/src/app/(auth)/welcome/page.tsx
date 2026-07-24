"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@makazi/shared-types";
import { getMe, roleDashboardPath } from "@/lib/auth";
import { FormButton } from "@/components/shared/form-button";

const WELCOME_COPY: Record<UserRole, string> = {
  [UserRole.LANDLORD]: "Let's get your properties set up.",
  [UserRole.CARETAKER]: "Let's get you ready to manage your assigned properties.",
  [UserRole.TENANT]: "Let's link you to your apartment.",
  [UserRole.ADMIN]: "Let's get you set up.",
};

export default function WelcomePage() {
  const router = useRouter();
  const [firstName, setFirstName] = React.useState("there");
  const [role, setRole] = React.useState<UserRole | null>(null);

  React.useEffect(() => {
    getMe()
      .then((me) => {
        setFirstName(me.firstName || "there");
        setRole(me.role);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  function handleGetStarted() {
    if (!role) return;
    router.push(roleDashboardPath[role]);
  }

  return (
    <div className="text-center py-5">
      <div className="w-16 h-16 rounded-full bg-[var(--green-soft)] flex items-center justify-center mx-auto mb-[22px]">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--green-deep)" strokeWidth={2}>
          <path d="M4 12l5 5L20 6" />
        </svg>
      </div>
      <h2 className="font-display font-bold text-[26px] mb-[10px]">Welcome to Makazi, {firstName}!</h2>
      <p className="text-[15px] text-[var(--stone)] mb-[30px]">{role ? WELCOME_COPY[role] : "Let's get you set up."}</p>
      <FormButton fullWidth={false} onClick={handleGetStarted} className="px-[30px]" disabled={!role}>
        Get started
      </FormButton>
    </div>
  );
}
