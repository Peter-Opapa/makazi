import * as React from "react";

export function Stepper({ steps, currentIndex }: { steps: string[]; currentIndex: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-6 flex-wrap">
      {steps.map((label, i) => {
        const state = i < currentIndex ? "done" : i === currentIndex ? "active" : "upcoming";
        return (
          <React.Fragment key={label}>
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold font-mono shrink-0"
                style={{
                  background: state === "upcoming" ? "none" : state === "active" ? "var(--green)" : "var(--green-deep)",
                  border: state === "upcoming" ? "1.5px solid var(--line-2)" : "none",
                  color: state === "upcoming" ? "var(--stone)" : "#fff",
                }}
              >
                {state === "done" ? "✓" : i + 1}
              </div>
              <span
                className="text-[11px] whitespace-nowrap"
                style={{ color: state === "upcoming" ? "var(--stone)" : "var(--ink)", fontWeight: state === "active" ? 600 : 500 }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && <div className="w-[18px] h-[1.5px] bg-[var(--line-2)] shrink-0" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
