import { TenancyStatus } from "@makazi/shared-types";
import { apiFetch } from "./api";

export interface TenantUnitInfo {
  id: string;
  unitId: string;
  status: TenancyStatus;
  unit: { id: string; code: string; property: { id: string; name: string } };
}

export interface TenantListItem {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  claimed: boolean;
  tenancies: TenantUnitInfo[];
}

export interface RegisterTenantInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

export interface RegisterTenantResult {
  tenant: Pick<TenantListItem, "id" | "firstName" | "lastName" | "phone" | "email" | "claimed">;
  tenantCode: string | null;
  /** True when the email already belonged to a tenant and that profile was reused rather than a new one created. */
  reused: boolean;
}

/** "Register Tenant" — step 1 of 2. Creates the tenant with no unit yet (or reuses an existing tenant profile); assign them via a unit's "Assign tenant" action (step 2). */
export function registerTenant(input: RegisterTenantInput) {
  return apiFetch<RegisterTenantResult>("/tenants", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listTenants(search?: string) {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch<TenantListItem[]>(`/tenants${qs}`);
}

/** Resends the invitation email for a tenant who hasn't claimed their Makazi account yet. */
export function resendTenantInvite(tenantId: string) {
  return apiFetch<{ resent: true }>(`/tenants/${tenantId}/resend-invite`, { method: "POST" });
}

export interface UpdateTenantContactInput {
  email?: string;
  phone?: string;
}

/** Fixes a typo'd email/phone — only works before the tenant claims their tenantCode. */
export function updateTenantContact(tenantId: string, input: UpdateTenantContactInput) {
  return apiFetch<TenantListItem>(`/tenants/${tenantId}`, { method: "PATCH", body: JSON.stringify(input) });
}

/** Deletes a tenant who hasn't claimed their tenantCode yet — frees any unit they were assigned to. */
export function cancelPendingTenant(tenantId: string) {
  return apiFetch<void>(`/tenants/${tenantId}`, { method: "DELETE" });
}

// ---------- Landlord/caretaker: tenants who've asked to leave ----------

export interface ExitRequest {
  tenancyId: string;
  unitId: string;
  unitCode: string;
  property: { id: string; name: string };
  tenant: { id: string; firstName: string; lastName: string; phone: string | null; email: string | null };
  exitRequestedAt: string;
  exitReason: string | null;
}

export function listExitRequests() {
  return apiFetch<ExitRequest[]>("/tenants/exit-requests");
}

// ---------- Tenant's own tenancies (accept a new landlord's invite, request to leave) ----------

export interface MyTenancy {
  id: string;
  status: TenancyStatus;
  rentAmount: string;
  leaseStart: string;
  leaseEnd: string | null;
  exitRequestedAt: string | null;
  unit: { id: string; code: string };
  property: { id: string; name: string };
  landlordName: string;
}

export function listMyTenancies() {
  return apiFetch<MyTenancy[]>("/my/tenancies");
}

export function acceptTenancy(tenancyId: string) {
  return apiFetch<{ status: TenancyStatus }>(`/my/tenancies/${tenancyId}/accept`, { method: "POST" });
}

export function declineTenancy(tenancyId: string) {
  return apiFetch<{ declined: true }>(`/my/tenancies/${tenancyId}/decline`, { method: "POST" });
}

export function requestTenancyExit(tenancyId: string, reason?: string) {
  return apiFetch<{ requested: true }>(`/my/tenancies/${tenancyId}/request-exit`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
