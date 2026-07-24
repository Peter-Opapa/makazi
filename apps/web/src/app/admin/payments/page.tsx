"use client";

import * as React from "react";
import { PaymentStatus } from "@makazi/shared-types";
import {
  getAdminPaymentDetail,
  listAdminPayments,
  listAdminUnmatchedPayments,
  resolveAdminUnmatchedPayment,
  searchAdminActiveTenancies,
  type AdminPaymentDetail,
  type AdminPaymentListItem,
  type AdminTenancySearchResult,
  type AdminUnmatchedPayment,
} from "@/lib/admin";
import { formatKES } from "@/lib/format";
import { StatusBadge } from "@/components/shared/status-badge";
import { Modal } from "@/components/shared/modal";
import { FormButton } from "@/components/shared/form-button";

type Tab = "successful" | "failed" | "pending" | "reconciliation";

const TABS: { key: Tab; label: string }[] = [
  { key: "successful", label: "Successful" },
  { key: "failed", label: "Failed" },
  { key: "pending", label: "Pending" },
  { key: "reconciliation", label: "Reconciliation" },
];

function statusTone(status: PaymentStatus): "success" | "warning" | "error" | "neutral" {
  if (status === PaymentStatus.PAID) return "success";
  if (status === PaymentStatus.FAILED) return "error";
  return "warning";
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AdminPaymentsPage() {
  const [tab, setTab] = React.useState<Tab>("successful");
  const [payments, setPayments] = React.useState<AdminPaymentListItem[]>([]);
  const [unmatched, setUnmatched] = React.useState<AdminUnmatchedPayment[]>([]);
  const [viewingId, setViewingId] = React.useState<string | null>(null);
  const [resolvingId, setResolvingId] = React.useState<string | null>(null);

  const refetch = React.useCallback(() => {
    if (tab === "reconciliation") {
      listAdminUnmatchedPayments().then(setUnmatched);
    } else {
      const status = tab === "successful" ? PaymentStatus.PAID : tab === "failed" ? PaymentStatus.FAILED : PaymentStatus.PENDING;
      listAdminPayments({ status }).then(setPayments);
    }
  }, [tab]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl tracking-[-0.02em] mb-[18px]">Payment monitoring</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="rounded-lg px-3.5 py-2 text-xs font-semibold"
            style={
              tab === t.key ? { background: "var(--ink)", color: "#fff" } : { border: "1px solid var(--line-2)", color: "var(--stone)" }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "reconciliation" ? (
        <div className="border border-[var(--line)] rounded-[14px] overflow-hidden bg-white">
          <div className="grid grid-cols-[1fr_1.2fr_1fr_1fr_1fr] px-4 py-3 bg-[var(--paper)] text-[11px] font-semibold text-[var(--stone)] uppercase tracking-wide">
            <span>Time</span>
            <span>Payer</span>
            <span>Amount</span>
            <span>Reference</span>
            <span></span>
          </div>
          {unmatched.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[var(--stone)]">No unmatched payments — reconciliation queue is clear.</div>
          )}
          {unmatched.map((u) => (
            <div key={u.id} className="grid grid-cols-[1fr_1.2fr_1fr_1fr_1fr] px-4 py-3.5 border-t border-[var(--line)] items-center text-[12.5px]">
              <span className="font-mono text-[var(--stone)]">{fmtTime(u.time)}</span>
              <span>{u.payerPhone}</span>
              <span className="font-mono font-semibold">{formatKES(u.amount)}</span>
              <span className="font-mono text-[var(--stone)]">{u.accountReference}</span>
              <button onClick={() => setResolvingId(u.id)} className="text-xs font-semibold text-[var(--green-deep)] text-left">
                Resolve →
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-[var(--line)] rounded-[14px] overflow-hidden bg-white">
          <div className="grid grid-cols-[1fr_1.3fr_1fr_1fr_1fr] px-4 py-3 bg-[var(--paper)] text-[11px] font-semibold text-[var(--stone)] uppercase tracking-wide">
            <span>Time</span>
            <span>Tenant / Property</span>
            <span>Amount</span>
            <span>Channel</span>
            <span>Reference</span>
          </div>
          {payments.length === 0 && <div className="px-4 py-8 text-center text-sm text-[var(--stone)]">No payments in this status.</div>}
          {payments.map((p) => (
            <div
              key={p.id}
              onClick={() => setViewingId(p.id)}
              className="grid grid-cols-[1fr_1.3fr_1fr_1fr_1fr] px-4 py-3.5 border-t border-[var(--line)] items-center text-[12.5px] cursor-pointer hover:bg-[var(--paper)]"
            >
              <span className="font-mono text-[var(--stone)]">{fmtTime(p.time)}</span>
              <span>
                {p.tenant} · {p.property}
              </span>
              <span className="font-mono font-semibold">{formatKES(p.amount)}</span>
              <span className="text-[var(--stone)]">{p.channel}</span>
              <span className="font-mono text-[var(--stone)]">{p.reference ?? "—"}</span>
            </div>
          ))}
        </div>
      )}

      {viewingId && <PaymentDetailModal paymentId={viewingId} onOpenChange={(open) => !open && setViewingId(null)} />}
      {resolvingId && (
        <ResolveModal
          unmatchedId={resolvingId}
          onOpenChange={(open) => !open && setResolvingId(null)}
          onResolved={refetch}
        />
      )}
    </div>
  );
}

function PaymentDetailModal({ paymentId, onOpenChange }: { paymentId: string; onOpenChange: (open: boolean) => void }) {
  const [detail, setDetail] = React.useState<AdminPaymentDetail | null>(null);

  React.useEffect(() => {
    getAdminPaymentDetail(paymentId).then(setDetail);
  }, [paymentId]);

  if (!detail) return null;

  return (
    <Modal open onOpenChange={onOpenChange}>
      <h3 className="font-display font-bold text-[19px] mb-1.5">Payment {detail.reference ?? detail.id}</h3>
      <div className="mb-[18px]">
        <StatusBadge tone={statusTone(detail.status)}>{detail.status}</StatusBadge>
      </div>
      <div className="border border-[var(--line)] rounded-xl p-4 mb-[18px]">
        <Row label="Tenant" value={detail.tenant} />
        <Row label="Property" value={detail.property} />
        <Row label="Amount" value={formatKES(detail.amount)} mono />
        <Row label="Channel" value={detail.channel} />
        <Row label="Reference" value={detail.reference ?? "—"} mono />
        <Row label="Paid at" value={detail.paidAt ? fmtTime(detail.paidAt) : "—"} />
      </div>
    </Modal>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between text-[12.5px] py-1.5 border-t border-[var(--line)] first:border-t-0">
      <span className="text-[var(--stone)]">{label}</span>
      <span className={mono ? "font-mono font-semibold" : "font-semibold"}>{value}</span>
    </div>
  );
}

function ResolveModal({
  unmatchedId,
  onOpenChange,
  onResolved,
}: {
  unmatchedId: string;
  onOpenChange: (open: boolean) => void;
  onResolved: () => void;
}) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<AdminTenancySearchResult[]>([]);
  const [selected, setSelected] = React.useState<AdminTenancySearchResult | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (selected || query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      searchAdminActiveTenancies(query).then(setResults);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, selected]);

  async function handleResolve() {
    if (!selected) return;
    setSubmitting(true);
    try {
      await resolveAdminUnmatchedPayment(unmatchedId, selected.tenancyId);
      onResolved();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open onOpenChange={onOpenChange} maxWidth={440}>
      <h3 className="font-display font-bold text-xl mb-[6px]">Resolve payment</h3>
      <p className="text-[13px] text-[var(--stone)] mb-5">Assign this unmatched payment to the right tenant.</p>

      <label className="block text-[13px] font-semibold mb-[6px]">Tenant</label>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Name or phone"
        className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px] mb-2"
      />
      {selected ? (
        <div className="flex justify-between items-center border border-[var(--green)] bg-[var(--green-soft)] rounded-[9px] px-3 py-[10px] mb-5">
          <span className="text-[13px] font-semibold">
            {selected.tenantName} — {selected.property} · {selected.unitCode}
          </span>
          <button type="button" onClick={() => setSelected(null)} className="text-xs text-[var(--stone)]">
            Change
          </button>
        </div>
      ) : (
        results.length > 0 && (
          <div className="border border-[var(--line)] rounded-[9px] overflow-hidden mb-5">
            {results.map((r) => (
              <button
                type="button"
                key={r.tenancyId}
                onClick={() => setSelected(r)}
                className="w-full text-left px-3 py-[10px] text-[13px] border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--paper)]"
              >
                <div className="font-semibold">{r.tenantName}</div>
                <div className="text-xs text-[var(--stone)]">
                  {r.property} · {r.unitCode}
                </div>
              </button>
            ))}
          </div>
        )
      )}

      <FormButton disabled={!selected || submitting} onClick={handleResolve}>
        {submitting ? "Resolving…" : "Assign payment"}
      </FormButton>
    </Modal>
  );
}
