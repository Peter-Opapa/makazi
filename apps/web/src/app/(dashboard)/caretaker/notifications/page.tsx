"use client";

import * as React from "react";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/lib/notifications";
import { timeAgo } from "@/lib/utils";
import { FormButton } from "@/components/shared/form-button";

export default function CaretakerNotificationsPage() {
  const [notifications, setNotifications] = React.useState<NotificationItem[] | null>(null);
  const [unreadOnly, setUnreadOnly] = React.useState(false);

  const refetch = React.useCallback(async () => {
    const res = await listNotifications(unreadOnly);
    setNotifications(res);
  }, [unreadOnly]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  const unreadCount = notifications?.filter((n) => !n.readAt).length ?? 0;

  async function handleItemClick(item: NotificationItem) {
    if (item.readAt) return;
    setNotifications((prev) => prev?.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)) ?? null);
    await markNotificationRead(item.id);
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev?.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })) ?? null);
    await markAllNotificationsRead();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <h1 className="font-display font-bold text-2xl tracking-[-0.02em]">Notifications</h1>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setUnreadOnly((u) => !u)}
            className="rounded-full px-3 py-[6px] text-xs font-semibold border-[1.5px] border-[var(--line-2)]"
            style={unreadOnly ? { background: "var(--ink)", color: "#fff", borderColor: "var(--ink)" } : undefined}
          >
            Unread only
          </button>
          {unreadCount > 0 && (
            <FormButton variant="outline" fullWidth={false} onClick={handleMarkAllRead} className="px-3 py-2 text-xs">
              Mark all read
            </FormButton>
          )}
        </div>
      </div>

      {notifications && notifications.length === 0 && (
        <div className="border-[1.5px] border-dashed border-[var(--line-2)] rounded-2xl py-16 px-5 text-center">
          <p className="text-sm text-[var(--stone)]">
            {unreadOnly ? "No unread notifications." : "No notifications yet."}
          </p>
        </div>
      )}

      {notifications && notifications.length > 0 && (
        <div className="border border-[var(--line)] rounded-[14px] overflow-hidden bg-white">
          {notifications.map((n, i) => (
            <button
              key={n.id}
              onClick={() => handleItemClick(n)}
              className="w-full text-left flex items-start gap-3 px-4 py-[13px]"
              style={{
                borderTop: i > 0 ? "1px solid var(--line)" : undefined,
                background: n.readAt ? "transparent" : "var(--green-soft)",
              }}
            >
              {!n.readAt && <span className="w-[7px] h-[7px] rounded-full bg-[var(--green-deep)] mt-[6px] shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className={n.readAt ? "text-[13px]" : "text-[13px] font-semibold"}>{n.title}</div>
                {n.body && <div className="text-xs text-[var(--stone)] mt-0.5">{n.body}</div>}
                <div className="font-mono text-[10px] text-[var(--stone)] mt-1">{timeAgo(n.createdAt)}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
