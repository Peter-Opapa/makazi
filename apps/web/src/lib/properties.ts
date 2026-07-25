import { PropertyType, TenancyStatus, UnitStatus } from "@makazi/shared-types";
import { apiFetch } from "./api";

export interface PropertyPhoto {
  id: string;
  propertyId: string;
  url: string;
  order: number;
  createdAt: string;
}

export interface Unit {
  id: string;
  propertyId: string;
  code: string;
  floor: number | null;
  status: UnitStatus;
  rentAmount: string | null;
  createdAt: string;
  updatedAt: string;
  tenancies: Tenancy[];
}

export interface PaymentAccount {
  id: string;
  propertyId: string;
  method: "paybill" | "till" | "bank";
  payBillNumber: string | null;
  tillNumber: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
}

export interface PropertyOccupancy {
  total: number;
  occupied: number;
  vacant: number;
  reserved: number;
  underMaintenance: number;
}

export interface Property {
  id: string;
  landlordId: string;
  name: string;
  location: string;
  county: string | null;
  estateArea: string | null;
  physicalAddress: string | null;
  propertyType: PropertyType;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyListItem extends Property {
  occupancy: PropertyOccupancy;
  _count: { photos: number };
}

export interface PropertyDetail extends Property {
  units: Unit[];
  photos: PropertyPhoto[];
  paymentAccount: PaymentAccount | null;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PropertyInput {
  name: string;
  location: string;
  county?: string;
  estateArea?: string;
  physicalAddress?: string;
  propertyType: PropertyType;
}

export const KENYAN_COUNTIES = ["Nairobi", "Mombasa", "Kiambu", "Nakuru", "Kisumu", "Uasin Gishu"] as const;

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  [PropertyType.APARTMENT_BLOCK]: "Apartment Block",
  [PropertyType.BUNGALOWS]: "Bungalows",
  [PropertyType.GATED_COMMUNITY]: "Gated Community",
  [PropertyType.COMMERCIAL]: "Commercial",
};

function toQueryString(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  const str = qs.toString();
  return str ? `?${str}` : "";
}

// ---------- Properties ----------

export function listProperties(params: {
  search?: string;
  county?: string;
  propertyType?: PropertyType;
  page?: number;
  pageSize?: number;
}) {
  return apiFetch<PaginatedResult<PropertyListItem>>(`/properties${toQueryString(params)}`);
}

export function getProperty(id: string) {
  return apiFetch<PropertyDetail>(`/properties/${id}`);
}

export function createProperty(input: PropertyInput) {
  return apiFetch<Property>("/properties", { method: "POST", body: JSON.stringify(input) });
}

export function updateProperty(id: string, input: Partial<PropertyInput>) {
  return apiFetch<Property>(`/properties/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteProperty(id: string) {
  return apiFetch<{ message: string }>(`/properties/${id}`, { method: "DELETE" });
}

// ---------- Gallery ----------

export function presignPropertyPhoto(propertyId: string, contentType: string) {
  return apiFetch<{ uploadUrl: string; key: string; publicUrl: string }>(`/properties/${propertyId}/photos/presign`, {
    method: "POST",
    body: JSON.stringify({ contentType }),
  });
}

export function confirmPropertyPhoto(propertyId: string, key: string) {
  return apiFetch<PropertyPhoto>(`/properties/${propertyId}/photos`, {
    method: "POST",
    body: JSON.stringify({ key }),
  });
}

export function deletePropertyPhoto(propertyId: string, photoId: string) {
  return apiFetch<{ message: string }>(`/properties/${propertyId}/photos/${photoId}`, { method: "DELETE" });
}

export async function uploadFileDirect(uploadUrl: string, file: File) {
  const res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!res.ok) throw new Error("Upload failed");
}

// ---------- Property settings (payment destination) ----------

export function upsertPaymentAccount(propertyId: string, input: Omit<PaymentAccount, "id" | "propertyId">) {
  return apiFetch<PaymentAccount>(`/properties/${propertyId}/payment-account`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

// ---------- Units ----------

export interface UnitInput {
  code: string;
  floor?: number;
  rentAmount?: number;
  status?: UnitStatus;
}

export function listUnits(propertyId: string, params?: { status?: UnitStatus; floor?: number }) {
  return apiFetch<Unit[]>(`/properties/${propertyId}/units${toQueryString(params ?? {})}`);
}

export function createUnit(propertyId: string, input: UnitInput) {
  return apiFetch<Unit>(`/properties/${propertyId}/units`, { method: "POST", body: JSON.stringify(input) });
}

export function bulkGenerateUnitsAuto(
  propertyId: string,
  input: { totalUnits: number; floors: number; defaultRentAmount?: number },
) {
  return apiFetch<Unit[]>(`/properties/${propertyId}/units/bulk-auto`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function bulkGenerateUnitsManual(propertyId: string, units: UnitInput[]) {
  return apiFetch<Unit[]>(`/properties/${propertyId}/units/bulk-manual`, {
    method: "POST",
    body: JSON.stringify({ units }),
  });
}

export function updateUnit(unitId: string, input: Partial<UnitInput>) {
  return apiFetch<Unit>(`/units/${unitId}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteUnit(unitId: string) {
  return apiFetch<{ message: string }>(`/units/${unitId}`, { method: "DELETE" });
}

// ---------- Assign Tenant ----------

export interface Tenancy {
  id: string;
  unitId: string;
  tenantId: string;
  leaseStart: string;
  leaseEnd: string | null;
  depositAmount: string | null;
  rentAmount: string;
  status: TenancyStatus;
  tenant: { id: string; firstName: string; lastName: string; phone: string | null; email: string | null };
}

export interface AssignTenantInput {
  existingTenantId: string;
  leaseStart: string;
  leaseEnd?: string;
  rentAmount: number;
  depositAmount?: number;
}

export function assignTenant(unitId: string, input: AssignTenantInput) {
  return apiFetch<{ tenancy: Tenancy; tenantCode: string | null }>(`/units/${unitId}/assign-tenant`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ---------- Move-Out Wizard ----------

export type MoveOutStep = "confirm" | "inspect" | "damage_assessment" | "deposit_reconciliation" | "report" | "vacant";

export interface MoveOut {
  id: string;
  tenancyId: string;
  step: MoveOutStep;
  damageNotes: string | null;
  depositDeductions: string | null;
  reportUrl: string | null;
  completedAt: string | null;
}

export function startMoveOut(unitId: string) {
  return apiFetch<MoveOut>(`/units/${unitId}/move-out/start`, { method: "POST" });
}

export function getMoveOut(unitId: string) {
  return apiFetch<MoveOut>(`/units/${unitId}/move-out`);
}

export function confirmMoveOut(unitId: string) {
  return apiFetch<MoveOut>(`/units/${unitId}/move-out/confirm`, { method: "POST" });
}

export function presignInspectionPhoto(unitId: string, contentType: string) {
  return apiFetch<{ uploadUrl: string; key: string; publicUrl: string }>(`/units/${unitId}/move-out/inspect/presign`, {
    method: "POST",
    body: JSON.stringify({ contentType }),
  });
}

export function moveOutInspect(unitId: string, input: { checklist?: Record<string, "ok" | "damaged">; photoUrls?: string[] }) {
  return apiFetch<MoveOut>(`/units/${unitId}/move-out/inspect`, { method: "PATCH", body: JSON.stringify(input) });
}

export function moveOutDamageAssessment(unitId: string, damageNotes: string) {
  return apiFetch<MoveOut>(`/units/${unitId}/move-out/damage-assessment`, {
    method: "PATCH",
    body: JSON.stringify({ damageNotes }),
  });
}

export function moveOutDepositReconciliation(unitId: string, depositDeductions: number) {
  return apiFetch<MoveOut>(`/units/${unitId}/move-out/deposit-reconciliation`, {
    method: "PATCH",
    body: JSON.stringify({ depositDeductions }),
  });
}

export function moveOutGenerateReport(unitId: string) {
  return apiFetch<MoveOut>(`/units/${unitId}/move-out/generate-report`, { method: "POST" });
}

export function completeMoveOut(unitId: string) {
  return apiFetch<MoveOut>(`/units/${unitId}/move-out/complete`, { method: "POST" });
}
