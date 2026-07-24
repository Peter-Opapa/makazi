"use client";

import * as React from "react";
import { AdminSubRole } from "@makazi/shared-types";
import { getAdminSettings, updateAdminSettings, type AdminPlatformSettings } from "@/lib/admin";
import { ApiError } from "@/lib/api";
import { FormButton } from "@/components/shared/form-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAdminUser } from "../layout";

export default function AdminSettingsPage() {
  const user = useAdminUser();
  const [settings, setSettings] = React.useState<AdminPlatformSettings | null>(null);
  const [form, setForm] = React.useState({ platformName: "", supportEmail: "", supportPhone: "" });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const canManage = user.adminSubRole === AdminSubRole.SUPER_ADMIN;

  React.useEffect(() => {
    getAdminSettings().then((s) => {
      setSettings(s);
      setForm({ platformName: s.platformName, supportEmail: s.supportEmail ?? "", supportPhone: s.supportPhone ?? "" });
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const updated = await updateAdminSettings(form);
      setSettings(updated);
      setMessage("Settings saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return null;

  return (
    <div>
      <h1 className="font-display font-bold text-2xl tracking-[-0.02em] mb-[18px]">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[900px] mb-6">
        <form onSubmit={handleSave} className="border border-[var(--line)] rounded-2xl bg-white p-5">
          <div className="text-[13px] font-semibold text-[var(--stone)] uppercase mb-3.5">General &amp; branding</div>
          <div className="mb-3">
            <label className="block text-xs font-semibold mb-1.5">Platform name</label>
            <input
              value={form.platformName}
              onChange={(e) => setForm((f) => ({ ...f, platformName: e.target.value }))}
              disabled={!canManage}
              className="w-full px-3 py-2 border border-[var(--line-2)] rounded-lg text-sm disabled:bg-[var(--paper)]"
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold mb-1.5">Support email</label>
            <input
              type="email"
              value={form.supportEmail}
              onChange={(e) => setForm((f) => ({ ...f, supportEmail: e.target.value }))}
              disabled={!canManage}
              className="w-full px-3 py-2 border border-[var(--line-2)] rounded-lg text-sm disabled:bg-[var(--paper)]"
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-1.5">Support phone</label>
            <input
              value={form.supportPhone}
              onChange={(e) => setForm((f) => ({ ...f, supportPhone: e.target.value }))}
              disabled={!canManage}
              className="w-full px-3 py-2 border border-[var(--line-2)] rounded-lg text-sm disabled:bg-[var(--paper)]"
            />
          </div>
          {error && <p className="text-[12.5px] text-[var(--error)] mb-2">{error}</p>}
          {message && <p className="text-[12.5px] text-[var(--success)] mb-2">{message}</p>}
          {canManage ? (
            <FormButton type="submit" disabled={saving} fullWidth={false}>
              {saving ? "Saving…" : "Save changes"}
            </FormButton>
          ) : (
            <p className="text-xs text-[var(--stone)]">Only Super Admin can edit platform settings.</p>
          )}
        </form>

        <div className="border border-[var(--line)] rounded-2xl bg-white p-5">
          <div className="text-[13px] font-semibold text-[var(--stone)] uppercase mb-3.5">Integration status</div>
          <IntegrationRow label="M-Pesa (Daraja)" connected={settings.integrations.daraja} />
          <IntegrationRow label="SMS (Africa's Talking)" connected={settings.integrations.sms} />
          <IntegrationRow label="Email (SMTP)" connected={settings.integrations.email} />
          <IntegrationRow label="WhatsApp Cloud API" connected={settings.integrations.whatsapp} />
          <p className="text-xs text-[var(--stone)] mt-3">
            Reflects live server configuration — a channel runs its simulator until real credentials are set.
          </p>
        </div>
      </div>

      <div className="border border-[var(--line)] rounded-2xl bg-white p-5 max-w-[900px]">
        <div className="text-[13px] font-semibold text-[var(--stone)] uppercase mb-1">Security</div>
        <p className="text-[13px] text-[var(--stone)]">
          Staff sign-in requires MFA at the credentials step. Real TOTP enrollment is not yet wired up — any well-formed 6-digit
          code is currently accepted (see Known Simplifications).
        </p>
      </div>

      <p className="text-xs text-[var(--stone)] mt-6">
        Role &amp; permission matrix moved to{" "}
        <a href="/admin/roles" className="text-[var(--green-deep)] font-semibold">
          Role Management
        </a>
        .
      </p>
    </div>
  );
}

function IntegrationRow({ label, connected }: { label: string; connected: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-t border-[var(--line)] first:border-t-0">
      <span className="text-[13px]">{label}</span>
      <StatusBadge tone={connected ? "success" : "neutral"}>{connected ? "Connected" : "Simulator"}</StatusBadge>
    </div>
  );
}
