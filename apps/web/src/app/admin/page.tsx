"use client";

import * as React from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getAdminDashboard, type AdminDashboardOverview } from "@/lib/admin";
import { formatKES } from "@/lib/format";
import { KpiCard } from "@/components/shared/kpi-card";
import { useAdminUser } from "./layout";

export default function AdminDashboardPage() {
  const user = useAdminUser();
  const [data, setData] = React.useState<AdminDashboardOverview | null>(null);

  React.useEffect(() => {
    getAdminDashboard().then(setData);
  }, []);

  if (!data) return null;
  const { kpis, geoDistribution, revenueTrend } = data;

  return (
    <div>
      <h1 className="font-display font-bold text-[26px] tracking-[-0.02em] mb-1">Platform overview</h1>
      <p className="text-sm text-[var(--stone)] mb-6">Welcome back, {user.firstName}</p>

      <div className="grid gap-[14px] mb-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
        <KpiCard label="Landlords" value={String(kpis.totalLandlords)} sub={`+${kpis.newLandlordsThisMonth} this month`} />
        <KpiCard label="Caretakers" value={String(kpis.totalCaretakers)} />
        <KpiCard label="Tenants" value={String(kpis.totalTenants)} sub={`+${kpis.newTenantsThisMonth} this month`} />
        <KpiCard label="Properties" value={String(kpis.totalProperties)} sub={`+${kpis.newPropertiesThisMonth} this month`} />
        <KpiCard label="Rental Units" value={String(kpis.totalUnits)} />
        <KpiCard label="Payments Recorded" value={String(kpis.totalPaymentsRecorded)} />
        <KpiCard label="Payments Today" value={String(kpis.paymentsToday)} sub={formatKES(kpis.revenueToday)} />
        <KpiCard
          label="Maintenance Requests"
          value={String(kpis.openMaintenanceCount)}
          sub={kpis.overdueMaintenanceCount > 0 ? `${kpis.overdueMaintenanceCount} over 3 days` : undefined}
          valueColor={kpis.overdueMaintenanceCount > 0 ? "var(--warning)" : undefined}
        />
        <KpiCard
          label="Support Tickets"
          value={String(kpis.openSupportTickets)}
          sub={kpis.escalatedSupportTickets > 0 ? `${kpis.escalatedSupportTickets} escalated` : undefined}
          valueColor={kpis.escalatedSupportTickets > 0 ? "var(--error)" : undefined}
        />
        <KpiCard label="Monthly Revenue" value={formatKES(kpis.monthlyRevenue)} valueColor="var(--success)" />
        <KpiCard label="Active Users" value={String(kpis.activeUsers)} />
        <KpiCard
          label="Pending Verifications"
          value={String(kpis.pendingVerifications)}
          sub={kpis.pendingVerifications > 0 ? "Review needed" : undefined}
          valueColor={kpis.pendingVerifications > 0 ? "var(--warning)" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-4 mb-4">
        <div className="border border-[var(--line)] rounded-2xl bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-sm">Revenue growth</span>
            <span className="font-mono text-[11px] text-[var(--stone)]">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--stone)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--stone)" }} axisLine={false} tickLine={false} width={40} />
              <Tooltip formatter={(v) => formatKES(Number(v))} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="revenue" name="Revenue" fill="var(--green-deep)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-[var(--line)] rounded-2xl bg-white p-5">
          <div className="font-semibold text-sm mb-4">Geographic distribution</div>
          {geoDistribution.length === 0 && <p className="text-sm text-[var(--stone)]">No properties yet.</p>}
          {geoDistribution.slice(0, 5).map((g) => (
            <div key={g.county} className="mb-3">
              <div className="flex justify-between text-[12.5px] mb-1">
                <span>{g.county}</span>
                <span className="font-mono text-[var(--stone)]">{g.pct}%</span>
              </div>
              <div className="h-1.5 bg-[var(--line)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--green)] rounded-full" style={{ width: `${g.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {kpis.pendingVerifications > 0 && (
        <div className="rounded-2xl p-5 text-white" style={{ background: "var(--green-deep)" }}>
          <div className="font-semibold text-sm mb-2">Pending verifications</div>
          <p className="text-[13px] mb-3" style={{ color: "#DCEAE2" }}>
            {kpis.pendingVerifications} account{kpis.pendingVerifications === 1 ? "" : "s"} awaiting identity verification.
          </p>
          <Link
            href="/admin/users"
            className="inline-block bg-white rounded-[9px] px-4 py-[9px] text-[12.5px] font-bold"
            style={{ color: "var(--green-deep)" }}
          >
            Review queue
          </Link>
        </div>
      )}
    </div>
  );
}
