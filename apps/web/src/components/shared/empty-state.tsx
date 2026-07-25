import * as React from "react";

/**
 * One consistent empty state for every list, table or feed that can be empty:
 * an icon, a one-line explanation of why it's empty, and an optional primary
 * action. Replaces the ad-hoc "no items" text scattered across pages.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border-[1.5px] border-dashed border-[var(--line-2)] rounded-2xl py-16 px-5 text-center">
      {icon && <div className="flex justify-center mb-3 text-[var(--line-2)]">{icon}</div>}
      <p className="text-sm font-semibold text-[var(--ink)] mb-1">{title}</p>
      {description && <p className="text-[13px] text-[var(--stone)] max-w-[380px] mx-auto mb-4">{description}</p>}
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}
