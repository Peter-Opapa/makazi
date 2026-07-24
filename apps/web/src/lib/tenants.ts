import { apiFetch } from "./api";

export interface TenantUnitInfo {
  id: string;
  unitId: string;
  active: boolean;
  unit: { id: string; code: string; property: { id: string; name: string } };
}

export interface TenantListItem {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  tenancies: TenantUnitInfo[];
}

export interface RegisterTenantInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

/** "Register Tenant" — step 1 of 2. Creates the tenant with no unit yet; assign them via a unit's "Assign tenant" action (step 2). */
export function registerTenant(input: RegisterTenantInput) {
  return apiFetch<{ tenant: TenantListItem; tenantCode: string }>("/tenants", {
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
