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

const STATUS_ORDER = Object.values(MaintenanceStatus);

export default function AdminMaintenancePage() {
  const [tickets, setTickets] = React.useState<AdminMaintenanceListItem[]>([]);
  const [counts, setCounts] = React.useState<Record<string, number> | null>(null);
  const [viewingId, setViewingId] = React.useState<string | null>(null);

  const refetch = React.useCallback(() => {
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

      <div className="border border-[var(--line)] rounded-[14px] overflow-hidden bg-white">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr] px-4 py-3 bg-[var(--paper)] text-[11px] font-semibold text-[var(--stone)] uppercase tracking-wide">
          <span>Issue</span>
          <span>Property</span>
          <span>Technician</span>
          <span>Priority</span>
          <span>Status</span>
        </div>
        {tickets.length === 0 && <div className="px-4 py-8 text-center text-sm text-[var(--stone)]">No maintenance tickets yet.</div>}
        {tickets.map((t) => (
          <div
            key={t.id}
            onClick={() => setViewingId(t.id)}
            className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr] px-4 py-3.5 border-t border-[var(--line)] items-center text-[12.5px] cursor-pointer hover:bg-[var(--paper)]"
          >
            <span className="font-semibold">{t.issue}</span>
            <span className="text-[var(--stone)]">{t.property}</span>
            <span className="text-[var(--stone)]">{t.technician}</span>
            <span>
              <StatusBadge tone={maintenancePriorityTone(t.priority)}>{t.priority}</StatusBadge>
            </span>
            <span>
              <StatusBadge tone={maintenanceStatusTone(t.status)}>{maintenanceStatusLabel(t.status)}</StatusBadge>
            </span>
          </div>
        ))}
      </div>

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

      <div className="mb-[14px]">
        <label className="block text-[12.5px] font-semibold mb-[6px]">Reassign technician</label>
        {detail.eligibleTechnicians.length === 0 ? (
          <p className="text-[12.5px] text-[var(--stone)]">No technicians on this property&apos;s roster yet.</p>
        ) : (
          <select
            value={selectedTech}
            onChange={(e) => setSelectedTech(e.target.value)}
            className="w-full px-3 py-2.5 border-[1.5px] border-[var(--line-2)] rounded-[9px] text-sm"
          >
            {detail.eligibleTechnicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.specialty ? ` — ${t.specialty}` : ""}
              </option>
            ))}
          </select>
        )}
      </div>

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
