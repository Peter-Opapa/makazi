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
  PAYBILL_DIRECT = "PAYBILL_DIRECT",
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

export enum MaintenanceCategory {
  PLUMBING = "PLUMBING",
  ELECTRICAL = "ELECTRICAL",
  STRUCTURAL = "STRUCTURAL",
  APPLIANCE = "APPLIANCE",
  PEST_CONTROL = "PEST_CONTROL",
  CLEANING = "CLEANING",
  SECURITY = "SECURITY",
  OTHER = "OTHER",
}

export enum MaintenanceActivityType {
  CREATED = "CREATED",
  COMMENT = "COMMENT",
  STATUS_CHANGED = "STATUS_CHANGED",
  TECHNICIAN_ASSIGNED = "TECHNICIAN_ASSIGNED",
}

export enum SupportTicketStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  ESCALATED = "ESCALATED",
  RESOLVED = "RESOLVED",
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

export enum TenancyStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  ENDED = "ENDED",
}

export enum PropertyType {
  APARTMENT_BLOCK = "APARTMENT_BLOCK",
  BUNGALOWS = "BUNGALOWS",
  GATED_COMMUNITY = "GATED_COMMUNITY",
  COMMERCIAL = "COMMERCIAL",
}

export enum NotificationType {
  MAINTENANCE_CREATED = "MAINTENANCE_CREATED",
  MAINTENANCE_STATUS_CHANGED = "MAINTENANCE_STATUS_CHANGED",
  CARETAKER_INVITE = "CARETAKER_INVITE",
  CARETAKER_INVITE_ACCEPTED = "CARETAKER_INVITE_ACCEPTED",
  PAYMENT_SUCCEEDED = "PAYMENT_SUCCEEDED",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  MAINTENANCE_COMMENT = "MAINTENANCE_COMMENT",
  TECHNICIAN_ASSIGNED = "TECHNICIAN_ASSIGNED",
  PAYMENT_ALERT = "PAYMENT_ALERT",
  TENANCY_INVITE = "TENANCY_INVITE",
  TENANCY_ACCEPTED = "TENANCY_ACCEPTED",
  TENANT_EXIT_REQUEST = "TENANT_EXIT_REQUEST",
  GENERAL = "GENERAL",
}

/** Which preference bucket a notification type falls under — see NotificationsService.dispatch. */
export enum NotificationCategory {
  PAYMENTS = "PAYMENTS",
  MAINTENANCE = "MAINTENANCE",
  ACCOUNT = "ACCOUNT",
}

/**
 * Granular Admin Portal capabilities gated per AdminSubRole. SUPER_ADMIN
 * always passes every check (see AdminPermissionGuard) and isn't listed as
 * a matrix column value here — this only enumerates the checkable actions.
 * Mirrors ADMIN_PERMISSION_MATRIX in apps/api's admin module; kept here so
 * the frontend can render the same matrix without duplicating it.
 */
export enum AdminPermission {
  MANAGE_USERS = "MANAGE_USERS",
  MANAGE_PAYMENTS = "MANAGE_PAYMENTS",
  MANAGE_SUPPORT = "MANAGE_SUPPORT",
  MANAGE_MAINTENANCE = "MANAGE_MAINTENANCE",
  MANAGE_SETTINGS = "MANAGE_SETTINGS",
  MANAGE_ROLES = "MANAGE_ROLES",
}

/**
 * Which AdminSubRole values may perform each AdminPermission — enforced
 * server-side by AdminPermissionGuard on every mutating Admin Portal route,
 * not just used to hide buttons (see design prototype's cosmetic-only role
 * switcher, 10-implementation-notes.md). SUPER_ADMIN is omitted from each
 * list because it always passes; ANALYST is intentionally never included
 * anywhere — "Read-only Analyst" per the design prototype.
 */
export const ADMIN_PERMISSION_MATRIX: Record<AdminPermission, AdminSubRole[]> = {
  [AdminPermission.MANAGE_USERS]: [AdminSubRole.OPS],
  [AdminPermission.MANAGE_PAYMENTS]: [AdminSubRole.OPS, AdminSubRole.FINANCE],
  [AdminPermission.MANAGE_SUPPORT]: [AdminSubRole.OPS, AdminSubRole.SUPPORT],
  [AdminPermission.MANAGE_MAINTENANCE]: [AdminSubRole.OPS, AdminSubRole.TECH],
  [AdminPermission.MANAGE_SETTINGS]: [],
  [AdminPermission.MANAGE_ROLES]: [],
};

export const NOTIFICATION_TYPE_CATEGORY: Record<NotificationType, NotificationCategory> = {
  [NotificationType.MAINTENANCE_CREATED]: NotificationCategory.MAINTENANCE,
  [NotificationType.MAINTENANCE_STATUS_CHANGED]: NotificationCategory.MAINTENANCE,
  [NotificationType.MAINTENANCE_COMMENT]: NotificationCategory.MAINTENANCE,
  [NotificationType.TECHNICIAN_ASSIGNED]: NotificationCategory.MAINTENANCE,
  [NotificationType.CARETAKER_INVITE]: NotificationCategory.ACCOUNT,
  [NotificationType.CARETAKER_INVITE_ACCEPTED]: NotificationCategory.ACCOUNT,
  [NotificationType.PAYMENT_SUCCEEDED]: NotificationCategory.PAYMENTS,
  [NotificationType.PAYMENT_FAILED]: NotificationCategory.PAYMENTS,
  [NotificationType.PAYMENT_ALERT]: NotificationCategory.PAYMENTS,
  [NotificationType.TENANCY_INVITE]: NotificationCategory.ACCOUNT,
  [NotificationType.TENANCY_ACCEPTED]: NotificationCategory.ACCOUNT,
  [NotificationType.TENANT_EXIT_REQUEST]: NotificationCategory.ACCOUNT,
  [NotificationType.GENERAL]: NotificationCategory.ACCOUNT,
};
