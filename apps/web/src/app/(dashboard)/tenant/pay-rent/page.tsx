"use client";

import * as React from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormButton } from "@/components/shared/form-button";
import { PayRentModal } from "@/components/dashboard/pay-rent-modal";
import { getRentStatus, type Payment } from "@/lib/payments";

function fmtKES(amount: string) {
  return `KES ${Number(amount).toLocaleString("en-KE")}`;
}

export default function PayRentPage() {
  const [due, setDue] = React.useState<Payment | null>(null);
  const [payOpen, setPayOpen] = React.useState(false);

  const refetch = React.useCallback(async () => {
    setDue(await getRentStatus());
  }, []);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  if (!due) return null;

  const isOverdue = due.status === "LATE";

  return (
    <div>
      <h1 className="font-display font-bold text-2xl tracking-[-0.02em] mb-5">Pay Rent</h1>

      <div className="border border-[var(--line)] rounded-2xl bg-white p-6 max-w-[440px]">
        <div className="flex justify-between items-start mb-4">
          <span className="text-xs font-semibold text-[var(--stone)] uppercase tracking-wide">Amount due</span>
          {isOverdue && <StatusBadge tone="error">Overdue</StatusBadge>}
        </div>
        <div className="font-mono font-bold text-4xl mb-2">{fmtKES(due.amount)}</div>
        <p className="text-[13px] text-[var(--stone)] mb-6">
          {due.dueDate
            ? `Due ${new Date(due.dueDate).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}`
            : "No due date set"}
        </p>
        <FormButton onClick={() => setPayOpen(true)}>Pay {fmtKES(due.amount)}</FormButton>
        <p className="text-xs text-[var(--stone)] mt-4 text-center">Pay via M-Pesa STK Push, USSD, or WhatsApp.</p>
      </div>

      <PayRentModal open={payOpen} onOpenChange={setPayOpen} due={due} onPaid={refetch} />
    </div>
  );
}
