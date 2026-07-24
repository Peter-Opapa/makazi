import { MaintenanceCategory, MaintenancePriority, MaintenanceStatus, PaymentStatus, UnitStatus } from "@makazi/shared-types";

export function formatKES(amount: number | string): string {
  return `KES ${Number(amount).toLocaleString("en-KE")}`;
}

/** Time-of-day Swahili greeting for dashboard headers — fits the Kenyan context better than a generic English "Good morning." */
export function getGreeting(firstName: string): string {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "asubuhi" : hour < 17 ? "mchana" : "jioni";
  return `Habari za ${timeOfDay}, ${firstName}`;
}

export function paymentStatusTone(status: PaymentStatus): "success" | "warning" | "error" {
  switch (status) {
    case PaymentStatus.PAID:
      return "success";
    case PaymentStatus.LATE:
    case PaymentStatus.FAILED:
      return "error";
    case PaymentStatus.PENDING:
      return "warning";
  }
}

export function maintenanceStatusTone(status: MaintenanceStatus): "success" | "warning" | "error" | "neutral" {
  switch (status) {
    case MaintenanceStatus.COMPLETED:
    case MaintenanceStatus.CLOSED:
      return "success";
    case MaintenanceStatus.IN_PROGRESS:
    case MaintenanceStatus.ASSIGNED:
      return "warning";
    case MaintenanceStatus.REPORTED:
      return "error";
    default:
      return "neutral";
  }
}

export function maintenanceStatusLabel(status: MaintenanceStatus): string {
  return status.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function maintenanceCategoryLabel(category: MaintenanceCategory): string {
  return category.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function maintenancePriorityTone(priority: MaintenancePriority): "success" | "warning" | "error" | "neutral" {
  switch (priority) {
    case MaintenancePriority.URGENT:
      return "error";
    case MaintenancePriority.NORMAL:
      return "warning";
    case MaintenancePriority.LOW:
      return "neutral";
  }
}

export function unitStatusLabel(status: UnitStatus): string {
  return status.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function unitStatusColor(status: UnitStatus): string {
  switch (status) {
    case UnitStatus.OCCUPIED:
      return "var(--success)";
    case UnitStatus.VACANT:
      return "var(--line-2)";
    case UnitStatus.RESERVED:
      return "var(--warning)";
    case UnitStatus.UNDER_MAINTENANCE:
      return "var(--error)";
  }
}
