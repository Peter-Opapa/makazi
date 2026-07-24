import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "error" | "neutral";

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-[var(--green-soft)] text-[var(--green-deep)]",
  warning: "bg-[var(--warning-bg)] text-[var(--warning)]",
  error: "bg-[var(--error-bg)] text-[var(--error)]",
  neutral: "bg-[var(--paper)] text-[var(--stone)] border border-[var(--line)]",
};

export function StatusBadge({ tone, children }: { tone: StatusTone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-[9px] py-[3px] font-mono text-[11px] font-medium whitespace-nowrap",
        TONE_CLASSES[tone],
      )}
    >
      {children}
    </span>
  );
}
