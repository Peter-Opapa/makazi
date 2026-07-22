/**
 * Enums shared between apps/api (Prisma schema mirrors these exactly)
 * and apps/web (form options, status badge rendering).
 */

export enum UserRole {
  LANDLORD = "LANDLORD",
  CARETAKER = "CARETAKER",
  TENANT = "TENANT",
  ADMIN = "ADMIN",
}

export enum AdminSubRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  OPS = "OPS",
  SUPPORT = "SUPPORT",
  FINANCE = "FINANCE",
  TECH = "TECH",
  ANALYST = "ANALYST",
}

export enum UnitStatus {
  OCCUPIED = "OCCUPIED",
  VACANT = "VACANT",
  RESERVED = "RESERVED",
  UNDER_MAINTENANCE = "UNDER_MAINTENANCE",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  LATE = "LATE",
  FAILED = "FAILED",
}

export enum PaymentChannel {
  STK_PUSH = "STK_PUSH",
  USSD = "USSD",
  WHATSAPP = "WHATSAPP",
}

export enum MaintenanceStatus {
  REPORTED = "REPORTED",
  ASSIGNED = "ASSIGNED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CLOSED = "CLOSED",
}

export enum MaintenancePriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  URGENT = "URGENT",
}

export enum InspectionType {
  MOVE_IN = "MOVE_IN",
  MOVE_OUT = "MOVE_OUT",
  ROUTINE = "ROUTINE",
}

export enum CaretakerInviteStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
}
