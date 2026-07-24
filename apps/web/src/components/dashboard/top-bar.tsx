"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LiveNotificationBell } from "@/components/dashboard/live-notification-bell";
import type { AuthUser } from "@/lib/auth";

export function TopBar({
  onToggleSidebarCollapsed,
  onOpenMobileMenu,
  notificationsHref,
  settingsHref,
  user,
}: {
  onToggleSidebarCollapsed: () => void;
  onOpenMobileMenu: () => void;
  /** Where the bell's "View all" link goes. */
  notificationsHref: string;
  settingsHref: string;
  user: AuthUser;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  React.useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  return (
    <div className="h-16 border-b border-[var(--line)] flex items-center gap-4 px-5 md:px-7 bg-white sticky top-0 z-20">
      <button
        onClick={onOpenMobileMenu}
        className="md:hidden border border-[var(--line)] rounded-lg p-2 flex text-[var(--stone)]"
        aria-label="Open menu"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <button
        onClick={onToggleSidebarCollapsed}
        className="hidden md:flex border border-[var(--line)] rounded-lg p-2 text-[var(--stone)]"
        aria-label="Toggle sidebar"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M9 4v16" />
        </svg>
      </button>
      <div className="flex-1" />
      <LiveNotificationBell viewAllHref={notificationsHref} />

      <div ref={menuRef} className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-[9px] pl-2 py-1 pr-1 rounded-full hover:bg-[var(--paper)]"
        >
          <span className="text-[13px] font-semibold text-[var(--ink)] hidden sm:inline">{user.firstName}</span>
          <span
            className="w-8 h-8 rounded-full bg-[var(--green-soft)] flex items-center justify-center text-[12px] font-semibold text-[var(--green-deep)] shrink-0 overflow-hidden bg-cover bg-center"
            style={user.profilePhotoUrl ? { backgroundImage: `url(${user.profilePhotoUrl})` } : undefined}
          >
            {!user.profilePhotoUrl && initials}
          </span>
        </button>

        {menuOpen && (
          <div
            className="absolute top-[calc(100%+8px)] right-0 bg-white border border-[var(--line)] rounded-[10px] overflow-hidden w-[190px] z-30"
            style={{ boxShadow: "0 24px 60px -30px rgba(0,0,0,.4)" }}
          >
            <div className="px-[14px] py-[11px] border-b border-[var(--line)]">
              <div className="text-[13px] font-semibold truncate">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-xs text-[var(--stone)] truncate">{user.email ?? user.phone ?? ""}</div>
            </div>
            <button
              onClick={() => {
                setMenuOpen(false);
                router.push(settingsHref);
              }}
              className="w-full text-left px-[14px] py-[11px] text-[13px] text-[var(--ink)]"
            >
              Profile &amp; settings
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                router.push("/logout");
              }}
              className="w-full text-left px-[14px] py-[11px] text-[13px] text-[var(--error)] border-t border-[var(--line)]"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
