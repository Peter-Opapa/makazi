"use client";

import * as React from "react";
import Link from "next/link";
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/lib/notifications";
import { timeAgo } from "@/lib/utils";

const POLL_MS = 25_000;

export function LiveNotificationBell({ viewAllHref }: { viewAllHref: string }) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [unread, setUnread] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);

  const refetch = React.useCallback(async () => {
    const [list, count] = await Promise.all([listNotifications(), getUnreadCount()]);
    setItems(list);
    setUnread(count);
  }, []);

  React.useEffect(() => {
    refetch();
    const timer = setInterval(refetch, POLL_MS);
    return () => clearInterval(timer);
  }, [refetch]);

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleItemClick(item: NotificationItem) {
    if (!item.readAt) {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)));
      setUnread((u) => Math.max(0, u - 1));
      await markNotificationRead(item.id);
    }
  }

  async function handleMarkAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setUnread(0);
    await markAllNotificationsRead();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative bg-transparent border-none p-2 flex"
        aria-label="Notifications"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth={1.8}>
          <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
          <path d="M9.5 20a2.5 2.5 0 0 0 5 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--clay)] text-white text-[10px] font-semibold leading-4 text-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          className="absolute top-11 right-0 bg-white border border-[var(--line)] rounded-[10px] w-[300px] max-h-[380px] flex flex-col z-30"
          style={{ boxShadow: "0 24px 60px -30px rgba(0,0,0,.3)" }}
        >
          <div className="flex items-center justify-between px-[14px] py-3 border-b border-[var(--line)] shrink-0">
            <span className="text-xs font-semibold text-[var(--stone)]">NOTIFICATIONS</span>
            {unread > 0 && (
              <button onClick={handleMarkAllRead} className="text-[11px] font-semibold text-[var(--green-deep)]">
                Mark all read
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {items.length === 0 ? (
              <p className="m-0 px-[14px] py-5 text-[13px] text-[var(--stone)] text-center">No notifications yet.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="w-full text-left px-[14px] py-[11px] border-b border-[var(--line)] text-[12.5px] last:border-b-0 flex gap-2 items-start"
                  style={{ background: item.readAt ? "transparent" : "var(--green-soft)" }}
                >
                  {!item.readAt && <span className="w-[6px] h-[6px] rounded-full bg-[var(--green-deep)] mt-[5px] shrink-0" />}
                  <span className="flex-1">
                    <span className={item.readAt ? "" : "font-semibold"}>{item.title}</span>
                    <div className="font-mono text-[10px] text-[var(--stone)] mt-0.5">{timeAgo(item.createdAt)}</div>
                  </span>
                </button>
              ))
            )}
          </div>
          <Link
            href={viewAllHref}
            onClick={() => setOpen(false)}
            className="block text-center py-[10px] text-[12px] font-semibold text-[var(--ink)] border-t border-[var(--line)] shrink-0"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}
