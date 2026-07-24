"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MaintenancePriority, MaintenanceStatus } from "@makazi/shared-types";
import { useCaretakerUser } from "./layout";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormButton } from "@/components/shared/form-button";
import { listMyInvites, acceptInvite, declineInvite, type CaretakerInvite } from "@/lib/caretakers";
import { listProperties, type PropertyListItem } from "@/lib/properties";
import { listMaintenanceTickets, type MaintenanceTicket } from "@/lib/maintenance";
import { listTenants } from "@/lib/tenants";
import { maintenanceStatusLabel, maintenanceStatusTone, maintenancePriorityTone, getGreeting } from "@/lib/format";

const OPEN_STATUSES = new Set<MaintenanceStatus>([
  MaintenanceStatus.REPORTED,
  MaintenanceStatus.ASSIGNED,
  MaintenanceStatus.IN_PROGRESS,
]);

const PRIORITY_RANK: Record<MaintenancePriority, number> = {
  [MaintenancePriority.URGENT]: 0,
  [MaintenancePriority.NORMAL]: 1,
  [MaintenancePriority.LOW]: 2,
};

export default function CaretakerOverviewPage() {
  const user = useCaretakerUser();
  const [invites, setInvites] = React.useState<CaretakerInvite[]>([]);
  const [properties, setProperties] = React.useState<PropertyListItem[]>([]);
  const [tickets, setTickets] = React.useState<MaintenanceTicket[]>([]);
  const [tenantsCount, setTenantsCount] = React.useState(0);
  const [initialLoad, setInitialLoad] = React.useState(true);
  const [respondingId, setRespondingId] = React.useState<string | null>(null);

  const refetch = React.useCallback(async () => {
    const [inviteList, propertiesRes, ticketList, tenants] = await Promise.all([
      listMyInvites(),
      listProperties({ pageSize: 100 }),
      listMaintenanceTickets(),
      listTenants(),
    ]);
    setInvites(inviteList);
    setProperties(propertiesRes.data);
    setTickets(ticketList);
    setTenantsCount(tenants.length);
    setInitialLoad(false);
  }, []);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  async function respond(id: string, action: "accept" | "decline") {
    setRespondingId(id);
    try {
      if (action === "accept") {
        await acceptInvite(id);
        toast("Invite accepted. The property now shows up under Properties.");
      } else {
        await declineInvite(id);
        toast("Invite declined.");
      }
      await refetch();
    } finally {
      setRespondingId(null);
    }
  }

  const openTickets = React.useMemo(
    () =>
      tickets
        .filter((t) => OPEN_STATUSES.has(t.status))
        .sort((a, b) => {
          const diff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
          return diff !== 0 ? diff : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }),
    [tickets],
  );

  if (initialLoad) return null;

  const vacantUnits = properties.reduce((sum, p) => sum + p.occupancy.vacant, 0);
  const todayLabel = new Date().toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div>
      <h1 className="font-display font-bold text-[26px] tracking-[-0.02em] mb-1">{getGreeting(user.firstName)}</h1>
      <p className="text-sm text-[var(--stone)] mb-6">{todayLabel}</p>

      {invites.length > 0 && (
        <div className="flex flex-col gap-3 mb-5">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="border border-[var(--warning)] bg-[var(--warning-bg)] rounded-2xl p-4 flex justify-between items-center gap-3 flex-wrap"
            >
              <div>
                <div className="text-[13px] font-semibold">You&apos;ve been invited to manage {invite.property.name}</div>
                <div className="text-xs text-[var(--stone)]">
                  {invite.property.location}
                  {invite.property.county ? `, ${invite.property.county}` : ""}
                </div>
              </div>
              <div className="flex gap-2">
                <FormButton
                  variant="outline"
                  fullWidth={false}
                  disabled={respondingId === invite.id}
                  onClick={() => respond(invite.id, "decline")}
                  className="px-4 py-2 text-xs"
                >
                  Decline
                </FormButton>
                <FormButton
                  fullWidth={false}
                  disabled={respondingId === invite.id}
                  onClick={() => respond(invite.id, "accept")}
                  className="px-4 py-2 text-xs"
                >
                  Accept
                </FormButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-[14px] mb-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <KpiCard label="Assigned Properties" value={String(properties.length)} />
        <KpiCard label="Vacant Units" value={String(vacantUnits)} />
        <KpiCard
          label="Open Tickets"
          value={String(openTickets.length)}
          valueColor={openTickets.length > 0 ? "var(--warning)" : undefined}
        />
        <KpiCard label="Tenants" value={String(tenantsCount)} />
      </div>

      <div className="border border-[var(--line)] rounded-2xl bg-white p-5">
        <div className="flex justify-between items-center mb-3">
          <span className="font-semibold text-sm">Assigned tasks</span>
          <Link href="/caretaker/maintenance" className="text-xs font-semibold text-[var(--green)]">
            View all
          </Link>
        </div>
        {openTickets.length === 0 ? (
          <p className="text-[13px] text-[var(--stone)] py-4 text-center">No open maintenance tickets. You&apos;re all caught up.</p>
        ) : (
          <div className="flex flex-col">
            {openTickets.slice(0, 6).map((t) => (
              <Link
                key={t.id}
                href="/caretaker/maintenance"
                className="flex items-center justify-between py-[10px] border-b border-[var(--line)] last:border-b-0 gap-3"
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate">{t.issue}</div>
                  <div className="text-xs text-[var(--stone)] truncate">
                    {t.unit.property.name} · <span className="font-mono">{t.unit.code}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <StatusBadge tone={maintenancePriorityTone(t.priority)}>{t.priority}</StatusBadge>
                  <StatusBadge tone={maintenanceStatusTone(t.status)}>{maintenanceStatusLabel(t.status)}</StatusBadge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
