"use client";

import * as React from "react";
import { getCurrentLease, getLeaseDocument, type CurrentLease } from "@/lib/lease";
import { FormButton } from "@/components/shared/form-button";

function fmtKES(amount: string) {
  return `KES ${Number(amount).toLocaleString("en-KE")}`;
}

function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" }) : "Open-ended";
}

export default function LeasePage() {
  const [lease, setLease] = React.useState<CurrentLease | null>(null);
  const [downloading, setDownloading] = React.useState(false);

  React.useEffect(() => {
    getCurrentLease().then(setLease);
  }, []);

  async function handleDownload() {
    setDownloading(true);
    try {
      const { url } = await getLeaseDocument();
      window.open(url, "_blank");
    } finally {
      setDownloading(false);
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
              <span className="font-semibold">{lease.active ? "Active" : "Ended"}</span>
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

      <div className="mt-5 max-w-[760px]">
        <FormButton variant="outline" fullWidth={false} onClick={handleDownload} disabled={downloading} className="px-5">
          {downloading ? "Opening…" : "Download lease agreement"}
        </FormButton>
      </div>
    </div>
  );
}
