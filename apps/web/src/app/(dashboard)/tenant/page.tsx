"use client";

import * as React from "react";
import { useTenantUser } from "./layout";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormButton } from "@/components/shared/form-button";
import { PayRentModal } from "@/components/dashboard/pay-rent-modal";
import { getCurrentLease, type CurrentLease } from "@/lib/lease";
import { getRentStatus, listPayments, type Payment, type PaymentHistoryItem } from "@/lib/payments";
import { listMaintenanceTickets, type MaintenanceTicket } from "@/lib/maintenance";
import { maintenanceStatusLabel, maintenanceStatusTone, formatKES, getGreeting } from "@/lib/format";

type ActivityItem =
  | { kind: "payment"; date: string; data: PaymentHistoryItem }
  | { kind: "maintenance"; date: string; data: MaintenanceTicket };

export default function TenantOverviewPage() {
  const user = useTenantUser();
  const [lease, setLease] = React.useState<CurrentLease | null>(null);
  const [due, setDue] = React.useState<Payment | null>(null);
  const [activity, setActivity] = React.useState<ActivityItem[]>([]);
  const [initialLoad, setInitialLoad] = React.useState(true);
  const [payOpen, setPayOpen] = React.useState(false);

  const refetch = React.useCallback(async () => {
    const [leaseRes, dueRes, payments, tickets] = await Promise.all([
      getCurrentLease(),
      getRentStatus(),
      listPayments(),
      listMaintenanceTickets(),
    ]);
    setLease(leaseRes);
    setDue(dueRes);

    const merged: ActivityItem[] = [
      ...payments.slice(0, 5).map((p): ActivityItem => ({ kind: "payment", date: p.paidAt ?? p.createdAt, data: p })),
      ...tickets.slice(0, 5).map((t): ActivityItem => ({ kind: "maintenance", date: t.createdAt, data: t })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
    setActivity(merged);
    setInitialLoad(false);
  }, []);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  if (initialLoad) return null;

  const todayLabel = new Date().toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long" });
  const isOverdue = due?.status === "LATE";

  return (
    <div>
      <h1 className="font-display font-bold text-[26px] tracking-[-0.02em] mb-1">{getGreeting(user.firstName)}</h1>
      <p className="text-sm text-[var(--stone)] mb-6">{todayLabel}</p>

      {lease && due && (
        <div
          className="rounded-2xl p-6 mb-5 flex justify-between items-center flex-wrap gap-4"
          style={{ background: isOverdue ? "var(--error-bg)" : "var(--ink)", color: isOverdue ? "var(--error)" : "#fff" }}
        >
          <div>
            <div className="text-xs uppercase tracking-wide opacity-80 mb-1">
              {lease.unit.property.name} · {lease.unit.code}
            </div>
            <div className="font-mono font-bold text-3xl mb-1">{formatKES(due.amount)}</div>
            <div className="text-[13px] opacity-80">
              {isOverdue ? "Overdue since " : "Due "}
              {due.dueDate ? new Date(due.dueDate).toLocaleDateString("en-KE", { day: "numeric", month: "long" }) : "—"}
            </div>
          </div>
          <FormButton
            fullWidth={false}
            onClick={() => setPayOpen(true)}
            className="px-6"
            style={isOverdue ? undefined : { background: "#fff", color: "var(--ink)" }}
          >
            Pay rent
          </FormButton>
        </div>
      )}

      <div className="grid gap-[14px] mb-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <KpiCard label="Monthly rent" value={lease ? formatKES(lease.rentAmount) : "—"} />
        <KpiCard label="Deposit held" value={lease?.depositAmount ? formatKES(lease.depositAmount) : "—"} />
        <KpiCard
          label="Lease started"
          value={lease ? new Date(lease.leaseStart).toLocaleDateString("en-KE", { month: "short", year: "numeric" }) : "—"}
        />
      </div>

      <div className="border border-[var(--line)] rounded-2xl bg-white p-5">
        <span className="font-semibold text-sm">Recent activity</span>
        {activity.length === 0 ? (
          <p className="text-[13px] text-[var(--stone)] py-4 text-center">Nothing yet.</p>
        ) : (
          <div className="flex flex-col mt-3">
            {activity.map((item) => (
              <div
                key={`${item.kind}-${item.data.id}`}
                className="flex items-center justify-between py-[10px] border-b border-[var(--line)] last:border-b-0 gap-3"
              >
                {item.kind === "payment" ? (
                  <>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold truncate">Rent payment</div>
                      <div className="text-xs text-[var(--stone)] truncate">{formatKES(item.data.amount)}</div>
                    </div>
                    <StatusBadge tone={item.data.status === "PAID" ? "success" : item.data.status === "FAILED" ? "error" : "warning"}>
                      {item.data.status}
                    </StatusBadge>
                  </>
                ) : (
                  <>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold truncate">{item.data.issue}</div>
                      <div className="text-xs text-[var(--stone)] truncate">{item.data.ticketNumber}</div>
                    </div>
                    <StatusBadge tone={maintenanceStatusTone(item.data.status)}>{maintenanceStatusLabel(item.data.status)}</StatusBadge>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {due && <PayRentModal open={payOpen} onOpenChange={setPayOpen} due={due} onPaid={refetch} />}
    </div>
  );
}
