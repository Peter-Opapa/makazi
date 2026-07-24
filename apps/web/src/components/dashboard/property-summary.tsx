import Link from "next/link";
import type { DashboardProperty } from "@/lib/reports";

export function PropertySummary({ properties }: { properties: DashboardProperty[] }) {
  return (
    <div className="border border-[var(--line)] rounded-2xl bg-white p-5">
      <div className="flex justify-between items-center mb-3">
        <span className="font-semibold text-sm">Property summary</span>
        <Link href="/landlord/properties" className="text-xs font-semibold text-[var(--green)]">
          View all
        </Link>
      </div>
      <div className="flex flex-col">
        {properties.map((p) => (
          <div key={p.id} className="flex items-center justify-between py-[10px] border-b border-[var(--line)] last:border-b-0 gap-3">
            <div className="min-w-0">
              <div className="text-[13px] font-semibold truncate">{p.name}</div>
              <div className="text-xs text-[var(--stone)] truncate">{p.location}</div>
            </div>
            <div className="flex gap-4 font-mono text-[11px] text-[var(--stone)] text-center shrink-0">
              <div>
                <div className="font-bold text-[13px] text-[var(--ink)]">{p.totalUnits}</div>
                Units
              </div>
              <div>
                <div className="font-bold text-[13px] text-[var(--success)]">{p.occupiedUnits}</div>
                Occ.
              </div>
              <div>
                <div className="font-bold text-[13px] text-[var(--stone)]">{p.vacantUnits}</div>
                Vac.
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
