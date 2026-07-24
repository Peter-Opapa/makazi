"use client";

import * as React from "react";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { getReceipt, listPayments, type PaymentHistoryItem } from "@/lib/payments";

function fmtKES(amount: string) {
  return `KES ${Number(amount).toLocaleString("en-KE")}`;
}

function statusTone(status: string): StatusTone {
  switch (status) {
    case "PAID":
      return "success";
    case "LATE":
    case "FAILED":
      return "error";
    default:
      return "warning";
  }
}

export default function ReceiptsPage() {
  const [payments, setPayments] = React.useState<PaymentHistoryItem[] | null>(null);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    listPayments().then(setPayments);
  }, []);

  async function handleDownload(id: string) {
    setDownloadingId(id);
    try {
      const { url } = await getReceipt(id);
      window.open(url, "_blank");
    } finally {
      setDownloadingId(null);
    }
  }

  if (!payments) return null;

  return (
    <div>
      <h1 className="font-display font-bold text-2xl tracking-[-0.02em] mb-5">Receipts</h1>

      {payments.length === 0 ? (
        <div className="border-[1.5px] border-dashed border-[var(--line-2)] rounded-2xl py-16 px-5 text-center">
          <p className="text-sm text-[var(--stone)]">No payments yet.</p>
        </div>
      ) : (
        <div className="border border-[var(--line)] rounded-[14px] overflow-hidden bg-white">
          {payments.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center justify-between px-4 py-[13px] gap-3 flex-wrap"
              style={i > 0 ? { borderTop: "1px solid var(--line)" } : undefined}
            >
              <div className="min-w-0">
                <div className="text-[13px] font-semibold">{fmtKES(p.amount)}</div>
                <div className="text-xs text-[var(--stone)]">
                  {p.dueDate ? new Date(p.dueDate).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                  {p.reference ? ` · ${p.reference}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge tone={statusTone(p.status)}>{p.status}</StatusBadge>
                {p.status === "PAID" && (
                  <button
                    onClick={() => handleDownload(p.id)}
                    disabled={downloadingId === p.id}
                    className="border-[1.5px] border-[var(--line-2)] rounded-[9px] px-3 py-[6px] text-xs font-semibold disabled:opacity-50"
                  >
                    {downloadingId === p.id ? "Opening…" : "Receipt"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
