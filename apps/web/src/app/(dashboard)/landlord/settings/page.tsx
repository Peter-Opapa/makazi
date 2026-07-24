"use client";

import * as React from "react";
import { UserRole } from "@makazi/shared-types";
import { useLandlordUser, useSetLandlordUser } from "../layout";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { NotificationPreferencesForm } from "@/components/dashboard/notification-preferences-form";

type Tab = "profile" | "notifications";

const TABS: { key: Tab; label: string }[] = [
  { key: "profile", label: "Profile" },
  { key: "notifications", label: "Notifications" },
];

export default function LandlordSettingsPage() {
  const user = useLandlordUser();
  const setUser = useSetLandlordUser();
  const [tab, setTab] = React.useState<Tab>("profile");

  return (
    <div>
      <h1 className="font-display font-bold text-2xl tracking-[-0.02em] mb-1">Settings</h1>
      <p className="text-sm text-[var(--stone)] mb-6">Business and payment settings live on each property's own page.</p>

      <div className="flex gap-2 mb-6 border-b border-[var(--line)]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-1 pb-3 text-[13px] font-semibold -mb-px"
            style={{
              color: tab === t.key ? "var(--ink)" : "var(--stone)",
              borderBottom: tab === t.key ? "2px solid var(--green)" : "2px solid transparent",
              marginRight: 20,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && <ProfileForm user={user} role={UserRole.LANDLORD} onUpdated={setUser} />}

      {tab === "notifications" && (
        <div className="max-w-[600px]">
          <NotificationPreferencesForm />
        </div>
      )}
    </div>
  );
}
