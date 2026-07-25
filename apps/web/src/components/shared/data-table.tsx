"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  /** Cell content. */
  render: (row: T) => React.ReactNode;
  /** Provide to make the column sortable (click the header to sort by this value). */
  sortValue?: (row: T) => string | number;
  align?: "left" | "right";
  /** Hide this column's label in the mobile card view (e.g. an actions column). */
  hideLabelOnMobile?: boolean;
}

/**
 * One table system for every list in the app. Renders a real table on desktop
 * and stacked label/value cards on mobile (never a horizontal scroll), with
 * optional per-column client-side sorting. Row actions and badges are supplied
 * by the column's render function, so callers keep full control of cell
 * content while alignment, density, sorting and responsiveness stay consistent.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
}) {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");

  const sortedRows = React.useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return rows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [rows, columns, sortKey, sortDir]);

  function toggleSort(col: Column<T>) {
    if (!col.sortValue) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col.key);
      setSortDir("asc");
    }
  }

  return (
    <>
      {/* Desktop: table */}
      <div className="hidden sm:block border border-[var(--line)] rounded-[14px] overflow-hidden bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[var(--line)]">
              {columns.map((col) => {
                const active = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-wide text-[var(--stone)] px-4 py-[10px]",
                      col.align === "right" ? "text-right" : "text-left",
                    )}
                  >
                    {col.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col)}
                        className={cn(
                          "inline-flex items-center gap-1 hover:text-[var(--ink)]",
                          active && "text-[var(--ink)]",
                          col.align === "right" && "flex-row-reverse",
                        )}
                      >
                        {col.header}
                        <span className="text-[9px] leading-none">{active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}</span>
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-[var(--line)] last:border-b-0",
                  onRowClick && "cursor-pointer hover:bg-[var(--paper)]",
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn("px-4 py-[13px] text-[13px] align-middle", col.align === "right" ? "text-right" : "text-left")}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="sm:hidden flex flex-col gap-3">
        {sortedRows.map((row) => (
          <div
            key={rowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(
              "border border-[var(--line)] rounded-[12px] bg-white p-4 flex flex-col gap-2",
              onRowClick && "cursor-pointer",
            )}
          >
            {columns.map((col) => (
              <div key={col.key} className="flex items-start justify-between gap-3">
                {!col.hideLabelOnMobile && (
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--stone)] shrink-0 pt-0.5">
                    {col.header}
                  </span>
                )}
                <div className={cn("text-[13px] min-w-0", col.hideLabelOnMobile ? "w-full" : "text-right")}>{col.render(row)}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
