import type {
  AdminSubRole,
  MaintenancePriority,
  MaintenanceStatus,
  PaymentChannel,
  PaymentStatus,
  SupportTicketStatus,
  UserRole,
} from "@makazi/shared-types";
import { apiFetch } from "./api";

function toQueryString(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  const str = qs.toString();
  return str ? `?${str}` : "";
}

// ---------- Dashboard ----------

export interface AdminDashboardOverview {
  kpis: {
    totalLandlords: number;
    totalCaretakers: number;
    totalTenants: number;
    totalProperties: number;
    totalUnits: number;
    totalPaymentsRecorded: number;
    paymentsToday: number;
    revenueToday: number;
    monthlyRevenue: number;
    openMaintenanceCount: number;
    overdueMaintenanceCount: number;
    openSupportTickets: number;
    escalatedSupportTickets: number;
    activeUsers: number;
    pendingVerifications: number;
    newLandlordsThisMonth: number;
    newTenantsThisMonth: number;
    newPropertiesThisMonth: number;
  };
  geoDistribution: { county: string; count: number; pct: number }[];
  revenueTrend: { month: string; revenue: number }[];
}

export function getAdminDashboard() {
  return apiFetch<AdminDashboardOverview>("/admin/dashboard");
}

// ---------- Users ----------

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  adminSubRole: AdminSubRole | null;
  status: "active" | "suspended";
  verified: boolean;
  joined: string;
}

export interface AdminUserDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  adminSubRole: AdminSubRole | null;
  status: "active" | "suspended";
  verified: boolean;
  joined: string;
  context: string;
  supportTicketCount: number;
}

export function listAdminUsers(params?: { role?: UserRole; search?: string }) {
  return apiFetch<AdminUserListItem[]>(`/admin/users${toQueryString(params ?? {})}`);
}

export function getAdminUserDetail(id: string) {
  return apiFetch<AdminUserDetail>(`/admin/users/${id}`);
}

export function suspendAdminUser(id: string) {
  return apiFetch<{ status: string }>(`/admin/users/${id}/suspend`, { method: "PATCH" });
}

export function reactivateAdminUser(id: string) {
  return apiFetch<{ status: string }>(`/admin/users/${id}/reactivate`, { method: "PATCH" });
}

export function verifyAdminUser(id: string) {
  return apiFetch<{ verified: true }>(`/admin/users/${id}/verify`, { method: "PATCH" });
}

export function resetAdminUserPassword(id: string) {
  return apiFetch<{ message: string }>(`/admin/users/${id}/reset-password`, { method: "POST" });
}

// ---------- Properties ----------

export interface AdminPropertyListItem {
  id: string;
  name: string;
  county: string | null;
  location: string;
  landlord: string;
  units: number;
  occupancyPct: number;
}

export interface AdminPropertyDetail extends AdminPropertyListItem {
  propertyType: string;
  caretakers: string;
  tenants: number;
  maintenanceTotal: number;
  maintenanceOpen: number;
}

export function listAdminProperties(params?: { county?: string; search?: string }) {
  return apiFetch<AdminPropertyListItem[]>(`/admin/properties${toQueryString(params ?? {})}`);
}

export function getAdminPropertyDetail(id: string) {
  return apiFetch<AdminPropertyDetail>(`/admin/properties/${id}`);
}

// ---------- Payments ----------

export interface AdminPaymentListItem {
  id: string;
  time: string;
  tenant: string;
  property: string;
  amount: number;
  channel: PaymentChannel;
  status: PaymentStatus;
  reference: string | null;
}

export interface AdminPaymentDetail extends AdminPaymentListItem {
  gatewayRequestId: string | null;
  gatewayResponse: unknown;
  dueDate: string | null;
  paidAt: string | null;
}

export interface AdminUnmatchedPayment {
  id: string;
  time: string;
  payerPhone: string;
  property: string;
  amount: number;
  accountReference: string;
  transactionId: string;
}

export function listAdminPayments(params?: { status?: PaymentStatus; search?: string }) {
  return apiFetch<AdminPaymentListItem[]>(`/admin/payments${toQueryString(params ?? {})}`);
}

export function getAdminPaymentDetail(id: string) {
  return apiFetch<AdminPaymentDetail>(`/admin/payments/${id}`);
}

export function listAdminUnmatchedPayments(search?: string) {
  return apiFetch<AdminUnmatchedPayment[]>(`/admin/payments/unmatched${toQueryString({ search })}`);
}

export function resolveAdminUnmatchedPayment(id: string, tenancyId: string) {
  return apiFetch(`/admin/payments/unmatched/${id}/resolve`, { method: "POST", body: JSON.stringify({ tenancyId }) });
}

export interface AdminTenancySearchResult {
  tenancyId: string;
  tenantName: string;
  property: string;
  unitCode: string;
}

export function searchAdminActiveTenancies(search: string) {
  return apiFetch<AdminTenancySearchResult[]>(`/admin/payments/unmatched/tenancy-search${toQueryString({ search })}`);
}

// ---------- Maintenance ----------

export interface AdminMaintenanceListItem {
  id: string;
  ticketNumber: string;
  issue: string;
  property: string;
  technician: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  createdAt: string;
}

