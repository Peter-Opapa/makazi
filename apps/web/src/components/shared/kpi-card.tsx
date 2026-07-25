export function KpiCard({
  label,
  value,
  sub,
  valueColor,
  deltaPct,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
  /** Percent change vs. the prior period. Omit/null when there's no meaningful baseline to compare against. */
  deltaPct?: number | null;
}) {
  return (
    <div className="border border-[var(--line)] rounded-[14px] p-[18px] bg-white">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="font-mono text-[10px] text-[var(--stone)] uppercase tracking-wide">{label}</div>
        {deltaPct != null && deltaPct !== 0 && (
          <span
            className="font-mono text-[10px] font-semibold"
            style={{ color: deltaPct > 0 ? "var(--success)" : "var(--error)" }}
          >
            {deltaPct > 0 ? "▲" : "▼"} {Math.abs(deltaPct)}%
          </span>
        )}
      </div>
      <div className="font-mono font-bold text-[22px]" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-[var(--stone)] mt-1">{sub}</div>}
    </div>
  );
}
