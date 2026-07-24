"use client";

import * as React from "react";
import { UserRole } from "@makazi/shared-types";
import {
  getAdminUserDetail,
  listAdminUsers,
  reactivateAdminUser,
  resetAdminUserPassword,
  suspendAdminUser,
  verifyAdminUser,
  type AdminUserDetail,
  type AdminUserListItem,
} from "@/lib/admin";
import { StatusBadge } from "@/components/shared/status-badge";
import { Modal } from "@/components/shared/modal";
import { FormButton } from "@/components/shared/form-button";

const TABS: { key: UserRole; label: string }[] = [
  { key: UserRole.LANDLORD, label: "Landlords" },
  { key: UserRole.CARETAKER, label: "Caretakers" },
  { key: UserRole.TENANT, label: "Tenants" },
  { key: UserRole.ADMIN, label: "Admins" },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminUsersPage() {
  const [tab, setTab] = React.useState<UserRole>(UserRole.LANDLORD);
  const [search, setSearch] = React.useState("");
  const [users, setUsers] = React.useState<AdminUserListItem[]>([]);
  const [viewingId, setViewingId] = React.useState<string | null>(null);

  const refetch = React.useCallback(() => {
    listAdminUsers({ role: tab, search: search || undefined }).then(setUsers);
  }, [tab, search]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <div>
      <div className="flex justify-between items-center mb-[18px] flex-wrap gap-3">
        <h1 className="font-display font-bold text-2xl tracking-[-0.02em]">Users</h1>
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="rounded-lg px-3.5 py-2 text-xs font-semibold"
              style={
                tab === t.key
                  ? { background: "var(--ink)", color: "#fff" }
                  : { border: "1px solid var(--line-2)", color: "var(--stone)" }
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name, email, phone…"
        className="w-full max-w-[380px] px-3.5 py-2.5 border border-[var(--line)] rounded-[9px] text-sm mb-4"
      />

      <div className="border border-[var(--line)] rounded-[14px] overflow-hidden bg-white">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] px-4 py-3 bg-[var(--paper)] text-[11px] font-semibold text-[var(--stone)] uppercase tracking-wide">
          <span>Name</span>
          <span>Status</span>
          <span>Verified</span>
          <span>Joined</span>
        </div>
        {users.length === 0 && <div className="px-4 py-8 text-center text-sm text-[var(--stone)]">No users found.</div>}
        {users.map((u) => (
          <div
            key={u.id}
            onClick={() => setViewingId(u.id)}
            className="grid grid-cols-[1.5fr_1fr_1fr_1fr] px-4 py-3.5 border-t border-[var(--line)] items-center text-[13px] cursor-pointer hover:bg-[var(--paper)]"
          >
            <div>
              <div className="font-semibold">{u.name}</div>
              <div className="text-xs text-[var(--stone)]">{u.email ?? u.phone ?? "—"}</div>
            </div>
            <span>
              <StatusBadge tone={u.status === "active" ? "success" : "error"}>
                {u.status === "active" ? "Active" : "Suspended"}
              </StatusBadge>
            </span>
            <span>
              <StatusBadge tone={u.verified ? "success" : "warning"}>{u.verified ? "Verified" : "Unverified"}</StatusBadge>
            </span>
            <span className="font-mono text-xs text-[var(--stone)]">{fmtDate(u.joined)}</span>
          </div>
        ))}
      </div>

      {viewingId && (
        <UserDetailModal
          userId={viewingId}
          onOpenChange={(open) => !open && setViewingId(null)}
          onChanged={refetch}
        />
      )}
    </div>
  );
}

function UserDetailModal({
  userId,
  onOpenChange,
  onChanged,
}: {
  userId: string;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = React.useState<AdminUserDetail | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    getAdminUserDetail(userId).then(setDetail);
  }, [userId]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function withBusy(fn: () => Promise<unknown>, msg: string) {
    setBusy(true);
    setMessage(null);
    try {
      await fn();
      setMessage(msg);
      load();
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  if (!detail) return null;
  const initials = `${detail.firstName[0] ?? ""}${detail.lastName[0] ?? ""}`.toUpperCase();

  return (
    <Modal open onOpenChange={onOpenChange}>
      <div className="flex gap-3.5 items-center mb-[18px]">
        <div
          className="w-12 h-12 rounded-full text-white flex items-center justify-center font-display font-bold text-base"
          style={{ background: "var(--clay)" }}
        >
          {initials}
        </div>
        <div>
          <div className="font-bold text-[17px]">
            {detail.firstName} {detail.lastName}
          </div>
          <div className="text-[12.5px] text-[var(--stone)]">
            {detail.role} · {detail.email ?? detail.phone ?? "—"}
          </div>
        </div>
      </div>

      <div className="flex gap-2.5 mb-[18px]">
        <StatusBadge tone={detail.status === "active" ? "success" : "error"}>
          {detail.status === "active" ? "Active" : "Suspended"}
        </StatusBadge>
        <StatusBadge tone={detail.verified ? "success" : "warning"}>{detail.verified ? "Verified" : "Unverified"}</StatusBadge>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-[18px]">
        <div className="border border-[var(--line)] rounded-[10px] p-3">
          <div className="text-[10px] text-[var(--stone)] uppercase mb-1">Phone</div>
          <div className="text-[13px] font-semibold">{detail.phone ?? "—"}</div>
        </div>
        <div className="border border-[var(--line)] rounded-[10px] p-3">
          <div className="text-[10px] text-[var(--stone)] uppercase mb-1">Joined</div>
          <div className="text-[13px] font-semibold">{fmtDate(detail.joined)}</div>
        </div>
        <div className="border border-[var(--line)] rounded-[10px] p-3">
          <div className="text-[10px] text-[var(--stone)] uppercase mb-1">Context</div>
          <div className="text-[13px] font-semibold">{detail.context}</div>
        </div>
        <div className="border border-[var(--line)] rounded-[10px] p-3">
          <div className="text-[10px] text-[var(--stone)] uppercase mb-1">Support tickets</div>
          <div className="text-[13px] font-semibold">{detail.supportTicketCount}</div>
        </div>
      </div>

      {message && <p className="text-[12.5px] text-[var(--success)] mb-3">{message}</p>}

      <div className="grid grid-cols-2 gap-2.5">
        <FormButton
          variant="outline"
          disabled={busy}
          onClick={() => withBusy(() => resetAdminUserPassword(detail.id), "Password reset code sent.")}
        >
          Reset password
        </FormButton>
        <FormButton
          variant="outline"
          disabled={busy || detail.verified}
          onClick={() => withBusy(() => verifyAdminUser(detail.id), "Identity verified.")}
        >
          {detail.verified ? "Already verified" : "Verify identity"}
        </FormButton>
        <FormButton
          variant={detail.status === "active" ? "destructive" : "outline"}
          disabled={busy}
          className="col-span-2"
          onClick={() =>
            withBusy(
              () => (detail.status === "active" ? suspendAdminUser(detail.id) : reactivateAdminUser(detail.id)),
              detail.status === "active" ? "Account suspended." : "Account reactivated.",
            )
          }
        >
          {detail.status === "active" ? "Suspend account" : "Reactivate account"}
        </FormButton>
      </div>
    </Modal>
  );
}
