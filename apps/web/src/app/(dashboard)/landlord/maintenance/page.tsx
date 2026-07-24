"use client";

import * as React from "react";
import { toast } from "sonner";
import { MaintenanceCategory, MaintenanceStatus } from "@makazi/shared-types";
import { listMaintenanceTickets, type MaintenanceTicket } from "@/lib/maintenance";
import { listProperties, type PropertyListItem } from "@/lib/properties";
import { createTechnician, listTechnicians, updateTechnician, type Technician } from "@/lib/technicians";
import { maintenanceCategoryLabel, maintenanceStatusLabel, maintenancePriorityTone } from "@/lib/format";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";
import { ReportIssueModal } from "@/components/dashboard/report-issue-modal";
import { TicketDetailModal } from "@/components/dashboard/ticket-detail-modal";
import { ApiError } from "@/lib/api";

const COLUMNS: MaintenanceStatus[] = [
  MaintenanceStatus.REPORTED,
  MaintenanceStatus.ASSIGNED,
  MaintenanceStatus.IN_PROGRESS,
  MaintenanceStatus.COMPLETED,
  MaintenanceStatus.CLOSED,
];

const SPECIALTY_OPTIONS = Object.values(MaintenanceCategory);

type Tab = "tickets" | "technicians";

export default function LandlordMaintenancePage() {
  const [tab, setTab] = React.useState<Tab>("tickets");
  const [tickets, setTickets] = React.useState<MaintenanceTicket[]>([]);
  const [properties, setProperties] = React.useState<PropertyListItem[]>([]);
  const [propertyId, setPropertyId] = React.useState("");
  const [category, setCategory] = React.useState<MaintenanceCategory | "">("");
  const [reportOpen, setReportOpen] = React.useState(false);
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null);

  const [technicians, setTechnicians] = React.useState<Technician[]>([]);
  const [addingTechnician, setAddingTechnician] = React.useState(false);
  const [techName, setTechName] = React.useState("");
  const [techPhone, setTechPhone] = React.useState("");
  const [techSpecialty, setTechSpecialty] = React.useState<MaintenanceCategory | "">("");
  const [techError, setTechError] = React.useState<string | null>(null);
  const [savingTechnician, setSavingTechnician] = React.useState(false);

  const refetchTickets = React.useCallback(async () => {
    const res = await listMaintenanceTickets({
      propertyId: propertyId || undefined,
      category: category || undefined,
    });
    setTickets(res);
  }, [propertyId, category]);

  const refetchTechnicians = React.useCallback(async () => {
    setTechnicians(await listTechnicians());
  }, []);

  React.useEffect(() => {
    refetchTickets();
  }, [refetchTickets]);

  React.useEffect(() => {
    refetchTechnicians();
  }, [refetchTechnicians]);

  React.useEffect(() => {
    listProperties({ pageSize: 100 }).then((res) => setProperties(res.data));
  }, []);

  const byStatus = React.useMemo(() => {
    const groups = new Map<MaintenanceStatus, MaintenanceTicket[]>();
    for (const status of COLUMNS) groups.set(status, []);
    for (const ticket of tickets) groups.get(ticket.status)?.push(ticket);
    return groups;
  }, [tickets]);

  async function handleAddTechnician(e: React.FormEvent) {
    e.preventDefault();
    setTechError(null);
    setSavingTechnician(true);
    try {
      await createTechnician({ name: techName, phone: techPhone, specialty: techSpecialty || undefined });
      setTechName("");
      setTechPhone("");
      setTechSpecialty("");
      setAddingTechnician(false);
      toast("Technician added.");
      await refetchTechnicians();
    } catch (err) {
      setTechError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSavingTechnician(false);
    }
  }

  async function handleDeactivate(technician: Technician) {
    await updateTechnician(technician.id, { active: false });
    toast("Technician removed from roster.");
    await refetchTechnicians();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <h1 className="font-display font-bold text-2xl tracking-[-0.02em]">Maintenance</h1>
      </div>

      <div className="flex gap-2 mb-5 border-b border-[var(--line)]">
        {(["tickets", "technicians"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-1 pb-3 text-[13px] font-semibold -mb-px"
            style={{
              color: tab === t ? "var(--ink)" : "var(--stone)",
              borderBottom: tab === t ? "2px solid var(--green)" : "2px solid transparent",
              marginRight: 20,
            }}
          >
            {t === "tickets" ? "Tickets" : "Technicians"}
          </button>
        ))}
      </div>

      {tab === "tickets" && (
        <>
          <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
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
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MaintenanceCategory | "")}
                className="border border-[var(--line)] rounded-[9px] px-3 py-[9px] text-[13px] bg-[var(--paper)]"
              >
                <option value="">All categories</option>
                {SPECIALTY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {maintenanceCategoryLabel(c)}
                  </option>
                ))}
              </select>
            </div>
            <FormButton fullWidth={false} onClick={() => setReportOpen(true)} className="px-4">
              Report issue
            </FormButton>
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
        </>
      )}

      {tab === "technicians" && (
        <div className="max-w-[600px]">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-sm">Your roster</span>
            <FormButton fullWidth={false} onClick={() => setAddingTechnician((v) => !v)} className="px-3 py-2 text-xs">
              {addingTechnician ? "Cancel" : "Add technician"}
            </FormButton>
          </div>

          {addingTechnician && (
            <form onSubmit={handleAddTechnician} className="border border-[var(--line)] rounded-2xl bg-white p-4 mb-4">
              {techError && <InlineError icon={false}>{techError}</InlineError>}
              <div className="grid grid-cols-2 gap-[10px] mb-3">
                <input
                  type="text"
                  required
                  value={techName}
                  onChange={(e) => setTechName(e.target.value)}
                  placeholder="Name"
                  className="px-3 py-[9px] border-[1.5px] border-[var(--line-2)] rounded-[9px] text-[13px]"
                />
                <input
                  type="tel"
                  required
                  value={techPhone}
                  onChange={(e) => setTechPhone(e.target.value)}
                  placeholder="Phone"
                  className="px-3 py-[9px] border-[1.5px] border-[var(--line-2)] rounded-[9px] text-[13px]"
                />
              </div>
              <select
                value={techSpecialty}
                onChange={(e) => setTechSpecialty(e.target.value as MaintenanceCategory | "")}
                className="w-full px-3 py-[9px] border-[1.5px] border-[var(--line-2)] rounded-[9px] bg-white text-[13px] mb-3"
              >
                <option value="">Specialty (optional)</option>
                {SPECIALTY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {maintenanceCategoryLabel(c)}
                  </option>
                ))}
              </select>
              <FormButton type="submit" fullWidth={false} disabled={savingTechnician} className="px-4 text-xs py-2">
                {savingTechnician ? "Saving…" : "Add"}
              </FormButton>
            </form>
          )}

          {technicians.length === 0 ? (
            <div className="border-[1.5px] border-dashed border-[var(--line-2)] rounded-2xl py-12 px-5 text-center">
              <p className="text-sm text-[var(--stone)]">No technicians yet.</p>
            </div>
          ) : (
            <div className="border border-[var(--line)] rounded-[14px] overflow-hidden bg-white">
              {technicians.map((t, i) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between px-4 py-[13px] gap-3 flex-wrap"
                  style={i > 0 ? { borderTop: "1px solid var(--line)" } : undefined}
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold truncate">{t.name}</div>
                    <div className="text-xs text-[var(--stone)] truncate">
                      {t.phone}
                      {t.specialty ? ` · ${maintenanceCategoryLabel(t.specialty)}` : ""}
                    </div>
                  </div>
                  <button onClick={() => handleDeactivate(t)} className="text-xs font-semibold text-[var(--error)] shrink-0">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ReportIssueModal open={reportOpen} onOpenChange={setReportOpen} onCreated={refetchTickets} />

      {selectedTicketId && (
        <TicketDetailModal
          open={!!selectedTicketId}
          onOpenChange={(open) => !open && setSelectedTicketId(null)}
          ticketId={selectedTicketId}
          canManage
          onChanged={refetchTickets}
        />
      )}
    </div>
  );
}
