import Link from "next/link";
import type { DashboardMaintenanceItem } from "@/lib/reports";
import { maintenanceStatusLabel, maintenanceStatusTone } from "@/lib/format";
import { StatusBadge } from "@/components/shared/status-badge";

export function RecentMaintenance({ tickets }: { tickets: DashboardMaintenanceItem[] }) {
  return (
    <div className="border border-[var(--line)] rounded-2xl bg-white p-5">
      <div className="flex justify-between items-center mb-3">
        <span className="font-semibold text-sm">Recent maintenance</span>
        <Link href="/landlord/maintenance" className="text-xs font-semibold text-[var(--green)]">
          View all
        </Link>
      </div>
      <div className="flex flex-col">
        {tickets.map((t) => (
          <div key={t.id} className="flex items-center justify-between py-[10px] border-b border-[var(--line)] last:border-b-0 gap-3">
            <div className="min-w-0">
              <div className="text-[13px] font-semibold truncate">{t.issue}</div>
              <div className="text-xs text-[var(--stone)] truncate">
                {t.reportedByName} · <span className="font-mono">{t.unit}</span>
              </div>
            </div>
            <StatusBadge tone={maintenanceStatusTone(t.status)}>{maintenanceStatusLabel(t.status)}</StatusBadge>
          </div>
        ))}
      </div>
    </div>
  );
}
