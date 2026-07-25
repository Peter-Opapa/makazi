"use client";

import * as React from "react";
import { MaintenanceStatus } from "@makazi/shared-types";
import {
  escalateAdminMaintenance,
  getAdminMaintenanceDetail,
  getAdminMaintenanceStatusCounts,
  listAdminMaintenance,
  reassignAdminMaintenanceTechnician,
  type AdminMaintenanceDetail,
  type AdminMaintenanceListItem,
} from "@/lib/admin";
import { maintenancePriorityTone, maintenanceStatusLabel, maintenanceStatusTone } from "@/lib/format";
import { StatusBadge } from "@/components/shared/status-badge";
import { Modal } from "@/components/shared/modal";
import { FormButton } from "@/components/shared/form-button";
import { Field, Select } from "@/components/shared/field";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { SkeletonList } from "@/components/shared/skeletons";

const STATUS_ORDER = Object.values(MaintenanceStatus);

export default function AdminMaintenancePage() {
  const [tickets, setTickets] = React.useState<AdminMaintenanceListItem[] | null>(null);
  const [counts, setCounts] = React.useState<Record<string, number> | null>(null);
  const [viewingId, setViewingId] = React.useState<string | null>(null);

  const refetch = React.useCallback(() => {
    setTickets(null);
    listAdminMaintenance().then(setTickets);
    getAdminMaintenanceStatusCounts().then(setCounts);
  }, []);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl tracking-[-0.02em] mb-[18px]">Maintenance oversight</h1>

      <div className="grid gap-2.5 mb-[18px]" style={{ gridTemplateColumns: `repeat(${STATUS_ORDER.length}, 1fr)` }}>
        {STATUS_ORDER.map((s) => (
          <div key={s} className="border border-[var(--line)] rounded-xl p-3 bg-white text-center">
            <div className="font-mono font-bold text-[17px]">{counts?.[s] ?? 0}</div>
            <div className="text-[10px] text-[var(--stone)] uppercase mt-1">{maintenanceStatusLabel(s)}</div>
          </div>
        ))}
      </div>

      {!tickets && <SkeletonList rows={6} />}

      {tickets && tickets.length === 0 && <EmptyState title="No maintenance tickets yet" description="Reported issues across all properties will appear here." />}

      {tickets && tickets.length > 0 && (
        <DataTable
          rows={tickets}
          rowKey={(t) => t.id}
          onRowClick={(t) => setViewingId(t.id)}
          columns={[
            { key: "issue", header: "Issue", sortValue: (t) => t.issue.toLowerCase(), render: (t) => <span className="font-semibold">{t.issue}</span> },
            { key: "property", header: "Property", sortValue: (t) => t.property.toLowerCase(), render: (t) => <span className="text-[var(--stone)]">{t.property}</span> },
            { key: "technician", header: "Technician", render: (t) => <span className="text-[var(--stone)]">{t.technician}</span> },
            { key: "priority", header: "Priority", sortValue: (t) => t.priority, render: (t) => <StatusBadge tone={maintenancePriorityTone(t.priority)}>{t.priority}</StatusBadge> },
            {
              key: "status",
              header: "Status",
              align: "right",
              sortValue: (t) => t.status,
              render: (t) => <StatusBadge tone={maintenanceStatusTone(t.status)}>{maintenanceStatusLabel(t.status)}</StatusBadge>,
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
  const [detail, setDetail] = React.useState<AdminMaintenanceDetail | null>(null);
  const [selectedTech, setSelectedTech] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    getAdminMaintenanceDetail(ticketId).then((d) => {
      setDetail(d);
      setSelectedTech(d.technician?.id ?? d.eligibleTechnicians[0]?.id ?? "");
    });
  }, [ticketId]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleReassign() {
    if (!selectedTech) return;
    setBusy(true);
    try {
      await reassignAdminMaintenanceTechnician(ticketId, selectedTech);
      setMessage("Technician reassigned.");
      load();
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function handleEscalate() {
    setBusy(true);
    try {
      await escalateAdminMaintenance(ticketId);
      setMessage("Ticket escalated.");
      load();
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  if (!detail) return null;

  return (
    <Modal open onOpenChange={onOpenChange}>
      <h3 className="font-display font-bold text-[19px] mb-1">{detail.issue}</h3>
      <p className="text-[12.5px] text-[var(--stone)] mb-[18px]">
        {detail.ticketNumber} · {detail.property} · {detail.unitCode}
      </p>

      <div className="flex gap-2.5 mb-[18px]">
        <StatusBadge tone={maintenancePriorityTone(detail.priority)}>{detail.priority}</StatusBadge>
        <StatusBadge tone={maintenanceStatusTone(detail.status)}>{maintenanceStatusLabel(detail.status)}</StatusBadge>
      </div>

      {message && <p className="text-[12.5px] text-[var(--success)] mb-3">{message}</p>}

      <Field label="Reassign technician" required className="mb-[14px]">
        {detail.eligibleTechnicians.length === 0 ? (
          <p className="text-[12.5px] text-[var(--stone)]">No technicians on this property&apos;s roster yet.</p>
        ) : (
          <Select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)}>
            {detail.eligibleTechnicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.specialty ? ` — ${t.specialty}` : ""}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <div className="flex gap-2.5">
        <FormButton variant="outline" disabled={busy} onClick={handleEscalate}>
          Escalate
        </FormButton>
        <FormButton disabled={busy || !selectedTech} onClick={handleReassign}>
          Reassign
        </FormButton>
      </div>
    </Modal>
  );
}
