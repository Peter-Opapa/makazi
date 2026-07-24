import type { InspectionType } from "@makazi/shared-types";
import { apiFetch } from "./api";

export interface Inspection {
  id: string;
  unitId: string;
  type: InspectionType;
  checklist: Record<string, "ok" | "damaged">;
  photoUrls: string[];
  submittedAt: string;
  unit: { id: string; code: string; propertyId: string; property: { id: string; name: string } };
}

export interface CreateInspectionInput {
  unitId: string;
  type: InspectionType;
  checklist?: Record<string, "ok" | "damaged">;
  photoUrls?: string[];
}

function toQueryString(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  const str = qs.toString();
  return str ? `?${str}` : "";
}

export function presignInspectionPhoto(unitId: string, contentType: string) {
  return apiFetch<{ uploadUrl: string; key: string; publicUrl: string }>("/inspections/presign", {
    method: "POST",
    body: JSON.stringify({ unitId, contentType }),
  });
}

export function createInspection(input: CreateInspectionInput) {
  return apiFetch<Inspection>("/inspections", { method: "POST", body: JSON.stringify(input) });
}

export function listInspections(params?: { propertyId?: string; unitId?: string; type?: InspectionType }) {
  return apiFetch<Inspection[]>(`/inspections${toQueryString(params ?? {})}`);
}
