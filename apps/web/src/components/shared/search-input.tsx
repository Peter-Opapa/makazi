export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative flex-1 max-w-[360px]">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-[34px] pr-3 py-[9px] border border-[var(--line)] rounded-[9px] bg-[var(--paper)] text-[13px]"
      />
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--stone)"
        strokeWidth={2}
        className="absolute left-[11px] top-1/2 -translate-y-1/2"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
    </div>
  );
}
