export function InlineError({ children, icon = true }: { children: React.ReactNode; icon?: boolean }) {
  return (
    <div className="flex items-start gap-[9px] rounded-[10px] border border-[var(--error-border)] bg-[var(--error-bg)] px-[14px] py-3 mb-[18px]">
      {icon && (
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--error)"
          strokeWidth={2}
          className="flex-shrink-0 mt-[1px]"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v5M12 16h.01" />
        </svg>
      )}
      <span className="text-[13px] text-[var(--error)]">{children}</span>
    </div>
  );
}
