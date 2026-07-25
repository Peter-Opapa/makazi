"use client";

import * as React from "react";
import Link from "next/link";
import { MaintenanceStatus, MaintenancePriority } from "@makazi/shared-types";
import { listMaintenanceTickets } from "@/lib/maintenance";
import { listExitRequests } from "@/lib/tenants";
import { formatKES } from "@/lib/format";

const OPEN_STATUSES = new Set<MaintenanceStatus>([
  MaintenanceStatus.REPORTED,
  MaintenanceStatus.ASSIGNED,
  MaintenanceStatus.IN_PROGRESS,
]);

interface AttentionItem {
  key: string;
  label: string;
  value: string;
  href: string;
  tone: "critical" | "warning";
}

/**
 * The first thing a landlord should see: what needs them today. Composed from
 * data the dashboard already has (outstanding rent, vacant units) plus a light
 * fetch for open maintenance and pending move-out requests. Only actionable
 * items render — a landlord with nothing outstanding sees a calm all-clear,
 * never a wall of zeros.
 */
export function LandlordAttention({ outstandingRentKES, vacantUnits }: { outstandingRentKES: number; vacantUnits: number }) {
  const [openTickets, setOpenTickets] = React.useState<number | null>(null);
  const [urgentTickets, setUrgentTickets] = React.useState(0);
  const [exitRequests, setExitRequests] = React.useState<number | null>(null);

  React.useEffect(() => {
    listMaintenanceTickets()
      .then((tickets) => {
        const open = tickets.filter((t) => OPEN_STATUSES.has(t.status));
        setOpenTickets(open.length);
        setUrgentTickets(open.filter((t) => t.priority === MaintenancePriority.URGENT).length);
      })
      .catch(() => setOpenTickets(0));
    listExitRequests()
      .then((r) => setExitRequests(r.length))
      .catch(() => setExitRequests(0));
  }, []);

  // Wait for the async counts before deciding, so the strip doesn't flip-flop.
  if (openTickets === null || exitRequests === null) return null;

  const items: AttentionItem[] = [];
  if (outstandingRentKES > 0) {
    items.push({
      key: "rent",
      label: "Outstanding rent",
      value: formatKES(outstandingRentKES),
      href: "/landlord/payments",
      tone: "critical",
    });
  }
  if (openTickets > 0) {
    items.push({
      key: "maintenance",
      label: urgentTickets > 0 ? `Open tickets · ${urgentTickets} urgent` : "Open maintenance",
      value: String(openTickets),
      href: "/landlord/maintenance",
      tone: urgentTickets > 0 ? "critical" : "warning",
    });
  }
  if (exitRequests > 0) {
    items.push({
      key: "exits",
      label: "Move-out requests",
      value: String(exitRequests),
      href: "/landlord/tenants",
      tone: "warning",
    });
  }
  if (vacantUnits > 0) {
    items.push({
      key: "vacant",
      label: "Vacant units",
      value: String(vacantUnits),
      href: "/landlord/properties",
      tone: "warning",
    });
  }

  if (items.length === 0) {
    return (
      <div className="mb-5 flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-white px-5 py-4">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2.2}>
          <path d="M4 12l5 5L20 6" />
        </svg>
        <span className="text-[13px] text-[var(--stone)]">You&apos;re all caught up — nothing needs your attention right now.</span>
      </div>
    );
  }

  return (
    <div className="mb-5">
      <div className="text-xs font-semibold text-[var(--stone)] uppercase tracking-wide mb-2">Needs your attention</div>
      <div className="grid gap-[12px]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="group flex items-center justify-between gap-3 rounded-[14px] border bg-white px-4 py-[14px] transition-colors"
            style={{
              borderColor: item.tone === "critical" ? "color-mix(in srgb, var(--error) 45%, var(--line))" : "var(--line-2)",
            }}
          >
            <div className="min-w-0">
              <div
                className="font-mono font-bold text-[20px] leading-none mb-1"
                style={{ color: item.tone === "critical" ? "var(--error)" : "var(--ink)" }}
              >
                {item.value}
              </div>
              <div className="text-[12px] text-[var(--stone)] truncate">{item.label}</div>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--stone)"
              strokeWidth={2}
              className="shrink-0 transition-transform group-hover:translate-x-0.5"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
