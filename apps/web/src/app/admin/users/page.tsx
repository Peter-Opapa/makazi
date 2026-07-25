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
import { SearchInput } from "@/components/shared/search-input";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { SkeletonList } from "@/components/shared/skeletons";

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
  const [users, setUsers] = React.useState<AdminUserListItem[] | null>(null);
  const [viewingId, setViewingId] = React.useState<string | null>(null);

  const refetch = React.useCallback(() => {
    setUsers(null);
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

      <div className="max-w-[380px] mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, phone…" />
      </div>

      {!users && <SkeletonList rows={6} />}

      {users && users.length === 0 && (
        <EmptyState
          title="No users found"
          description={search ? "No users match your search." : "No users in this category yet."}
        />
      )}

      {users && users.length > 0 && (
        <DataTable
          rows={users}
          rowKey={(u) => u.id}
          onRowClick={(u) => setViewingId(u.id)}
          columns={[
            {
              key: "name",
              header: "Name",
              sortValue: (u) => u.name.toLowerCase(),
              render: (u) => (
                <div>
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-xs text-[var(--stone)]">{u.email ?? u.phone ?? "—"}</div>
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              sortValue: (u) => u.status,
              render: (u) => (
                <StatusBadge tone={u.status === "active" ? "success" : "error"}>
                  {u.status === "active" ? "Active" : "Suspended"}
                </StatusBadge>
              ),
            },
            {
              key: "verified",
              header: "Verified",
              sortValue: (u) => (u.verified ? 1 : 0),
              render: (u) => (
                <StatusBadge tone={u.verified ? "success" : "warning"}>{u.verified ? "Verified" : "Unverified"}</StatusBadge>
              ),
            },
            {
              key: "joined",
              header: "Joined",
              align: "right",
              sortValue: (u) => new Date(u.joined).getTime(),
              render: (u) => <span className="font-mono text-xs text-[var(--stone)]">{fmtDate(u.joined)}</span>,
            },
          ]}
        />
      )}

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
