import Link from "next/link";
import type { DashboardPayment } from "@/lib/reports";
import { formatKES, paymentStatusTone } from "@/lib/format";
import { StatusBadge } from "@/components/shared/status-badge";

export function RecentPayments({ payments }: { payments: DashboardPayment[] }) {
  return (
    <div className="border border-[var(--line)] rounded-2xl bg-white p-5">
      <div className="flex justify-between items-center mb-3">
        <span className="font-semibold text-sm">Recent payments</span>
        <Link href="/landlord/payments" className="text-xs font-semibold text-[var(--green)]">
          View all
        </Link>
      </div>
      <div className="flex flex-col">
        {payments.map((p) => (
          <div key={p.id} className="flex items-center justify-between py-[10px] border-b border-[var(--line)] last:border-b-0 gap-3">
            <div className="min-w-0">
              <div className="text-[13px] font-semibold truncate">{p.tenantName}</div>
              <div className="text-xs text-[var(--stone)] font-mono">{p.unit}</div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono text-[13px] font-semibold">{formatKES(p.amountKES)}</span>
              <StatusBadge tone={paymentStatusTone(p.status)}>{p.status}</StatusBadge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
