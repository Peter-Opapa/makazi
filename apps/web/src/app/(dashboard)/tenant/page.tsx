"use client";

import * as React from "react";
import { toast } from "sonner";
import { TenancyStatus } from "@makazi/shared-types";
import { useTenantUser } from "./layout";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormButton } from "@/components/shared/form-button";
import { PayRentModal } from "@/components/dashboard/pay-rent-modal";
import { getCurrentLease, type CurrentLease } from "@/lib/lease";
import { getRentStatus, listPayments, type Payment, type PaymentHistoryItem } from "@/lib/payments";
import { listMaintenanceTickets, type MaintenanceTicket } from "@/lib/maintenance";
import { listMyTenancies, acceptTenancy, declineTenancy, type MyTenancy } from "@/lib/tenants";
import { ApiError } from "@/lib/api";
import { maintenanceStatusLabel, maintenanceStatusTone, formatKES, getGreeting } from "@/lib/format";
import { SkeletonKpiRow, SkeletonList } from "@/components/shared/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

type ActivityItem =
  | { kind: "payment"; date: string; data: PaymentHistoryItem }
  | { kind: "maintenance"; date: string; data: MaintenanceTicket };

export default function TenantOverviewPage() {
  const user = useTenantUser();
  const [lease, setLease] = React.useState<CurrentLease | null>(null);
  const [due, setDue] = React.useState<Payment | null>(null);
  const [tenancies, setTenancies] = React.useState<MyTenancy[]>([]);
  const [activity, setActivity] = React.useState<ActivityItem[]>([]);
  const [initialLoad, setInitialLoad] = React.useState(true);
  const [payOpen, setPayOpen] = React.useState(false);
  const [respondingId, setRespondingId] = React.useState<string | null>(null);

  const refetch = React.useCallback(async () => {
    // A tenant with no active lease (moved out, or only a pending invite) still
    // loads their dashboard — the lease/rent endpoints 404 in that case, so
    // treat those as "nothing due" rather than letting the page fail.
    const [tenancyList, leaseRes, dueRes, payments, tickets] = await Promise.all([
      listMyTenancies(),
      getCurrentLease().catch(() => null),
      getRentStatus().catch(() => null),
      listPayments().catch(() => []),
      listMaintenanceTickets().catch(() => []),
    ]);
    setTenancies(tenancyList);
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

  async function respond(tenancyId: string, action: "accept" | "decline") {
    setRespondingId(tenancyId);
    try {
      if (action === "accept") {
        await acceptTenancy(tenancyId);
        toast("Tenancy accepted. Welcome to your new home!");
      } else {
        await declineTenancy(tenancyId);
        toast("Invitation declined.");
      }
      await refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setRespondingId(null);
    }
  }

  const todayLabel = new Date().toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long" });

  if (initialLoad) {
    return (
      <div>
        <h1 className="font-display font-bold text-[26px] tracking-[-0.02em] mb-1">{getGreeting(user.firstName)}</h1>
        <p className="text-sm text-[var(--stone)] mb-6">{todayLabel}</p>
        <Skeleton className="h-[132px] w-full rounded-2xl mb-5" />
        <SkeletonKpiRow count={3} />
        <SkeletonList rows={4} />
      </div>
    );
  }
  const isOverdue = due?.status === "LATE";
  const pendingInvites = tenancies.filter((t) => t.status === TenancyStatus.PENDING);
  const hasActiveTenancy = tenancies.some((t) => t.status === TenancyStatus.ACTIVE);

  return (
    <div>
      <h1 className="font-display font-bold text-[26px] tracking-[-0.02em] mb-1">{getGreeting(user.firstName)}</h1>
      <p className="text-sm text-[var(--stone)] mb-6">{todayLabel}</p>

      {pendingInvites.length > 0 && (
        <div className="flex flex-col gap-3 mb-5">
          {pendingInvites.map((invite) => (
            <div
              key={invite.id}
              className="border border-[var(--warning)] bg-[var(--warning-bg)] rounded-2xl p-4 flex justify-between items-center gap-3 flex-wrap"
            >
              <div>
                <div className="text-[13px] font-semibold">
                  {invite.landlordName} invited you to {invite.property.name}, unit {invite.unit.code}
                </div>
                <div className="text-xs text-[var(--stone)]">Rent {formatKES(invite.rentAmount)} · accept to activate this tenancy</div>
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

      {!hasActiveTenancy && (
        <div className="border border-[var(--line)] rounded-2xl bg-[var(--paper)] p-6 mb-5">
          <div className="font-semibold text-[15px] mb-1">You don&apos;t have an active lease right now</div>
          <p className="text-[13px] text-[var(--stone)]">
            {pendingInvites.length > 0
              ? "Accept an invitation above to activate a tenancy and unlock rent payments and issue reporting."
              : "Your history stays here for your records. When a landlord assigns you a unit, you'll get an invite to accept and your dashboard will unlock again."}
          </p>
        </div>
      )}

      {hasActiveTenancy && lease && due && (
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
