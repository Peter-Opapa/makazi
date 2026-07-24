import type { PaymentStatus, MaintenanceStatus, UnitStatus } from "@makazi/shared-types";
import { API_URL, apiFetch, getToken } from "./api";

export interface DashboardProperty {
  id: string;
  name: string;
  location: string;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
}

export interface DashboardPayment {
  id: string;
  tenantName: string;
  unit: string;
  amountKES: number;
  status: PaymentStatus;
}

export interface DashboardMaintenanceItem {
  id: string;
  reportedByName: string;
  unit: string;
  issue: string;
  status: MaintenanceStatus;
}

export interface DashboardSummary {
  stats: {
    revenueKES: number;
    revenueSub: string;
    occupancyPct: number;
    occupancySub: string;
    propertiesCount: number;
    propertiesSub: string;
    tenantsCount: number;
    tenantsSub: string;
    vacantUnits: number;
    vacantSub: string;
    outstandingRentKES: number;
    outstandingSub: string;
  };
  properties: DashboardProperty[];
  occupancyBreakdown: { status: UnitStatus; count: number }[];
  recentPayments: DashboardPayment[];
  recentMaintenance: DashboardMaintenanceItem[];
}

export function getDashboardSummary() {
  return apiFetch<DashboardSummary>("/reports/dashboard-summary");
}

export interface OccupancyReport {
  current: { total: number; occupied: number; vacant: number; reserved: number; underMaintenance: number };
  occupancyRate: number;
  trend: { month: string; totalUnits: number; occupiedUnits: number; occupancyRate: number }[];
  byProperty: { propertyId: string; propertyName: string; total: number; occupied: number; vacant: number }[];
}

export interface IncomeReport {
  totalExpected: number;
  totalCollected: number;
  collectionRate: number;
  trend: { month: string; expected: number; collected: number; collectionRate: number }[];
  byProperty: { propertyId: string; propertyName: string; expected: number; collected: number }[];
}

export interface VacancyReport {
  totalVacant: number;
  totalUnits: number;
  vacancyRate: number;
  units: { unitId: string; unitCode: string; propertyId: string; propertyName: string; vacantSince: string; daysVacant: number }[];
}

export interface PaymentsReport {
  totalPayments: number;
  byStatus: { pending: number; late: number; paid: number; failed: number };
  overdue: {
    paymentId: string;
    tenantName: string;
    unitCode: string;
    propertyName: string;
    amount: number;
    dueDate: string | null;
    daysOverdue: number;
  }[];
}

export interface MaintenanceReport {
  totalTickets: number;
  openCount: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  avgResolutionHours: number | null;
  trend: { month: string; created: number; resolved: number }[];
}

export type ReportExportType = "occupancy" | "income" | "vacancies" | "payments" | "maintenance";

export interface ReportParams {
  propertyId?: string;
  months?: number;
}

function toQueryString(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  const str = qs.toString();
  return str ? `?${str}` : "";
}

export function getOccupancyReport(params?: ReportParams) {
  return apiFetch<OccupancyReport>(`/reports/occupancy${toQueryString({ ...params })}`);
}

export function getIncomeReport(params?: ReportParams) {
  return apiFetch<IncomeReport>(`/reports/income${toQueryString({ ...params })}`);
}

export function getVacancyReport(params?: ReportParams) {
  return apiFetch<VacancyReport>(`/reports/vacancies${toQueryString({ propertyId: params?.propertyId })}`);
}

export function getPaymentsReport(params?: ReportParams) {
  return apiFetch<PaymentsReport>(`/reports/payments${toQueryString({ ...params })}`);
}

export function getMaintenanceReport(params?: ReportParams) {
  return apiFetch<MaintenanceReport>(`/reports/maintenance${toQueryString({ ...params })}`);
}

export function generatePrintableReport(params?: ReportParams) {
  return apiFetch<{ url: string }>(`/reports/export/print${toQueryString({ ...params })}`);
}

/** CSV export needs an authenticated fetch (the endpoint requires the JWT), so it can't just be a plain <a href> — fetch as a blob, then trigger the browser's download UI. */
export async function downloadReportCsv(type: ReportExportType, params: ReportParams | undefined, filename: string) {
  const token = getToken();
  const qs = toQueryString({ type, ...(params ?? {}) });
  const res = await fetch(`${API_URL}/reports/export/csv${qs}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
