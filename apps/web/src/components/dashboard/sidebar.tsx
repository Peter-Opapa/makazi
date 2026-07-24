"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { AuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const ICON_PROPS = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 } as const;

export const LANDLORD_NAV_ITEMS: SidebarNavItem[] = [
  {
    href: "/landlord",
    label: "Overview",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: "/landlord/properties",
    label: "Properties",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="9" width="7" height="12" />
        <rect x="14" y="4" width="7" height="17" />
      </svg>
    ),
  },
  {
    href: "/landlord/tenants",
    label: "Tenants",
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 19a6.5 6.5 0 0 1 13 0" />
      </svg>
    ),
  },
  {
    href: "/landlord/payments",
    label: "Payments",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M3 12h4l3-8 4 16 3-8h4" />
      </svg>
    ),
  },
  {
    href: "/landlord/maintenance",
    label: "Maintenance",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M14 3v5h5" />
        <path d="M6 3h8l5 5v13H6z" />
      </svg>
    ),
  },
  {
    href: "/landlord/caretakers",
    label: "Caretakers",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M14.7 3.3a4 4 0 0 0-5.4 5.4L3 15l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6z" />
      </svg>
    ),
  },
  {
    href: "/landlord/reports",
    label: "Reports",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M14 3v5h5" />
        <path d="M6 3h8l5 5v13H6z" />
        <path d="M9 13h6M9 17h6" />
      </svg>
    ),
  },
  {
    href: "/landlord/notifications",
    label: "Notifications",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
        <path d="M9.5 20a2.5 2.5 0 0 0 5 0" />
      </svg>
    ),
  },
];

export const CARETAKER_NAV_ITEMS: SidebarNavItem[] = [
  {
    href: "/caretaker",
    label: "Overview",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: "/caretaker/properties",
    label: "Properties",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="9" width="7" height="12" />
        <rect x="14" y="4" width="7" height="17" />
      </svg>
    ),
  },
  {
    href: "/caretaker/tenants",
    label: "Tenants",
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 19a6.5 6.5 0 0 1 13 0" />
      </svg>
    ),
  },
  {
    href: "/caretaker/maintenance",
    label: "Maintenance",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M14 3v5h5" />
        <path d="M6 3h8l5 5v13H6z" />
      </svg>
    ),
  },
  {
    href: "/caretaker/inspections",
    label: "Inspections",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    href: "/caretaker/notifications",
    label: "Notifications",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
        <path d="M9.5 20a2.5 2.5 0 0 0 5 0" />
      </svg>
    ),
  },
];

export const TENANT_NAV_ITEMS: SidebarNavItem[] = [
  {
    href: "/tenant",
    label: "Overview",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: "/tenant/pay-rent",
    label: "Pay Rent",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="2" y="6" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <path d="M6 15h4" />
      </svg>
    ),
  },
  {
    href: "/tenant/receipts",
    label: "Receipts",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M6 2h12v19l-3-2-3 2-3-2-3 2Z" />
        <path d="M9 8h6M9 12h6" />
      </svg>
    ),
  },
  {
    href: "/tenant/lease",
    label: "Lease",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M14 3v5h5" />
        <path d="M6 3h8l5 5v13H6z" />
        <path d="M9 13h6M9 17h6" />
      </svg>
    ),
  },
  {
    href: "/tenant/maintenance",
    label: "Maintenance",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M14.7 3.3a4 4 0 0 0-5.4 5.4L3 15l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6z" />
      </svg>
    ),
  },
  {
    href: "/tenant/rental-passport",
    label: "Rental Passport",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: "/tenant/notifications",
    label: "Notifications",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
        <path d="M9.5 20a2.5 2.5 0 0 0 5 0" />
      </svg>
    ),
  },
];

export const ADMIN_NAV_ITEMS: SidebarNavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 19a6.5 6.5 0 0 1 13 0" />
      </svg>
    ),
  },
  {
    href: "/admin/properties",
    label: "Properties",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="9" width="7" height="12" />
        <rect x="14" y="4" width="7" height="17" />
      </svg>
    ),
  },
  {
    href: "/admin/payments",
    label: "Payments",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M3 12h4l3-8 4 16 3-8h4" />
      </svg>
    ),
  },
  {
    href: "/admin/maintenance",
    label: "Maintenance",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M14 3v5h5" />
        <path d="M6 3h8l5 5v13H6z" />
      </svg>
    ),
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M3 3v18h18" />
        <path d="M7 15l4-4 3 3 5-6" />
      </svg>
    ),
  },
  {
    href: "/admin/support",
    label: "Support",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M21 11.5a8.5 8.5 0 0 1-11.8 7.8L3 21l1.7-6.2A8.5 8.5 0 1 1 21 11.5z" />
      </svg>
    ),
  },
  {
    href: "/admin/roles",
    label: "Role Management",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M14.7 3.3a4 4 0 0 0-5.4 5.4L3 15l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6z" />
      </svg>
    ),
  },
  {
    href: "/admin/audit-log",
    label: "Audit Log",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
];