export interface AdminMaintenanceDetail {
  id: string;
  ticketNumber: string;
  issue: string;
  category: string | null;
  property: string;
  unitCode: string;
  reportedBy: string;
  technician: { id: string; name: string } | null;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  createdAt: string;
  eligibleTechnicians: { id: string; name: string; specialty: string | null }[];
}

export function listAdminMaintenance() {
  return apiFetch<AdminMaintenanceListItem[]>("/admin/maintenance");
}

export function getAdminMaintenanceStatusCounts() {
  return apiFetch<Record<MaintenanceStatus, number>>("/admin/maintenance/status-counts");
}

export function getAdminMaintenanceDetail(id: string) {
  return apiFetch<AdminMaintenanceDetail>(`/admin/maintenance/${id}`);
}

export function reassignAdminMaintenanceTechnician(id: string, technicianId: string) {
  return apiFetch(`/admin/maintenance/${id}/reassign`, { method: "PATCH", body: JSON.stringify({ technicianId }) });
}

export function escalateAdminMaintenance(id: string) {
  return apiFetch(`/admin/maintenance/${id}/escalate`, { method: "PATCH" });
}

// ---------- Support tickets ----------

export interface AdminSupportTicketListItem {
  id: string;
  ticketNumber: string;
  subject: string;
  customer: string;
  agent: string;
  agentId: string | null;
  status: SupportTicketStatus;
  createdAt: string;
}

export interface AdminSupportTicketDetail {
  id: string;
  ticketNumber: string;
  subject: string;
  message: string;
  customer: string;
  customerRole: UserRole;
  agentId: string | null;
  agent: string;
  internalNotes: string | null;
  status: SupportTicketStatus;
  createdAt: string;
  resolvedAt: string | null;
}

export function createSupportTicket(input: { subject: string; message: string }) {
  return apiFetch("/support-tickets", { method: "POST", body: JSON.stringify(input) });
}

export function listAdminSupportTickets() {
  return apiFetch<AdminSupportTicketListItem[]>("/support-tickets");
}

export function getAdminSupportStatusCounts() {
  return apiFetch<{ open: number; escalated: number; resolvedToday: number }>("/support-tickets/status-counts");
}

export function getAdminSupportTicketDetail(id: string) {
  return apiFetch<AdminSupportTicketDetail>(`/support-tickets/${id}`);
}

export function assignAdminSupportTicket(id: string, agentId: string | null) {
  return apiFetch(`/support-tickets/${id}/assign`, { method: "PATCH", body: JSON.stringify({ agentId }) });
}

export function updateAdminSupportTicketNotes(id: string, notes: string) {
  return apiFetch(`/support-tickets/${id}/notes`, { method: "PATCH", body: JSON.stringify({ notes }) });
}

export function escalateAdminSupportTicket(id: string) {
  return apiFetch(`/support-tickets/${id}/escalate`, { method: "PATCH" });
}

export function resolveAdminSupportTicket(id: string) {
  return apiFetch(`/support-tickets/${id}/resolve`, { method: "PATCH" });
}

// ---------- Audit log ----------

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actor: { firstName: string; lastName: string };
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export function listAuditLog() {
  return apiFetch<AuditLogEntry[]>("/audit-log");
}

// ---------- Analytics ----------

export interface AdminAnalytics {
  userGrowth: { month: string; landlords: number; caretakers: number; tenants: number }[];
  revenueTrend: { month: string; revenue: number }[];
  occupancyTrend: { month: string; totalUnits: number; occupiedUnits: number; occupancyRate: number }[];
  maintenanceTrend: { month: string; created: number; resolved: number }[];
  supportTrend: { month: string; created: number; resolved: number }[];
  geoDistribution: { county: string; properties: number; units: number }[];
}

export function getAdminAnalytics(months?: number) {
  return apiFetch<AdminAnalytics>(`/admin/analytics${toQueryString({ months })}`);
}

// ---------- Settings ----------

export interface AdminPlatformSettings {
  platformName: string;
  supportEmail: string | null;
  supportPhone: string | null;
  updatedAt: string;
  integrations: { daraja: boolean; sms: boolean; email: boolean; whatsapp: boolean };
}

export function getAdminSettings() {
  return apiFetch<AdminPlatformSettings>("/admin/settings");
}

export function updateAdminSettings(input: { platformName?: string; supportEmail?: string; supportPhone?: string }) {
  return apiFetch<AdminPlatformSettings>("/admin/settings", { method: "PATCH", body: JSON.stringify(input) });
}

// ---------- Role management ----------

export interface AdminStaffMember {
  id: string;
  name: string;
  email: string | null;
  subRole: AdminSubRole | null;
  status: "active" | "suspended";
  joined: string;
}

export function listAdminStaff() {
  return apiFetch<AdminStaffMember[]>("/admin/roles/staff");
}

export function createAdminStaff(input: { firstName: string; lastName: string; email: string; subRole: AdminSubRole }) {
  return apiFetch<AdminStaffMember & { tempPassword: string }>("/admin/roles/staff", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAdminStaffSubRole(id: string, subRole: AdminSubRole) {
  return apiFetch<{ id: string; subRole: AdminSubRole }>(`/admin/roles/staff/${id}/subrole`, {
    method: "PATCH",
    body: JSON.stringify({ subRole }),
  });
}
