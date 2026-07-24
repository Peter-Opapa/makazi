"use client";

import * as React from "react";
import { useLandlordUser } from "./layout";
import { KpiCard } from "@/components/shared/kpi-card";
import { SetupProgressTracker } from "@/components/dashboard/setup-progress-tracker";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { PropertySummary } from "@/components/dashboard/property-summary";
import { OccupancySummary } from "@/components/dashboard/occupancy-summary";
import { RecentPayments } from "@/components/dashboard/recent-payments";
import { RecentMaintenance } from "@/components/dashboard/recent-maintenance";
import { getDashboardSummary, type DashboardSummary } from "@/lib/reports";
import { formatKES, getGreeting } from "@/lib/format";

export default function LandlordOverviewPage() {
  const user = useLandlordUser();
  const todayLabel = new Date().toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long" });
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null);

  const refetch = React.useCallback(async () => {
    setSummary(await getDashboardSummary());
  }, []);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <div>
      <h1 className="font-display font-bold text-[26px] tracking-[-0.02em] mb-1">{getGreeting(user.firstName)}</h1>
      <p className="text-sm text-[var(--stone)] mb-6">{todayLabel}</p>

      <SetupProgressTracker />

      {summary && (
        <>
          <div className="grid gap-[14px] mb-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <KpiCard label="Revenue" value={formatKES(summary.stats.revenueKES)} sub={summary.stats.revenueSub} />
            <KpiCard label="Occupancy" value={`${summary.stats.occupancyPct}%`} sub={summary.stats.occupancySub} />
            <KpiCard label="Properties" value={String(summary.stats.propertiesCount)} sub={summary.stats.propertiesSub} />
            <KpiCard label="Tenants" value={String(summary.stats.tenantsCount)} sub={summary.stats.tenantsSub} />
            <KpiCard label="Vacant Units" value={String(summary.stats.vacantUnits)} sub={summary.stats.vacantSub} />
            <KpiCard
              label="Outstanding Rent"
              value={formatKES(summary.stats.outstandingRentKES)}
              sub={summary.stats.outstandingSub}
              valueColor="var(--warning)"
            />
          </div>

          <QuickActions />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <PropertySummary properties={summary.properties} />
            <OccupancySummary breakdown={summary.occupancyBreakdown} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RecentPayments payments={summary.recentPayments} />
            <RecentMaintenance tickets={summary.recentMaintenance} />
          </div>
        </>
      )}
    </div>
  );
}
