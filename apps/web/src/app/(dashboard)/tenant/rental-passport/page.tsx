"use client";

import * as React from "react";
import { getRentalPassport, type RentalPassport } from "@/lib/payments";
import { KpiCard } from "@/components/shared/kpi-card";

const LABEL_COLOR: Record<string, string> = {
  Excellent: "var(--success)",
  Good: "var(--green-deep)",
  Fair: "var(--warning)",
  "Building history": "var(--stone)",
};

export default function RentalPassportPage() {
  const [passport, setPassport] = React.useState<RentalPassport | null>(null);

  React.useEffect(() => {
    getRentalPassport().then(setPassport);
  }, []);

  if (!passport) return null;

  return (
    <div>
      <h1 className="font-display font-bold text-2xl tracking-[-0.02em] mb-1">Rental Passport</h1>
      <p className="text-sm text-[var(--stone)] mb-6">Your rental history, and an alternative credit-score preview.</p>

      <div className="border border-[var(--line)] rounded-2xl bg-white p-8 mb-5 text-center max-w-[440px]">
        {passport.score === null ? (
          <>
            <div className="font-display font-bold text-2xl mb-2">Building history</div>
            <p className="text-[13px] text-[var(--stone)]">
              Once you&apos;ve made a few rent payments, your rental passport score will appear here.
            </p>
          </>
        ) : (
          <>
            <div
              className="font-mono font-bold text-5xl mb-2"
              style={{ color: LABEL_COLOR[passport.label] ?? "var(--ink)" }}
            >
              {passport.score}
            </div>
            <div className="text-sm font-semibold" style={{ color: LABEL_COLOR[passport.label] ?? "var(--ink)" }}>
              {passport.label}
            </div>
          </>
        )}
      </div>

      <div className="grid gap-[14px] mb-5 max-w-[600px]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <KpiCard
          label="On-time rate"
          value={passport.onTimeRate !== null ? `${Math.round(passport.onTimeRate * 100)}%` : "—"}
        />
        <KpiCard label="Months as tenant" value={String(passport.monthsAsTenant)} />
        <KpiCard label="Payments recorded" value={String(passport.totalPayments)} />
      </div>

      <p className="text-xs text-[var(--stone)] max-w-[600px]">
        This is a preview based on your own payment history with Makazi, not a score from a credit bureau — landlords may
        use it as one signal among others.
      </p>
    </div>
  );
}
