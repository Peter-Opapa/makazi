"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  downloadReportCsv,
  generatePrintableReport,
  getIncomeReport,
  getMaintenanceReport,
  getOccupancyReport,
  getPaymentsReport,
  getVacancyReport,
  type IncomeReport,
  type MaintenanceReport,
  type OccupancyReport,
  type PaymentsReport,
  type ReportExportType,
  type VacancyReport,
} from "@/lib/reports";
import { listProperties, type PropertyListItem } from "@/lib/properties";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormButton } from "@/components/shared/form-button";

type Tab = "occupancy" | "income" | "vacancies" | "payments" | "maintenance";

const TABS: { key: Tab; label: string }[] = [
  { key: "occupancy", label: "Occupancy" },
  { key: "income", label: "Income" },
  { key: "vacancies", label: "Vacancies" },
  { key: "payments", label: "Payments" },
  { key: "maintenance", label: "Maintenance" },
];

const MONTHS_OPTIONS = [3, 6, 12, 24];

const PIE_COLORS = ["var(--green)", "var(--warning)", "var(--error)", "var(--stone)", "var(--line-2)"];

function fmtKES(n: number) {
  return `KES ${Math.round(n).toLocaleString("en-KE")}`;
}
function fmtPct(n: number) {
  return `${Math.round(n * 100)}%`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

export default function LandlordReportsPage() {
  const [tab, setTab] = React.useState<Tab>("occupancy");
  const [properties, setProperties] = React.useState<PropertyListItem[]>([]);
  const [propertyId, setPropertyId] = React.useState("");
  const [months, setMonths] = React.useState(12);

  const [occupancy, setOccupancy] = React.useState<OccupancyReport | null>(null);
  const [income, setIncome] = React.useState<IncomeReport | null>(null);
  const [vacancies, setVacancies] = React.useState<VacancyReport | null>(null);
  const [payments, setPayments] = React.useState<PaymentsReport | null>(null);
  const [maintenance, setMaintenance] = React.useState<MaintenanceReport | null>(null);
  const [printing, setPrinting] = React.useState(false);
  const [exporting, setExporting] = React.useState<ReportExportType | null>(null);

  const params = React.useMemo(() => ({ propertyId: propertyId || undefined, months }), [propertyId, months]);

  React.useEffect(() => {
    listProperties({ pageSize: 100 }).then((res) => setProperties(res.data));
  }, []);

  React.useEffect(() => {
    getOccupancyReport(params).then(setOccupancy);
    getIncomeReport(params).then(setIncome);
    getVacancyReport(params).then(setVacancies);
    getPaymentsReport(params).then(setPayments);
    getMaintenanceReport(params).then(setMaintenance);
  }, [params]);

  async function handlePrint() {
    setPrinting(true);
    try {
      const { url } = await generatePrintableReport(params);
      window.open(url, "_blank");
    } finally {
      setPrinting(false);
    }
  }

  async function handleExport(type: ReportExportType) {
    setExporting(type);
    try {
      await downloadReportCsv(type, params, `${type}-report.csv`);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <h1 className="font-display font-bold text-2xl tracking-[-0.02em]">Reports</h1>
        <div className="flex gap-2 flex-wrap">
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
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="border border-[var(--line)] rounded-[9px] px-3 py-[9px] text-[13px] bg-[var(--paper)]"
          >
            {MONTHS_OPTIONS.map((m) => (
              <option key={m} value={m}>
                Last {m} months
              </option>
            ))}
          </select>
          <FormButton variant="outline" fullWidth={false} onClick={handlePrint} disabled={printing} className="px-4 text-xs py-2">
            {printing ? "Generating…" : "Print report"}
          </FormButton>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-[var(--line)]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-1 pb-3 text-[13px] font-semibold -mb-px"
            style={{
              color: tab === t.key ? "var(--ink)" : "var(--stone)",
              borderBottom: tab === t.key ? "2px solid var(--green)" : "2px solid transparent",
              marginRight: 20,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "occupancy" && occupancy && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-sm">Occupancy</span>
            <FormButton
              variant="outline"
              fullWidth={false}
              onClick={() => handleExport("occupancy")}
              disabled={exporting === "occupancy"}
              className="px-3 py-[6px] text-xs"
            >
              {exporting === "occupancy" ? "Exporting…" : "Export CSV"}
            </FormButton>
          </div>
          <div className="grid gap-[14px] mb-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            <KpiCard label="Total Units" value={String(occupancy.current.total)} />
            <KpiCard label="Occupied" value={String(occupancy.current.occupied)} valueColor="var(--success)" />
            <KpiCard label="Vacant" value={String(occupancy.current.vacant)} />
            <KpiCard label="Occupancy Rate" value={fmtPct(occupancy.occupancyRate)} />
          </div>
          <div className="border border-[var(--line)] rounded-2xl bg-white p-5 mb-5">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={occupancy.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => fmtPct(v)} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmtPct(Number(v))} />
                <Line type="monotone" dataKey="occupancyRate" name="Occupancy rate" stroke="var(--green-deep)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="border border-[var(--line)] rounded-[14px] overflow-hidden bg-white">
            {occupancy.byProperty.map((p, i) => (
              <div
                key={p.propertyId}
                className="flex items-center justify-between px-4 py-[13px] gap-3 flex-wrap"
                style={i > 0 ? { borderTop: "1px solid var(--line)" } : undefined}
              >
                <span className="text-[13px] font-semibold">{p.propertyName}</span>
                <span className="text-xs text-[var(--stone)]">
                  {p.occupied}/{p.total} occupied · {p.vacant} vacant
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "income" && income && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-sm">Income</span>
            <FormButton
              variant="outline"
              fullWidth={false}
              onClick={() => handleExport("income")}
              disabled={exporting === "income"}
              className="px-3 py-[6px] text-xs"
            >
              {exporting === "income" ? "Exporting…" : "Export CSV"}
            </FormButton>
          </div>
          <div className="grid gap-[14px] mb-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            <KpiCard label="Expected" value={fmtKES(income.totalExpected)} />
            <KpiCard label="Collected" value={fmtKES(income.totalCollected)} valueColor="var(--success)" />
            <KpiCard label="Collection Rate" value={fmtPct(income.collectionRate)} />
          </div>
          <div className="border border-[var(--line)] rounded-2xl bg-white p-5 mb-5">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={income.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmtKES(Number(v))} />
                <Bar dataKey="expected" name="Expected" fill="var(--line-2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" name="Collected" fill="var(--green-deep)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="border border-[var(--line)] rounded-[14px] overflow-hidden bg-white">
            {income.byProperty.map((p, i) => (
              <div
                key={p.propertyId}
                className="flex items-center justify-between px-4 py-[13px] gap-3 flex-wrap"
                style={i > 0 ? { borderTop: "1px solid var(--line)" } : undefined}
              >
                <span className="text-[13px] font-semibold">{p.propertyName}</span>
                <span className="text-xs text-[var(--stone)]">
                  {fmtKES(p.collected)} of {fmtKES(p.expected)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "vacancies" && vacancies && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-sm">Vacancies</span>
            <FormButton
              variant="outline"
              fullWidth={false}
              onClick={() => handleExport("vacancies")}
              disabled={exporting === "vacancies"}
              className="px-3 py-[6px] text-xs"
            >
              {exporting === "vacancies" ? "Exporting…" : "Export CSV"}
            </FormButton>
          </div>
          <div className="grid gap-[14px] mb-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            <KpiCard label="Vacant Units" value={String(vacancies.totalVacant)} />
            <KpiCard label="Total Units" value={String(vacancies.totalUnits)} />
            <KpiCard label="Vacancy Rate" value={fmtPct(vacancies.vacancyRate)} />
          </div>

          {vacancies.units.length === 0 ? (
            <div className="border-[1.5px] border-dashed border-[var(--line-2)] rounded-2xl py-14 px-5 text-center">
              <p className="text-sm text-[var(--stone)]">No vacant units right now.</p>
            </div>
          ) : (
            <>
              <div className="border border-[var(--line)] rounded-2xl bg-white p-5 mb-5">
                <ResponsiveContainer width="100%" height={Math.max(160, vacancies.units.length * 36)}>
                  <BarChart data={vacancies.units.slice(0, 15)} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="unitCode" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip formatter={(v) => `${Number(v)} days`} />
                    <Bar dataKey="daysVacant" name="Days vacant" fill="var(--warning)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="border border-[var(--line)] rounded-[14px] overflow-hidden bg-white">
                {vacancies.units.map((u, i) => (
                  <div
                    key={u.unitId}
                    className="flex items-center justify-between px-4 py-[13px] gap-3 flex-wrap"
                    style={i > 0 ? { borderTop: "1px solid var(--line)" } : undefined}
                  >
                    <div>
                      <div className="text-[13px] font-semibold">
                        {u.propertyName} · <span className="font-mono">{u.unitCode}</span>
                      </div>
                      <div className="text-xs text-[var(--stone)]">Vacant since {fmtDate(u.vacantSince)}</div>
                    </div>
                    <StatusBadge tone={u.daysVacant > 30 ? "error" : "warning"}>{u.daysVacant} days</StatusBadge>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "payments" && payments && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-sm">Payments</span>
            <FormButton
              variant="outline"
              fullWidth={false}
              onClick={() => handleExport("payments")}
              disabled={exporting === "payments"}
              className="px-3 py-[6px] text-xs"
            >
              {exporting === "payments" ? "Exporting…" : "Export CSV"}
            </FormButton>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="border border-[var(--line)] rounded-2xl bg-white p-5">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Paid", value: payments.byStatus.paid },
                      { name: "Late", value: payments.byStatus.late },
                      { name: "Pending", value: payments.byStatus.pending },
                      { name: "Failed", value: payments.byStatus.failed },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                  >
                    {PIE_COLORS.map((color) => (
                      <Cell key={color} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-[10px]" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              <KpiCard label="Paid" value={String(payments.byStatus.paid)} valueColor="var(--success)" />
              <KpiCard label="Late" value={String(payments.byStatus.late)} valueColor="var(--error)" />
              <KpiCard label="Pending" value={String(payments.byStatus.pending)} valueColor="var(--warning)" />
              <KpiCard label="Failed" value={String(payments.byStatus.failed)} />
            </div>
          </div>

          <span className="font-semibold text-sm block mb-3">Overdue tenants</span>
          {payments.overdue.length === 0 ? (
            <div className="border-[1.5px] border-dashed border-[var(--line-2)] rounded-2xl py-10 px-5 text-center">
              <p className="text-sm text-[var(--stone)]">No overdue payments.</p>
            </div>
          ) : (
            <div className="border border-[var(--line)] rounded-[14px] overflow-hidden bg-white">
              {payments.overdue.map((o, i) => (
                <div
                  key={o.paymentId}
                  className="flex items-center justify-between px-4 py-[13px] gap-3 flex-wrap"
                  style={i > 0 ? { borderTop: "1px solid var(--line)" } : undefined}
                >
                  <div>
                    <div className="text-[13px] font-semibold">{o.tenantName}</div>
                    <div className="text-xs text-[var(--stone)]">
                      {o.propertyName} · <span className="font-mono">{o.unitCode}</span> · {fmtKES(o.amount)}
                    </div>
                  </div>
                  <StatusBadge tone="error">{o.daysOverdue} days overdue</StatusBadge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "maintenance" && maintenance && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-sm">Maintenance</span>
            <FormButton
              variant="outline"
              fullWidth={false}
              onClick={() => handleExport("maintenance")}
              disabled={exporting === "maintenance"}
              className="px-3 py-[6px] text-xs"
            >
              {exporting === "maintenance" ? "Exporting…" : "Export CSV"}
            </FormButton>
          </div>
          <div className="grid gap-[14px] mb-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            <KpiCard label="Total Tickets" value={String(maintenance.totalTickets)} />
            <KpiCard label="Open" value={String(maintenance.openCount)} valueColor={maintenance.openCount > 0 ? "var(--warning)" : undefined} />
            <KpiCard
              label="Avg. Resolution"
              value={maintenance.avgResolutionHours !== null ? `${Math.round(maintenance.avgResolutionHours)}h` : "—"}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="border border-[var(--line)] rounded-2xl bg-white p-5">
              <div className="text-xs font-semibold text-[var(--stone)] uppercase tracking-wide mb-3">Volume trend</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={maintenance.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="created" name="Created" fill="var(--stone)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" name="Resolved" fill="var(--green-deep)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="border border-[var(--line)] rounded-2xl bg-white p-5">
              <div className="text-xs font-semibold text-[var(--stone)] uppercase tracking-wide mb-3">By category</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={Object.entries(maintenance.byCategory).map(([name, value]) => ({ name, value }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                  >
                    {Object.keys(maintenance.byCategory).map((key, idx) => (
                      <Cell key={key} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
