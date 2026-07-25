"use client";

import * as React from "react";
import { toast } from "sonner";
import { TenancyStatus } from "@makazi/shared-types";
import { getCurrentLease, getLeaseDocument, type CurrentLease } from "@/lib/lease";
import { requestTenancyExit } from "@/lib/tenants";
import { ApiError } from "@/lib/api";
import { FormButton } from "@/components/shared/form-button";
import { Modal } from "@/components/shared/modal";
import { InlineError } from "@/components/shared/inline-error";
import { Field, Textarea } from "@/components/shared/field";

const LEASE_STATUS_LABEL: Record<TenancyStatus, string> = {
  [TenancyStatus.PENDING]: "Pending acceptance",
  [TenancyStatus.ACTIVE]: "Active",
  [TenancyStatus.ENDED]: "Ended",
};

function fmtKES(amount: string) {
  return `KES ${Number(amount).toLocaleString("en-KE")}`;
}

function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" }) : "Open-ended";
}

export default function LeasePage() {
  const [lease, setLease] = React.useState<CurrentLease | null>(null);
  const [downloading, setDownloading] = React.useState(false);
  const [exitOpen, setExitOpen] = React.useState(false);
  const [exitReason, setExitReason] = React.useState("");
  const [exitError, setExitError] = React.useState<string | null>(null);
  const [submittingExit, setSubmittingExit] = React.useState(false);

  const load = React.useCallback(() => {
    getCurrentLease().then(setLease);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleDownload() {
    setDownloading(true);
    try {
      const { url } = await getLeaseDocument();
      window.open(url, "_blank");
    } finally {
      setDownloading(false);
    }
  }

  async function handleRequestExit() {
    if (!lease) return;
    setExitError(null);
    setSubmittingExit(true);
    try {
      await requestTenancyExit(lease.id, exitReason || undefined);
      toast("Move-out request sent to your landlord.");
      setExitOpen(false);
      setExitReason("");
      load();
    } catch (err) {
      setExitError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmittingExit(false);
    }
  }

  if (!lease) return null;

  return (
    <div>
      <h1 className="font-display font-bold text-2xl tracking-[-0.02em] mb-1">Lease</h1>
      <p className="text-sm text-[var(--stone)] mb-6">
        {lease.unit.property.name} · Unit {lease.unit.code}
        {lease.unit.property.county ? `, ${lease.unit.property.county}` : ""}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[760px]">
        <div className="border border-[var(--line)] rounded-2xl bg-white p-5">
          <div className="text-xs font-semibold text-[var(--stone)] uppercase tracking-wide mb-4">Lease term</div>
          <div className="flex flex-col gap-[10px] text-[13px]">
            <div className="flex justify-between">
              <span className="text-[var(--stone)]">Lease start</span>
              <span className="font-semibold">{fmtDate(lease.leaseStart)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--stone)]">Lease end / renewal</span>
              <span className="font-semibold">{fmtDate(lease.leaseEnd)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--stone)]">Status</span>
              <span className="font-semibold">{LEASE_STATUS_LABEL[lease.status]}</span>
            </div>
          </div>
        </div>

        <div className="border border-[var(--line)] rounded-2xl bg-white p-5">
          <div className="text-xs font-semibold text-[var(--stone)] uppercase tracking-wide mb-4">Financials</div>
          <div className="flex flex-col gap-[10px] text-[13px]">
            <div className="flex justify-between">
              <span className="text-[var(--stone)]">Monthly rent</span>
              <span className="font-mono font-semibold">{fmtKES(lease.rentAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--stone)]">Security deposit</span>
              <span className="font-mono font-semibold">{lease.depositAmount ? fmtKES(lease.depositAmount) : "—"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 max-w-[760px] flex flex-wrap gap-3">
        <FormButton variant="outline" fullWidth={false} onClick={handleDownload} disabled={downloading} className="px-5">
          {downloading ? "Opening…" : "Download lease agreement"}
        </FormButton>
        {lease.status === TenancyStatus.ACTIVE &&
          (lease.exitRequestedAt ? (
            <span className="text-[13px] text-[var(--stone)] self-center">
              Move-out requested — your landlord will be in touch to finalise it.
            </span>
          ) : (
            <FormButton variant="outline" fullWidth={false} onClick={() => setExitOpen(true)} className="px-5">
              Request to move out
            </FormButton>
          ))}
      </div>

      <Modal open={exitOpen} onOpenChange={setExitOpen} maxWidth={420}>
        <h3 className="font-display font-bold text-xl mb-[6px]">Request to move out</h3>
        <p className="text-[13px] text-[var(--stone)] mb-5">
          This lets your landlord know you intend to leave {lease.unit.property.name}, unit {lease.unit.code}. They&apos;ll
          take you through the move-out and deposit process.
        </p>
        {exitError && <InlineError>{exitError}</InlineError>}
        <Field label="Reason" className="mb-5">
          <Textarea
            value={exitReason}
            onChange={(e) => setExitReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="e.g. relocating for work"
          />
        </Field>
        <div className="flex gap-[10px]">
          <FormButton variant="outline" onClick={() => setExitOpen(false)} disabled={submittingExit}>
            Cancel
          </FormButton>
          <FormButton onClick={handleRequestExit} disabled={submittingExit}>
            {submittingExit ? "Sending…" : "Send request"}
          </FormButton>
        </div>
      </Modal>
    </div>
  );
}
