import type { MaintenanceActivityType, MaintenanceCategory, MaintenancePriority, MaintenanceStatus } from "@makazi/shared-types";
import { apiFetch } from "./api";
import type { Technician } from "./technicians";

export interface MaintenanceTicket {
  id: string;
  ticketNumber: string;
  unitId: string;
  reportedById: string;
  issue: string;
  category: MaintenanceCategory | null;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  technicianId: string | null;
  technician: Technician | null;
  resolutionNotes: string | null;
  resolvedAt: string | null;
  photoUrls: string[];
  createdAt: string;
  updatedAt: string;
  unit: { id: string; code: string; propertyId: string; property: { id: string; name: string } };
  reportedBy: { id: string; firstName: string; lastName: string };
}

export interface MaintenanceActivityItem {
  id: string;
  ticketId: string;
  actorId: string;
  type: MaintenanceActivityType;
  body: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: { id: string; firstName: string; lastName: string; role: string };
}

export interface CreateMaintenanceTicketInput {
  unitId: string;
  issue: string;
  category?: MaintenanceCategory;
  priority?: MaintenancePriority;
  photoUrls?: string[];
}

export interface UpdateMaintenanceStatusInput {
  status: MaintenanceStatus;
  resolutionNotes?: string;
}

function toQueryString(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  const str = qs.toString();
  return str ? `?${str}` : "";
}

export function listMaintenanceTickets(params?: {
  propertyId?: string;
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  category?: MaintenanceCategory;
}) {
  return apiFetch<MaintenanceTicket[]>(`/maintenance${toQueryString(params ?? {})}`);
}

export function getMaintenanceTicket(id: string) {
  return apiFetch<MaintenanceTicket>(`/maintenance/${id}`);
}

export function createMaintenanceTicket(input: CreateMaintenanceTicketInput) {
  return apiFetch<MaintenanceTicket>("/maintenance", { method: "POST", body: JSON.stringify(input) });
}

export function presignMaintenancePhoto(unitId: string, contentType: string) {
  return apiFetch<{ uploadUrl: string; key: string; publicUrl: string }>("/maintenance/presign", {
    method: "POST",
    body: JSON.stringify({ unitId, contentType }),
  });
}

export function updateMaintenanceStatus(id: string, input: UpdateMaintenanceStatusInput) {
  return apiFetch<MaintenanceTicket>(`/maintenance/${id}/status`, { method: "PATCH", body: JSON.stringify(input) });
}

export function assignTechnician(ticketId: string, technicianId: string) {
  return apiFetch<MaintenanceTicket>(`/maintenance/${ticketId}/technician`, {
    method: "POST",
    body: JSON.stringify({ technicianId }),
  });
}

export function addMaintenanceComment(ticketId: string, body: string) {
  return apiFetch<MaintenanceActivityItem>(`/maintenance/${ticketId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export function listMaintenanceActivities(ticketId: string) {
  return apiFetch<MaintenanceActivityItem[]>(`/maintenance/${ticketId}/activities`);
}
