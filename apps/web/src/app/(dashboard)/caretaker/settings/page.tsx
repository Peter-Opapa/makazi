"use client";

import * as React from "react";
import { UserRole } from "@makazi/shared-types";
import { useCaretakerUser, useSetCaretakerUser } from "../layout";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { NotificationPreferencesForm } from "@/components/dashboard/notification-preferences-form";

type Tab = "profile" | "notifications" | "permissions";

const TABS: { key: Tab; label: string }[] = [
  { key: "profile", label: "Profile" },
  { key: "notifications", label: "Notifications" },
  { key: "permissions", label: "Permissions" },
];

const CAN_DO = [
  "View and manage units on properties you're assigned to",
  "Assign tenants to units and process move-outs",
  "Register new tenants and view the tenant directory",
  "File and update maintenance tickets",
  "Log inspections with checklists and photos",
  "Accept or decline property invites",
];

const CANNOT_DO = [
  "Create, edit, or delete a property",
  "Manage a property's payment or billing settings",
  "Manage a property's photo gallery",
  "Access a property you haven't been invited to, or haven't accepted",
  "View or manage other caretakers' assignments",
];

export default function CaretakerSettingsPage() {
  const user = useCaretakerUser();
  const setUser = useSetCaretakerUser();
  const [tab, setTab] = React.useState<Tab>("profile");

  return (
    <div>
      <h1 className="font-display font-bold text-2xl tracking-[-0.02em] mb-6">Settings</h1>

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

      {tab === "profile" && <ProfileForm user={user} role={UserRole.CARETAKER} onUpdated={setUser} />}

      {tab === "notifications" && (
        <div className="max-w-[600px]">
          <NotificationPreferencesForm />
        </div>
      )}

      {tab === "permissions" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[760px]">
          <div className="border border-[var(--line)] rounded-2xl bg-white p-5">
            <div className="text-xs font-semibold text-[var(--green-deep)] uppercase tracking-wide mb-4">You can</div>
            <ul className="flex flex-col gap-[10px]">
              {CAN_DO.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[13px]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--green-deep)" strokeWidth={2} className="shrink-0 mt-[2px]">
                    <path d="M4 12l5 5L20 6" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="border border-[var(--line)] rounded-2xl bg-white p-5">
            <div className="text-xs font-semibold text-[var(--error)] uppercase tracking-wide mb-4">You cannot</div>
            <ul className="flex flex-col gap-[10px]">
              {CANNOT_DO.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[13px]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth={2} className="shrink-0 mt-[2px]">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
