"use client";

import * as React from "react";
import { getCurrentLease } from "@/lib/lease";
import { listMaintenanceTickets, type MaintenanceTicket } from "@/lib/maintenance";
import { maintenanceStatusLabel, maintenanceStatusTone, maintenancePriorityTone } from "@/lib/format";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormButton } from "@/components/shared/form-button";
import { TenantReportIssueModal } from "@/components/dashboard/tenant-report-issue-modal";
import { TicketDetailModal } from "@/components/dashboard/ticket-detail-modal";

export default function TenantMaintenancePage() {
  const [unitId, setUnitId] = React.useState<string | null>(null);
  const [tickets, setTickets] = React.useState<MaintenanceTicket[] | null>(null);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null);

  const refetch = React.useCallback(async () => {
    setTickets(await listMaintenanceTickets());
  }, []);

  React.useEffect(() => {
    getCurrentLease().then((lease) => setUnitId(lease.unit.id));
    refetch();
  }, [refetch]);

  return (
    <div>
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <h1 className="font-display font-bold text-2xl tracking-[-0.02em]">Maintenance</h1>
        <FormButton fullWidth={false} disabled={!unitId} onClick={() => setReportOpen(true)} className="px-4">
          Report an issue
        </FormButton>
      </div>

      {tickets && tickets.length === 0 && (
        <div className="border-[1.5px] border-dashed border-[var(--line-2)] rounded-2xl py-16 px-5 text-center">
          <p className="text-sm text-[var(--stone)] mb-4">No maintenance requests yet.</p>
          <FormButton fullWidth={false} disabled={!unitId} onClick={() => setReportOpen(true)} className="px-5">
            Report your first issue
          </FormButton>
        </div>
      )}

      {tickets && tickets.length > 0 && (
        <div className="border border-[var(--line)] rounded-[14px] overflow-hidden bg-white">
          {tickets.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setSelectedTicketId(t.id)}
              className="w-full text-left flex items-center justify-between px-4 py-[13px] gap-3 flex-wrap"
              style={i > 0 ? { borderTop: "1px solid var(--line)" } : undefined}
            >
              <div className="min-w-0">
                <div className="text-[13px] font-semibold truncate">{t.issue}</div>
                <div className="text-xs text-[var(--stone)] truncate">
                  {t.ticketNumber}
                  {t.technician ? ` · ${t.technician.name}` : ""}
                  {t.photoUrls.length > 0 ? ` · ${t.photoUrls.length} photo${t.photoUrls.length > 1 ? "s" : ""}` : ""}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <StatusBadge tone={maintenancePriorityTone(t.priority)}>{t.priority}</StatusBadge>
                <StatusBadge tone={maintenanceStatusTone(t.status)}>{maintenanceStatusLabel(t.status)}</StatusBadge>
              </div>
            </button>
          ))}
        </div>
      )}

      {unitId && (
        <TenantReportIssueModal open={reportOpen} onOpenChange={setReportOpen} unitId={unitId} onCreated={refetch} />
      )}

      {selectedTicketId && (
        <TicketDetailModal
          open={!!selectedTicketId}
          onOpenChange={(open) => !open && setSelectedTicketId(null)}
          ticketId={selectedTicketId}
          canManage={false}
          onChanged={refetch}
        />
      )}
    </div>
  );
}
