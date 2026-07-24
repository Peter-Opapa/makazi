import { apiFetch } from "./api";

export interface CurrentLease {
  id: string;
  unitId: string;
  tenantId: string;
  leaseStart: string;
  leaseEnd: string | null;
  depositAmount: string | null;
  rentAmount: string;
  active: boolean;
  leaseDocumentUrl: string | null;
  unit: {
    id: string;
    code: string;
    floor: number | null;
    property: { id: string; name: string; location: string; county: string | null };
  };
}

export function getCurrentLease() {
  return apiFetch<CurrentLease>("/lease");
}

export function getLeaseDocument() {
  return apiFetch<{ url: string }>("/lease/document");
}
