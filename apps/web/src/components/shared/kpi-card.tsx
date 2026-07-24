export function KpiCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div className="border border-[var(--line)] rounded-[14px] p-[18px] bg-white">
      <div className="font-mono text-[10px] text-[var(--stone)] uppercase tracking-wide mb-2">{label}</div>
      <div className="font-mono font-bold text-[22px]" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-[var(--stone)] mt-1">{sub}</div>}
    </div>
  );
}
