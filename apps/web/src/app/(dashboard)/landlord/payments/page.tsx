"use client";

import * as React from "react";
import { PaymentStatus } from "@makazi/shared-types";
import { listLedger, listUnmatchedPayments, type PaymentLedgerItem, type UnmatchedPayment } from "@/lib/payments";
import { listProperties, type PropertyListItem } from "@/lib/properties";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { FormButton } from "@/components/shared/form-button";
import { ResolveUnmatchedPaymentModal } from "@/components/dashboard/resolve-unmatched-payment-modal";

const STATUS_TABS: { key: PaymentStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: PaymentStatus.PENDING, label: "Pending" },
  { key: PaymentStatus.LATE, label: "Late" },
  { key: PaymentStatus.PAID, label: "Paid" },
  { key: PaymentStatus.FAILED, label: "Failed" },
];

function fmtKES(amount: string) {
  return `KES ${Number(amount).toLocaleString("en-KE")}`;
}

function statusTone(status: PaymentStatus): StatusTone {
  switch (status) {
    case PaymentStatus.PAID:
      return "success";
    case PaymentStatus.LATE:
    case PaymentStatus.FAILED:
      return "error";
    default:
      return "warning";
  }
}

export default function LandlordPaymentsPage() {
  const [properties, setProperties] = React.useState<PropertyListItem[]>([]);
  const [propertyId, setPropertyId] = React.useState("");
  const [status, setStatus] = React.useState<PaymentStatus | "all">("all");
  const [ledger, setLedger] = React.useState<PaymentLedgerItem[] | null>(null);
  const [unmatched, setUnmatched] = React.useState<UnmatchedPayment[]>([]);
  const [resolvingPayment, setResolvingPayment] = React.useState<UnmatchedPayment | null>(null);

  const refetch = React.useCallback(async () => {
    const [ledgerRes, unmatchedRes] = await Promise.all([
      listLedger({ propertyId: propertyId || undefined, status: status === "all" ? undefined : status }),
      listUnmatchedPayments(propertyId || undefined),
    ]);
    setLedger(ledgerRes);
    setUnmatched(unmatchedRes);
  }, [propertyId, status]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  React.useEffect(() => {
    listProperties({ pageSize: 100 }).then((res) => setProperties(res.data));
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <h1 className="font-display font-bold text-2xl tracking-[-0.02em]">Payments</h1>
        <select
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          className="border border-[var(--line)] rounded-[9px] px-3 py-[9px] text-[13px] bg-[var(--paper)]"
        >
          <option value="">All properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {unmatched.length > 0 && (
        <div className="border border-[var(--warning)] bg-[var(--warning-bg)] rounded-2xl p-4 mb-5">
          <div className="text-[13px] font-semibold mb-3">
            {unmatched.length} unmatched payment{unmatched.length > 1 ? "s" : ""} — couldn&apos;t be linked to a tenant
          </div>
          <div className="flex flex-col gap-2">
            {unmatched.map((u) => (
              <div key={u.id} className="flex justify-between items-center bg-white rounded-[10px] px-3 py-[10px] gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold">{fmtKES(u.amount)}</div>
                  <div className="text-xs text-[var(--stone)]">
                    {u.payerPhone} · ref &quot;{u.accountReference}&quot; · {new Date(u.createdAt).toLocaleDateString("en-KE")}
                  </div>
                </div>
                <FormButton fullWidth={false} onClick={() => setResolvingPayment(u)} className="px-3 py-[6px] text-xs">
                  Resolve
                </FormButton>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatus(tab.key)}
            className="rounded-full px-3 py-[6px] text-xs font-semibold border-[1.5px] border-[var(--line-2)]"
            style={status === tab.key ? { background: "var(--ink)", color: "#fff", borderColor: "var(--ink)" } : undefined}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {ledger && ledger.length === 0 && (
        <div className="border-[1.5px] border-dashed border-[var(--line-2)] rounded-2xl py-16 px-5 text-center">
          <p className="text-sm text-[var(--stone)]">No payments match this filter.</p>
        </div>
      )}

      {ledger && ledger.length > 0 && (
        <div className="border border-[var(--line)] rounded-[14px] overflow-hidden bg-white">
          {ledger.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center justify-between px-4 py-[13px] gap-3 flex-wrap"
              style={i > 0 ? { borderTop: "1px solid var(--line)" } : undefined}
            >
              <div className="min-w-0">
                <div className="text-[13px] font-semibold truncate">
                  {p.tenancy.tenant.firstName} {p.tenancy.tenant.lastName}
                </div>
                <div className="text-xs text-[var(--stone)] truncate">
                  {p.tenancy.unit.property.name} · <span className="font-mono">{p.tenancy.unit.code}</span>
                  {p.dueDate ? ` · due ${new Date(p.dueDate).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-[13px] font-semibold">{fmtKES(p.amount)}</span>
                <StatusBadge tone="neutral">{p.channel.replace("_", " ")}</StatusBadge>
                <StatusBadge tone={statusTone(p.status)}>{p.status}</StatusBadge>
              </div>
            </div>
          ))}
        </div>
      )}

      {resolvingPayment && (
        <ResolveUnmatchedPaymentModal
          open={!!resolvingPayment}
          onOpenChange={(open) => !open && setResolvingPayment(null)}
          payment={resolvingPayment}
          onResolved={refetch}
        />
      )}
    </div>
  );
}
