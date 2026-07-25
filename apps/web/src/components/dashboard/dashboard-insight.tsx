import { formatKES } from "@/lib/format";

/**
 * A one-sentence synthesis of the month's numbers, sitting above the KPI grid
 * so a landlord gets the headline before the detail. Deliberately only about
 * the positive collection/occupancy story — LandlordAttention below it owns
 * surfacing what's wrong, so the two don't repeat each other.
 */
export function DashboardInsight({
  revenueKES,
  occupancyPct,
  propertiesCount,
}: {
  revenueKES: number;
  occupancyPct: number;
  propertiesCount: number;
}) {
  if (propertiesCount === 0) return null;

  return (
    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[var(--green-line)] bg-[var(--green-soft)] px-5 py-4">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green-deep)" strokeWidth={2.2}>
          <path d="M4 17l6-6 4 4 6-8" />
          <path d="M14 7h6v6" />
        </svg>
      </div>
      <p className="text-[14px] text-[var(--green-deep)] leading-snug">
        <span className="font-semibold">
          You&apos;ve collected {formatKES(revenueKES)} this month across {propertiesCount}{" "}
          propert{propertiesCount === 1 ? "y" : "ies"}
        </span>{" "}
        — {occupancyPct}% occupied.
      </p>
    </div>
  );
}
