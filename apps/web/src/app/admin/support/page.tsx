"use client";

import * as React from "react";
import { SupportTicketStatus } from "@makazi/shared-types";
import {
  assignAdminSupportTicket,
  escalateAdminSupportTicket,
  getAdminSupportStatusCounts,
  getAdminSupportTicketDetail,
  listAdminStaff,
  listAdminSupportTickets,
  resolveAdminSupportTicket,
  updateAdminSupportTicketNotes,
  type AdminStaffMember,
  type AdminSupportTicketDetail,
  type AdminSupportTicketListItem,
} from "@/lib/admin";
import { StatusBadge } from "@/components/shared/status-badge";
import { Modal } from "@/components/shared/modal";
import { FormButton } from "@/components/shared/form-button";
import { Field, Select, Textarea } from "@/components/shared/field";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { SkeletonList } from "@/components/shared/skeletons";

function statusTone(status: SupportTicketStatus): "success" | "warning" | "error" | "neutral" {
  if (status === SupportTicketStatus.RESOLVED) return "success";
  if (status === SupportTicketStatus.ESCALATED) return "error";
  if (status === SupportTicketStatus.IN_PROGRESS) return "warning";
  return "neutral";
}

function statusLabel(status: SupportTicketStatus): string {
  return status
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = React.useState<AdminSupportTicketListItem[] | null>(null);
  const [counts, setCounts] = React.useState<{ open: number; escalated: number; resolvedToday: number } | null>(null);
  const [viewingId, setViewingId] = React.useState<string | null>(null);

  const refetch = React.useCallback(() => {
    setTickets(null);
    listAdminSupportTickets().then(setTickets);
    getAdminSupportStatusCounts().then(setCounts);
  }, []);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl tracking-[-0.02em] mb-[18px]">Support centre</h1>

      <div className="grid grid-cols-3 gap-3 mb-[18px]">
        <div className="border border-[var(--line)] rounded-xl p-3.5 bg-white">
          <div className="text-[10px] text-[var(--stone)] uppercase">Open</div>
          <div className="font-mono font-bold text-lg">{counts?.open ?? 0}</div>
        </div>
        <div className="border border-[var(--line)] rounded-xl p-3.5 bg-white">
          <div className="text-[10px] text-[var(--stone)] uppercase">Escalated</div>
          <div className="font-mono font-bold text-lg">{counts?.escalated ?? 0}</div>
        </div>
        <div className="border border-[var(--line)] rounded-xl p-3.5 bg-white">
          <div className="text-[10px] text-[var(--stone)] uppercase">Resolved today</div>
          <div className="font-mono font-bold text-lg">{counts?.resolvedToday ?? 0}</div>
        </div>
      </div>

      {!tickets && <SkeletonList rows={6} />}

      {tickets && tickets.length === 0 && <EmptyState title="No support tickets yet" description="Requests from landlords, caretakers and tenants will appear here." />}

      {tickets && tickets.length > 0 && (
        <DataTable
          rows={tickets}
          rowKey={(t) => t.id}
          onRowClick={(t) => setViewingId(t.id)}
          columns={[
            { key: "ticket", header: "Ticket", sortValue: (t) => t.ticketNumber, render: (t) => <span className="font-mono text-[var(--stone)]">{t.ticketNumber}</span> },
            { key: "subject", header: "Subject", sortValue: (t) => t.subject.toLowerCase(), render: (t) => <span className="font-semibold">{t.subject}</span> },
            { key: "customer", header: "Customer", sortValue: (t) => t.customer.toLowerCase(), render: (t) => <span>{t.customer}</span> },
            { key: "agent", header: "Agent", render: (t) => <span className="text-[var(--stone)]">{t.agent}</span> },
            {
              key: "status",
              header: "Status",
              align: "right",
              sortValue: (t) => t.status,
              render: (t) => <StatusBadge tone={statusTone(t.status)}>{statusLabel(t.status)}</StatusBadge>,
            },
          ]}
        />
      )}

      {viewingId && (
        <TicketModal ticketId={viewingId} onOpenChange={(open) => !open && setViewingId(null)} onChanged={refetch} />
      )}
    </div>
  );
}

function TicketModal({
  ticketId,
  onOpenChange,
  onChanged,
}: {
  ticketId: string;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = React.useState<AdminSupportTicketDetail | null>(null);
  const [staff, setStaff] = React.useState<AdminStaffMember[]>([]);
  const [agentId, setAgentId] = React.useState<string>("");
  const [notes, setNotes] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    getAdminSupportTicketDetail(ticketId).then((d) => {
      setDetail(d);
      setAgentId(d.agentId ?? "");
      setNotes(d.internalNotes ?? "");
    });
    listAdminStaff().then(setStaff);
  }, [ticketId]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleAssign(newAgentId: string) {
    setAgentId(newAgentId);
    setBusy(true);
    try {
      await assignAdminSupportTicket(ticketId, newAgentId || null);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveNotes() {
    setBusy(true);
    try {
      await updateAdminSupportTicketNotes(ticketId, notes);
      setMessage("Notes saved.");
    } finally {
      setBusy(false);
    }
  }

  async function handleEscalate() {
    setBusy(true);
    try {
      await escalateAdminSupportTicket(ticketId);
      setMessage("Ticket escalated.");
      load();
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function handleResolve() {
    setBusy(true);
    try {
      await resolveAdminSupportTicket(ticketId);
      setMessage("Ticket resolved — customer notified.");
      load();
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  if (!detail) return null;

  return (
    <Modal open onOpenChange={onOpenChange}>
      <h3 className="font-display font-bold text-[19px] mb-1">{detail.subject}</h3>
      <p className="text-[12.5px] text-[var(--stone)] mb-[18px]">
        {detail.ticketNumber} · {detail.customer}
      </p>

      <div className="border border-[var(--line)] rounded-xl p-3.5 mb-[18px] text-[13px] text-[var(--stone)]">{detail.message}</div>

      {message && <p className="text-[12.5px] text-[var(--success)] mb-3">{message}</p>}

      <Field label="Assign agent" required className="mb-[14px]">
        <Select value={agentId} onChange={(e) => handleAssign(e.target.value)} disabled={busy}>
          <option value="">Unassigned</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Internal notes" required className="mb-[14px]">
        <Textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleSaveNotes}
          placeholder="Notes visible to staff only"
        />
      </Field>

      <div className="flex gap-2.5">
        <FormButton variant="outline" disabled={busy || detail.status === SupportTicketStatus.RESOLVED} onClick={handleEscalate}>
          Escalate
        </FormButton>
        <FormButton disabled={busy || detail.status === SupportTicketStatus.RESOLVED} onClick={handleResolve}>
          Resolve &amp; notify customer
        </FormButton>
      </div>
    </Modal>
  );
}
