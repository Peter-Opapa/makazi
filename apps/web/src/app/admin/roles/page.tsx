"use client";

import * as React from "react";
import { ADMIN_PERMISSION_MATRIX, AdminPermission, AdminSubRole } from "@makazi/shared-types";
import {
  createAdminStaff,
  listAdminStaff,
  updateAdminStaffSubRole,
  type AdminStaffMember,
} from "@/lib/admin";
import { ApiError } from "@/lib/api";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormButton } from "@/components/shared/form-button";
import { useAdminUser } from "../layout";

const SUB_ROLES = Object.values(AdminSubRole);

const SUB_ROLE_LABEL: Record<AdminSubRole, string> = {
  [AdminSubRole.SUPER_ADMIN]: "Super Admin",
  [AdminSubRole.OPS]: "Operations Manager",
  [AdminSubRole.SUPPORT]: "Customer Support",
  [AdminSubRole.FINANCE]: "Finance",
  [AdminSubRole.TECH]: "Technical Support",
  [AdminSubRole.ANALYST]: "Read-only Analyst",
};

const PERMISSION_LABEL: Record<AdminPermission, string> = {
  [AdminPermission.MANAGE_USERS]: "Suspend / verify users",
  [AdminPermission.MANAGE_PAYMENTS]: "Resolve payment reconciliation",
  [AdminPermission.MANAGE_SUPPORT]: "Manage support tickets",
  [AdminPermission.MANAGE_MAINTENANCE]: "Reassign / escalate maintenance",
  [AdminPermission.MANAGE_SETTINGS]: "Edit platform settings",
  [AdminPermission.MANAGE_ROLES]: "Manage staff & roles",
};

export default function AdminRolesPage() {
  const user = useAdminUser();
  const canManage = user.adminSubRole === AdminSubRole.SUPER_ADMIN;

  const [staff, setStaff] = React.useState<AdminStaffMember[]>([]);
  const [showCreate, setShowCreate] = React.useState(false);
  const [createdCreds, setCreatedCreds] = React.useState<{ email: string; tempPassword: string } | null>(null);

  const refetch = React.useCallback(() => {
    listAdminStaff().then(setStaff);
  }, []);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  async function handleSubRoleChange(id: string, subRole: AdminSubRole) {
    await updateAdminStaffSubRole(id, subRole);
    refetch();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-[18px] flex-wrap gap-3">
        <h1 className="font-display font-bold text-2xl tracking-[-0.02em]">Role management</h1>
        {canManage && (
          <FormButton fullWidth={false} onClick={() => setShowCreate(true)}>
            + Add staff
          </FormButton>
        )}
      </div>

      {createdCreds && (
        <div className="border border-[var(--green)] bg-[var(--green-soft)] rounded-xl p-4 mb-4 text-[13px]">
          <p className="font-semibold mb-1">
            Staff account created for {createdCreds.email}
          </p>
          <p className="text-[var(--stone)] mb-2">
            Temporary password (shown once — relay it to them directly, they should reset it on first login):
          </p>
          <code className="font-mono bg-white border border-[var(--line)] rounded px-2 py-1">{createdCreds.tempPassword}</code>
          <button onClick={() => setCreatedCreds(null)} className="block mt-2 text-xs text-[var(--stone)]">
            Dismiss
          </button>
        </div>
      )}

      <div className="border border-[var(--line)] rounded-[14px] overflow-hidden bg-white mb-8">
        <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr] px-4 py-3 bg-[var(--paper)] text-[11px] font-semibold text-[var(--stone)] uppercase tracking-wide">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
        </div>
        {staff.map((s) => (
          <div key={s.id} className="grid grid-cols-[1.3fr_1fr_1fr_1fr] px-4 py-3.5 border-t border-[var(--line)] items-center text-[13px]">
            <span className="font-semibold">{s.name}</span>
            <span className="text-[var(--stone)]">{s.email}</span>
            <span>
              {canManage ? (
                <select
                  value={s.subRole ?? ""}
                  onChange={(e) => handleSubRoleChange(s.id, e.target.value as AdminSubRole)}
                  className="px-2 py-1.5 border border-[var(--line-2)] rounded-md text-xs"
                >
                  {SUB_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {SUB_ROLE_LABEL[r]}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-[var(--stone)]">{s.subRole ? SUB_ROLE_LABEL[s.subRole] : "—"}</span>
              )}
            </span>
            <span>
              <StatusBadge tone={s.status === "active" ? "success" : "error"}>
                {s.status === "active" ? "Active" : "Suspended"}
              </StatusBadge>
            </span>
          </div>
        ))}
      </div>

      <div className="font-semibold text-[15px] mb-3">Role &amp; permission matrix</div>
      <div className="border border-[var(--line)] rounded-[14px] overflow-hidden bg-white overflow-x-auto">
        <div
          className="grid px-4 py-2.5 bg-[var(--paper)] text-[10.5px] font-semibold text-[var(--stone)] uppercase tracking-wide min-w-[640px]"
          style={{ gridTemplateColumns: `1.6fr repeat(${SUB_ROLES.length}, 1fr)` }}
        >
          <span>Permission</span>
          {SUB_ROLES.map((r) => (
            <span key={r} className="text-center">
              {SUB_ROLE_LABEL[r].split(" ")[0]}
            </span>
          ))}
        </div>
        {Object.values(AdminPermission).map((perm) => (
          <div
            key={perm}
            className="grid px-4 py-2.5 border-t border-[var(--line)] text-[12.5px] items-center min-w-[640px]"
            style={{ gridTemplateColumns: `1.6fr repeat(${SUB_ROLES.length}, 1fr)` }}
          >
            <span>{PERMISSION_LABEL[perm]}</span>
            {SUB_ROLES.map((r) => (
              <span key={r} className="text-center">
                {r === AdminSubRole.SUPER_ADMIN || ADMIN_PERMISSION_MATRIX[perm].includes(r) ? "✓" : "—"}
              </span>
            ))}
          </div>
        ))}
      </div>

      {showCreate && (
        <CreateStaffModal
          onClose={() => setShowCreate(false)}
          onCreated={(email, tempPassword) => {
            setCreatedCreds({ email, tempPassword });
            setShowCreate(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function CreateStaffModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (email: string, tempPassword: string) => void;
}) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subRole, setSubRole] = React.useState<AdminSubRole>(AdminSubRole.OPS);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await createAdminStaff({ firstName, lastName, email, subRole });
      onCreated(result.email ?? email, result.tempPassword);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-5" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 w-full max-w-[420px]"
      >
        <h3 className="font-display font-bold text-lg mb-4">Add staff account</h3>
        {error && <p className="text-[12.5px] text-[var(--error)] mb-3">{error}</p>}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            className="px-3 py-2 border border-[var(--line-2)] rounded-lg text-sm"
          />
          <input
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            className="px-3 py-2 border border-[var(--line-2)] rounded-lg text-sm"
          />
        </div>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Work email"
          className="w-full px-3 py-2 border border-[var(--line-2)] rounded-lg text-sm mb-3"
        />
        <select
          value={subRole}
          onChange={(e) => setSubRole(e.target.value as AdminSubRole)}
          className="w-full px-3 py-2 border border-[var(--line-2)] rounded-lg text-sm mb-4"
        >
          {SUB_ROLES.map((r) => (
            <option key={r} value={r}>
              {SUB_ROLE_LABEL[r]}
            </option>
          ))}
        </select>
        <FormButton type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create account"}
        </FormButton>
      </form>
    </div>
  );
}
