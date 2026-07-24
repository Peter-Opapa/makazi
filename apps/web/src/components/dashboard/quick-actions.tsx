"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

const ICON_PROPS = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", strokeWidth: 2 } as const;

export function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      label: "Add Property",
      icon: (
        <svg {...ICON_PROPS} stroke="var(--green)">
          <path d="M12 5v14M5 12h14" />
        </svg>
      ),
      onClick: () => router.push("/landlord/properties"),
    },
    {
      label: "Register Tenant",
      icon: (
        <svg {...ICON_PROPS} stroke="var(--green)">
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 19a6.5 6.5 0 0 1 13 0" />
        </svg>
      ),
      onClick: () => router.push("/landlord/tenants"),
    },
    {
      label: "Record Payment",
      icon: (
        <svg {...ICON_PROPS} stroke="var(--green)">
          <path d="M3 12h4l3-8 4 16 3-8h4" />
        </svg>
      ),
      onClick: () => router.push("/landlord/payments"),
    },
    {
      label: "Send Reminder",
      icon: (
        <svg {...ICON_PROPS} stroke="var(--green)">
          <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
        </svg>
      ),
      onClick: () => toast("Reminders are coming soon."),
    },
  ];

  return (
    <div className="flex gap-[10px] flex-wrap mb-6">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className="flex items-center gap-2 bg-white border border-[var(--line)] rounded-[10px] px-4 py-[11px] text-[13px] font-semibold"
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );
}
