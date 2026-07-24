"use client";

import * as React from "react";
import { MaintenanceStatus } from "@makazi/shared-types";
import { listMaintenanceTickets, type MaintenanceTicket } from "@/lib/maintenance";
import { listProperties, type PropertyListItem } from "@/lib/properties";
import { maintenanceStatusLabel, maintenancePriorityTone } from "@/lib/format";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormButton } from "@/components/shared/form-button";
import { ReportIssueModal } from "@/components/dashboard/report-issue-modal";
import { TicketDetailModal } from "@/components/dashboard/ticket-detail-modal";

const COLUMNS: MaintenanceStatus[] = [
  MaintenanceStatus.REPORTED,
  MaintenanceStatus.ASSIGNED,
  MaintenanceStatus.IN_PROGRESS,
  MaintenanceStatus.COMPLETED,
  MaintenanceStatus.CLOSED,
];

export default function CaretakerMaintenancePage() {
  const [tickets, setTickets] = React.useState<MaintenanceTicket[]>([]);
  const [properties, setProperties] = React.useState<PropertyListItem[]>([]);
  const [propertyId, setPropertyId] = React.useState("");
  const [reportOpen, setReportOpen] = React.useState(false);
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null);

  const refetch = React.useCallback(async () => {
    const res = await listMaintenanceTickets(propertyId ? { propertyId } : undefined);
    setTickets(res);
  }, [propertyId]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  React.useEffect(() => {
    listProperties({ pageSize: 100 }).then((res) => setProperties(res.data));
  }, []);

  const byStatus = React.useMemo(() => {
    const groups = new Map<MaintenanceStatus, MaintenanceTicket[]>();
    for (const status of COLUMNS) groups.set(status, []);
    for (const ticket of tickets) groups.get(ticket.status)?.push(ticket);
    return groups;
  }, [tickets]);

  return (
    <div>
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <h1 className="font-display font-bold text-2xl tracking-[-0.02em]">Maintenance</h1>
        <div className="flex gap-2">
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="border border-[var(--line)] rounded-[9px] px-3 py-[9px] text-[13px] bg-[var(--paper)]"
          >
            <option value="">All properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <FormButton fullWidth={false} onClick={() => setReportOpen(true)} className="px-4">
            Report issue
          </FormButton>
        </div>
      </div>

      <div className="grid gap-4 overflow-x-auto" style={{ gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(220px, 1fr))` }}>
        {COLUMNS.map((status) => {
          const columnTickets = byStatus.get(status) ?? [];
          return (
            <div key={status} className="min-w-0">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-semibold text-[var(--stone)] uppercase tracking-wide">
                  {maintenanceStatusLabel(status)}
                </span>
                <span className="font-mono text-xs text-[var(--stone)]">{columnTickets.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {columnTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className="text-left border border-[var(--line)] rounded-[12px] bg-white p-3"
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="font-mono text-[10px] text-[var(--stone)]">{ticket.ticketNumber}</span>
                      <StatusBadge tone={maintenancePriorityTone(ticket.priority)}>{ticket.priority}</StatusBadge>
                    </div>
                    <div className="text-[13px] font-semibold mb-1 line-clamp-2">{ticket.issue}</div>
                    <div className="text-xs text-[var(--stone)] truncate">
                      {ticket.unit.property.name} · <span className="font-mono">{ticket.unit.code}</span>
                    </div>
                  </button>
                ))}
                {columnTickets.length === 0 && (
                  <div className="border-[1.5px] border-dashed border-[var(--line-2)] rounded-[12px] py-8 text-center">
                    <span className="text-xs text-[var(--stone)]">Nothing here</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ReportIssueModal open={reportOpen} onOpenChange={setReportOpen} onCreated={refetch} />

      {selectedTicketId && (
        <TicketDetailModal
          open={!!selectedTicketId}
          onOpenChange={(open) => !open && setSelectedTicketId(null)}
          ticketId={selectedTicketId}
          canManage
          onChanged={refetch}
        />
      )}
    </div>
  );
}
