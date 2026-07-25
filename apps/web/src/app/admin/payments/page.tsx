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
import { Field, Input } from "@/components/shared/field";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { SkeletonList } from "@/components/shared/skeletons";

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
  const [payments, setPayments] = React.useState<AdminPaymentListItem[] | null>(null);
  const [unmatched, setUnmatched] = React.useState<AdminUnmatchedPayment[] | null>(null);
  const [viewingId, setViewingId] = React.useState<string | null>(null);
  const [resolvingId, setResolvingId] = React.useState<string | null>(null);

  const refetch = React.useCallback(() => {
    if (tab === "reconciliation") {
      setUnmatched(null);
      listAdminUnmatchedPayments().then(setUnmatched);
    } else {
      setPayments(null);
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
        <>
          {!unmatched && <SkeletonList rows={5} />}
          {unmatched && unmatched.length === 0 && (
            <EmptyState title="Reconciliation queue is clear" description="No unmatched payments to assign right now." />
          )}
          {unmatched && unmatched.length > 0 && (
            <DataTable
              rows={unmatched}
              rowKey={(u) => u.id}
              columns={[
                { key: "time", header: "Time", sortValue: (u) => new Date(u.time).getTime(), render: (u) => <span className="font-mono text-[var(--stone)]">{fmtTime(u.time)}</span> },
                { key: "payer", header: "Payer", sortValue: (u) => u.payerPhone, render: (u) => <span>{u.payerPhone}</span> },
                { key: "amount", header: "Amount", align: "right", sortValue: (u) => u.amount, render: (u) => <span className="font-mono font-semibold">{formatKES(u.amount)}</span> },
                { key: "reference", header: "Reference", render: (u) => <span className="font-mono text-[var(--stone)]">{u.accountReference}</span> },
                {
                  key: "actions",
                  header: "Actions",
                  align: "right",
                  hideLabelOnMobile: true,
                  render: (u) => (
                    <button onClick={() => setResolvingId(u.id)} className="text-xs font-semibold text-[var(--green-deep)]">
                      Resolve →
                    </button>
                  ),
                },
              ]}
            />
          )}
        </>
      ) : (
        <>
          {!payments && <SkeletonList rows={6} />}
          {payments && payments.length === 0 && <EmptyState title="No payments in this status" />}
          {payments && payments.length > 0 && (
            <DataTable
              rows={payments}
              rowKey={(p) => p.id}
              onRowClick={(p) => setViewingId(p.id)}
              columns={[
                { key: "time", header: "Time", sortValue: (p) => new Date(p.time).getTime(), render: (p) => <span className="font-mono text-[var(--stone)]">{fmtTime(p.time)}</span> },
                { key: "tenant", header: "Tenant / Property", sortValue: (p) => p.tenant.toLowerCase(), render: (p) => <span>{p.tenant} · {p.property}</span> },
                { key: "amount", header: "Amount", align: "right", sortValue: (p) => p.amount, render: (p) => <span className="font-mono font-semibold">{formatKES(p.amount)}</span> },
                { key: "channel", header: "Channel", sortValue: (p) => p.channel, render: (p) => <span className="text-[var(--stone)]">{p.channel}</span> },
                { key: "reference", header: "Reference", render: (p) => <span className="font-mono text-[var(--stone)]">{p.reference ?? "—"}</span> },
              ]}
            />
          )}
        </>
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

      <Field label="Tenant" required className="mb-2">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or phone" />
      </Field>
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
