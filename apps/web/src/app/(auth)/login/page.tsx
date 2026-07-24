"use client";

import * as React from "react";
import { SignIn } from "@clerk/nextjs";
import { UserRole } from "@makazi/shared-types";
import { updateAuthDraft } from "@/lib/auth";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { cn } from "@/lib/utils";

const ROLES: { value: UserRole; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: UserRole.LANDLORD,
    label: "Landlord",
    description: "I own or manage rental properties",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={1.7}>
        <rect x="3" y="9" width="7" height="12" />
        <rect x="14" y="4" width="7" height="17" />
      </svg>
    ),
  },
  {
    value: UserRole.CARETAKER,
    label: "Caretaker",
    description: "I manage a property on a landlord's behalf",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={1.7}>
        <path d="M14.7 3.3a4 4 0 0 0-5.4 5.4L3 15l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6z" />
      </svg>
    ),
  },
  {
    value: UserRole.TENANT,
    label: "Tenant",
    description: "I rent a unit and want to pay & report issues",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={1.7}>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </svg>
    ),
  },
];

export default function LoginPage() {
  const [role, setRole] = React.useState<UserRole | null>(null);

  function pick(value: UserRole) {
    updateAuthDraft({ role: value });
    setRole(value);
  }

  if (!role) {
    return (
      <div>
        <h2 className="font-display font-bold text-[26px] tracking-[-0.02em] mb-2">Sign in to Makazi</h2>
        <p className="text-sm text-[var(--stone)] mb-6">How are you using Makazi?</p>
        <div className="flex flex-col gap-3">
          {ROLES.map((r) => (
            <div
              key={r.value}
              onClick={() => pick(r.value)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") pick(r.value);
              }}
              className="flex gap-[14px] items-center p-4 rounded-[14px] cursor-pointer border-[1.5px] border-[var(--line-2)] bg-white hover:border-[var(--green)]"
            >
              <div className="flex-shrink-0">{r.icon}</div>
              <div>
                <div className="font-semibold text-[15px]">{r.label}</div>
                <div className="text-[13px] text-[var(--stone)]">{r.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setRole(null)}
        className={cn("text-[13px] font-semibold text-[var(--stone)] mb-5 flex items-center gap-1")}
      >
        ← Change role
      </button>
      {role !== UserRole.LANDLORD && (
        <p className="text-[13px] text-[var(--stone)] mb-5">
          Caretakers and tenants join Makazi through an invitation from their landlord. If you already have an
          account, sign in below.
        </p>
      )}
      <SignIn routing="hash" fallbackRedirectUrl="/session-resolve" appearance={clerkAppearance} />
    </div>
  );
}
