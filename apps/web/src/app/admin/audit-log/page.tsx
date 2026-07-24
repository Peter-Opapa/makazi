"use client";

import * as React from "react";
import { listAuditLog, type AuditLogEntry } from "@/lib/admin";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AdminAuditLogPage() {
  const [entries, setEntries] = React.useState<AuditLogEntry[]>([]);

  React.useEffect(() => {
    listAuditLog().then(setEntries);
  }, []);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl tracking-[-0.02em] mb-[18px]">Audit log</h1>

      <div className="border border-[var(--line)] rounded-[14px] overflow-hidden bg-white">
        <div className="grid grid-cols-[1fr_1.6fr_1fr_1fr] px-4 py-3 bg-[var(--paper)] text-[11px] font-semibold text-[var(--stone)] uppercase tracking-wide">
          <span>Time</span>
          <span>Action</span>
          <span>Admin</span>
          <span>Target</span>
        </div>
        {entries.length === 0 && <div className="px-4 py-8 text-center text-sm text-[var(--stone)]">No admin actions recorded yet.</div>}
        {entries.map((e) => (
          <div
            key={e.id}
            className="grid grid-cols-[1fr_1.6fr_1fr_1fr] px-4 py-3.5 border-t border-[var(--line)] items-center text-[12.5px]"
          >
            <span className="font-mono text-[var(--stone)]">{fmtTime(e.createdAt)}</span>
            <span className="font-semibold">{e.action}</span>
            <span>
              {e.actor.firstName} {e.actor.lastName}
            </span>
            <span className="text-[var(--stone)] truncate">
              {typeof e.metadata?.name === "string" ? e.metadata.name : e.targetId}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
