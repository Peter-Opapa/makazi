import { Skeleton } from "@/components/ui/skeleton";

/**
 * Page-level loading placeholders shaped like the content that replaces them,
 * so navigating never flashes a blank screen. Built on the shared Skeleton
 * (brand-themed via globals.css). Compose these per page rather than returning
 * null while data loads.
 */

/** A page title + subtitle stub. */
export function SkeletonPageHeader() {
  return (
    <div className="mb-6">
      <Skeleton className="h-7 w-56 mb-2" />
      <Skeleton className="h-4 w-40" />
    </div>
  );
}

/** A responsive row of KPI-card stubs. */
export function SkeletonKpiRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-[14px] mb-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-[var(--line)] rounded-2xl bg-white p-5">
          <Skeleton className="h-3 w-20 mb-3" />
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

/** A bordered list of row stubs (tenants, caretakers, units, tickets…). */
export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="border border-[var(--line)] rounded-[14px] overflow-hidden bg-white">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between px-4 py-[14px]"
          style={i > 0 ? { borderTop: "1px solid var(--line)" } : undefined}
        >
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** A single card-shaped block, e.g. a detail panel. */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="border border-[var(--line)] rounded-2xl bg-white p-5">
      <Skeleton className="h-4 w-32 mb-4" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3.5 w-full mb-3 last:mb-0" style={{ maxWidth: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}