const SETTINGS_ICON = (
  <svg {...ICON_PROPS}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);

export function Sidebar({
  navItems,
  settingsHref,
  roleLabel,
  user,
  collapsed = false,
  onToggleCollapsed,
  onNavigate,
}: {
  navItems: SidebarNavItem[];
  settingsHref: string;
  roleLabel: string;
  user: AuthUser;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  function isActive(href: string) {
    const isRoleRoot = href.split("/").filter(Boolean).length === 1;
    if (isRoleRoot) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <div
      className="flex flex-col gap-1 shrink-0 sticky top-0 h-screen overflow-hidden transition-[width] duration-150"
      style={{
        width: collapsed ? 68 : 230,
        background: "var(--ink)",
        color: "#fff",
        padding: collapsed ? "20px 10px" : "20px 14px",
      }}
    >
      <div className="flex items-center justify-between gap-[9px] pb-6 px-1">
        <div className="flex items-center gap-[9px] overflow-hidden">
          <img src="/makazi-mark-light.png" alt="Makazi" className="h-[22px] shrink-0" />
          {!collapsed && <span className="whitespace-nowrap font-display font-extrabold tracking-[0.12em] text-[15px]">MAKAZI</span>}
        </div>
        {onToggleCollapsed && (
          <button onClick={onToggleCollapsed} className="shrink-0 flex text-[#9AA39D] p-1" aria-label="Toggle sidebar">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              style={{ transition: "transform .15s", transform: collapsed ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
            </svg>
          </button>
        )}
      </div>

      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="flex items-center gap-[10px] w-full rounded-[9px] px-[10px] py-[10px] text-[13px]"
            style={{
              background: active ? "rgba(227,237,231,.12)" : "none",
              color: active ? "#fff" : "#9AA39D",
              fontWeight: active ? 600 : 500,
            }}
          >
            {item.icon}
            {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
          </Link>
        );
      })}

      <div className="flex-1" />

      <Link
        href={settingsHref}
        onClick={onNavigate}
        className="flex items-center gap-[10px] w-full rounded-[9px] px-[10px] py-[10px] text-[13px]"
        style={{
          background: isActive(settingsHref) ? "rgba(227,237,231,.12)" : "none",
          color: isActive(settingsHref) ? "#fff" : "#9AA39D",
          fontWeight: isActive(settingsHref) ? 600 : 500,
        }}
      >
        {SETTINGS_ICON}
        {!collapsed && <span className="whitespace-nowrap">Settings</span>}
      </Link>

      <div
        onClick={() => setProfileMenuOpen((o) => !o)}
        className="flex items-center gap-[9px] px-2 py-[10px] mt-2 cursor-pointer relative"
        style={{ borderTop: "1px solid rgba(255,255,255,.1)" }}
      >
        <div
          className="w-7 h-7 rounded-full bg-[var(--green)] flex items-center justify-center text-[11px] font-semibold shrink-0 overflow-hidden bg-cover bg-center"
          style={user.profilePhotoUrl ? { backgroundImage: `url(${user.profilePhotoUrl})` } : undefined}
        >
          {!user.profilePhotoUrl && initials}
        </div>
        {!collapsed && (
          <div className="leading-tight flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{user.firstName}</div>
            <div className="text-[10px] text-[#9AA39D]">{roleLabel}</div>
          </div>
        )}
        {profileMenuOpen && (
          <div
            className="absolute bottom-12 left-2 right-2 bg-white border border-[var(--line)] rounded-[10px] overflow-hidden w-[200px]"
            style={{ boxShadow: "0 24px 60px -30px rgba(0,0,0,.4)" }}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                onNavigate?.();
                router.push(settingsHref);
              }}
              className="px-[14px] py-[11px] text-[13px] text-[var(--ink)]"
            >
              Profile &amp; settings
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                onNavigate?.();
                router.push("/logout");
              }}
              className="px-[14px] py-[11px] text-[13px] text-[var(--error)] border-t border-[var(--line)]"
            >
              Log out
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
