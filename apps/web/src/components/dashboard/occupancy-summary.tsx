import type { UnitStatus } from "@makazi/shared-types";
import { unitStatusColor, unitStatusLabel } from "@/lib/format";

export function OccupancySummary({ breakdown }: { breakdown: { status: UnitStatus; count: number }[] }) {
  const total = breakdown.reduce((sum, b) => sum + b.count, 0);

  return (
    <div className="border border-[var(--line)] rounded-2xl bg-white p-5">
      <div className="font-semibold text-sm mb-4">Occupancy summary</div>
      <div className="flex h-3 rounded-full overflow-hidden mb-4 bg-[var(--paper)]">
        {breakdown.map((b) => (
          <div key={b.status} style={{ flex: b.count || 0.0001, background: unitStatusColor(b.status) }} />
        ))}
      </div>
      <div className="flex flex-col gap-[9px]">
        {breakdown.map((b) => (
          <div key={b.status} className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-2 text-[var(--stone)]">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: unitStatusColor(b.status) }} />
              {unitStatusLabel(b.status)}
            </span>
            <span className="font-mono font-semibold">
              {b.count} <span className="text-[var(--stone)] font-normal">({total ? Math.round((b.count / total) * 100) : 0}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
