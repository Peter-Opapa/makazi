import type { MaintenanceCategory } from "@makazi/shared-types";
import { apiFetch } from "./api";

export interface Technician {
  id: string;
  landlordId: string;
  name: string;
  phone: string;
  specialty: MaintenanceCategory | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTechnicianInput {
  name: string;
  phone: string;
  specialty?: MaintenanceCategory;
  /** Required when creating as a caretaker (resolves whose roster this belongs to). */
  propertyId?: string;
}

export function listTechnicians() {
  return apiFetch<Technician[]>("/technicians");
}

export function createTechnician(input: CreateTechnicianInput) {
  return apiFetch<Technician>("/technicians", { method: "POST", body: JSON.stringify(input) });
}

export function updateTechnician(id: string, input: Partial<Pick<Technician, "name" | "phone" | "specialty" | "active">>) {
  return apiFetch<Technician>(`/technicians/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}
