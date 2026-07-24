"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getAdminAnalytics, type AdminAnalytics } from "@/lib/admin";
import { formatKES } from "@/lib/format";

const AXIS_TICK = { fontSize: 11, fill: "var(--stone)" };

export default function AdminAnalyticsPage() {
  const [data, setData] = React.useState<AdminAnalytics | null>(null);

  React.useEffect(() => {
    getAdminAnalytics(12).then(setData);
  }, []);

  if (!data) return null;
  const { userGrowth, revenueTrend, occupancyTrend, maintenanceTrend, supportTrend, geoDistribution } = data;

  return (
    <div>
      <h1 className="font-display font-bold text-2xl tracking-[-0.02em] mb-1">Platform analytics</h1>
      <p className="text-sm text-[var(--stone)] mb-6">Last 12 months, platform-wide.</p>

      <ChartCard title="User growth">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={userGrowth}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
            <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={36} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="landlords" name="Landlords" stroke="var(--green-deep)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="caretakers" name="Caretakers" stroke="var(--clay)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="tenants" name="Tenants" stroke="var(--warning)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Revenue growth">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={40} />
              <Tooltip formatter={(v) => formatKES(Number(v))} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="revenue" name="Revenue" fill="var(--green-deep)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Occupancy rate">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={occupancyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
              <Tooltip formatter={(v) => `${Math.round(Number(v) * 100)}%`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="occupancyRate" name="Occupancy rate" stroke="var(--green-deep)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Maintenance volume">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={maintenanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="created" name="Created" fill="var(--line-2)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" name="Resolved" fill="var(--green-deep)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Support ticket volume">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={supportTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="created" name="Created" fill="var(--line-2)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" name="Resolved" fill="var(--green-deep)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Properties by county">
        <div className="border border-[var(--line)] rounded-[14px] overflow-hidden">
          <div className="grid grid-cols-3 px-4 py-3 bg-[var(--paper)] text-[11px] font-semibold text-[var(--stone)] uppercase tracking-wide">
            <span>County</span>
            <span>Properties</span>
            <span>Units</span>
          </div>
          {geoDistribution.length === 0 && <div className="px-4 py-8 text-center text-sm text-[var(--stone)]">No properties yet.</div>}
          {geoDistribution.map((g) => (
            <div key={g.county} className="grid grid-cols-3 px-4 py-3 border-t border-[var(--line)] text-[13px]">
              <span className="font-semibold">{g.county}</span>
              <span className="font-mono">{g.properties}</span>
              <span className="font-mono">{g.units}</span>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-[var(--line)] rounded-2xl bg-white p-5 mb-4">
      <div className="font-semibold text-sm mb-4">{title}</div>
      {children}
    </div>
  );
}
