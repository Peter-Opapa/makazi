"use client";

import * as React from "react";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
  type UpdateNotificationPreferencesInput,
} from "@/lib/notifications";

type Category = "payments" | "maintenance" | "account";
type Channel = "Sms" | "Email" | "Whatsapp";

const ROWS: { key: Category; label: string; description: string }[] = [
  { key: "payments", label: "Payments & Rent", description: "Rent due, payment confirmations, overdue alerts" },
  { key: "maintenance", label: "Maintenance", description: "New tickets, status changes, comments, technician updates" },
  { key: "account", label: "Account & Invites", description: "Caretaker invites and other account activity" },
];

const CHANNELS: { key: Channel; label: string }[] = [
  { key: "Sms", label: "SMS" },
  { key: "Email", label: "Email" },
  { key: "Whatsapp", label: "WhatsApp" },
];

function fieldFor(category: Category, channel: Channel): keyof UpdateNotificationPreferencesInput {
  return `${category}${channel}` as keyof UpdateNotificationPreferencesInput;
}

export function NotificationPreferencesForm() {
  const [prefs, setPrefs] = React.useState<NotificationPreferences | null>(null);
  const [saving, setSaving] = React.useState<string | null>(null);

  React.useEffect(() => {
    getNotificationPreferences().then(setPrefs);
  }, []);

  async function toggle(field: keyof UpdateNotificationPreferencesInput) {
    if (!prefs) return;
    const value = !prefs[field];
    setPrefs({ ...prefs, [field]: value });
    setSaving(field);
    try {
      const patch: UpdateNotificationPreferencesInput = { [field]: value };
      await updateNotificationPreferences(patch);
    } finally {
      setSaving(null);
    }
  }

  if (!prefs) return null;

  return (
    <div className="border border-[var(--line)] rounded-2xl bg-white p-5">
      <p className="text-[13px] text-[var(--stone)] mb-4">
        In-app notifications are always on. Choose which categories also reach you by SMS, email, or WhatsApp.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-xs text-[var(--stone)] uppercase tracking-wide">
              <th className="pb-3 font-semibold">Category</th>
              {CHANNELS.map((c) => (
                <th key={c.key} className="pb-3 font-semibold text-center">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.key} className="border-t border-[var(--line)]">
                <td className="py-3 pr-3">
                  <div className="font-semibold">{row.label}</div>
                  <div className="text-xs text-[var(--stone)]">{row.description}</div>
                </td>
                {CHANNELS.map((c) => {
                  const field = fieldFor(row.key, c.key);
                  return (
                    <td key={c.key} className="py-3 text-center">
                      <input
                        type="checkbox"
                        checked={Boolean(prefs[field])}
                        onChange={() => toggle(field)}
                        disabled={saving === field}
                        className="w-4 h-4 accent-[var(--green)]"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
