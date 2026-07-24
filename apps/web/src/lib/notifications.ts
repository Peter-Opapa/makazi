import type { NotificationType } from "@makazi/shared-types";
import { apiFetch } from "./api";

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export function listNotifications(unreadOnly?: boolean) {
  return apiFetch<NotificationItem[]>(`/notifications${unreadOnly ? "?unreadOnly=true" : ""}`);
}

export function getUnreadCount() {
  return apiFetch<number>("/notifications/unread-count");
}

export function markNotificationRead(id: string) {
  return apiFetch<NotificationItem>(`/notifications/${id}/read`, { method: "POST" });
}

export function markAllNotificationsRead() {
  return apiFetch<{ message: string }>("/notifications/read-all", { method: "POST" });
}

// ---------- Notification preferences ----------

export interface NotificationPreferences {
  id: string;
  userId: string;
  paymentsSms: boolean;
  paymentsEmail: boolean;
  paymentsWhatsapp: boolean;
  maintenanceSms: boolean;
  maintenanceEmail: boolean;
  maintenanceWhatsapp: boolean;
  accountSms: boolean;
  accountEmail: boolean;
  accountWhatsapp: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UpdateNotificationPreferencesInput = Partial<
  Omit<NotificationPreferences, "id" | "userId" | "createdAt" | "updatedAt">
>;

export function getNotificationPreferences() {
  return apiFetch<NotificationPreferences>("/notifications/preferences");
}

export function updateNotificationPreferences(input: UpdateNotificationPreferencesInput) {
  return apiFetch<NotificationPreferences>("/notifications/preferences", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
