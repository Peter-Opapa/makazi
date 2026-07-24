"use client";

import * as React from "react";
import { PaymentChannel } from "@makazi/shared-types";
import { ApiError } from "@/lib/api";
import { getPayment, initiatePayment, type Payment, type PaymentDestination } from "@/lib/payments";
import { Modal } from "@/components/shared/modal";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 1500;
const MAX_POLLS = 10;
/** USSD/PayBill settle out-of-band whenever (if) the tenant actually pays — poll longer, and never call it a failure. */
const AWAITING_POLL_INTERVAL_MS = 3000;

function shortcodeLabel(dest: PaymentDestination | null): string {
  if (!dest) return "";
  return dest.method === "till" ? `Till ${dest.tillNumber}` : `PayBill ${dest.payBillNumber}`;
}

const CHANNELS: {
  value: PaymentChannel;
  label: string;
  description: string;
  /** Only STK Push and WhatsApp get a guaranteed, app-driven resolution. */
  guaranteed: boolean;
}[] = [
  { value: PaymentChannel.STK_PUSH, label: "M-Pesa STK Push", description: "We send a prompt straight to your phone", guaranteed: true },
  { value: PaymentChannel.USSD, label: "USSD", description: "Dial the code yourself, we'll detect it", guaranteed: false },
  { value: PaymentChannel.PAYBILL_DIRECT, label: "PayBill", description: "Pay from your M-Pesa app, we'll detect it", guaranteed: false },
  { value: PaymentChannel.WHATSAPP, label: "WhatsApp", description: "Confirm the payment in WhatsApp", guaranteed: true },
];

type Stage = "select" | "polling" | "awaiting" | "success" | "failed" | "timeout";

function fmtKES(amount: string) {
  return `KES ${Number(amount).toLocaleString("en-KE")}`;
}

function instructionsFor(channel: PaymentChannel, payment: Payment): string {
  const shortcode = shortcodeLabel(payment.paymentAccount);
  const ref = payment.accountReference ?? "";
  if (channel === PaymentChannel.USSD) {
    return `Dial *334#, choose Lipa na M-Pesa > Pay Bill, then enter ${shortcode} and account number ${ref}.`;
  }
  return `Open M-Pesa on your phone, choose Lipa na M-Pesa > Pay Bill, then enter ${shortcode} and account number ${ref}.`;
}

export function PayRentModal({
  open,
  onOpenChange,
  due,
  onPaid,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  due: Payment;
  onPaid: () => void;
}) {
  const [stage, setStage] = React.useState<Stage>("select");
  const [channel, setChannel] = React.useState<PaymentChannel>(PaymentChannel.STK_PUSH);
  const [payment, setPayment] = React.useState<Payment>(due);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setStage("select");
      setChannel(PaymentChannel.STK_PUSH);
      setPayment(due);
      setError(null);
    }
  }, [open, due]);

  React.useEffect(() => {
    if (stage !== "polling") return;
    let attempts = 0;
    const timer = setInterval(async () => {
      attempts += 1;
      const latest = await getPayment(payment.id);
      if (latest.status === "PAID") {
        setPayment(latest);
        setStage("success");
        onPaid();
        clearInterval(timer);
      } else if (latest.status === "FAILED") {
        setPayment(latest);
        setStage("failed");
        clearInterval(timer);
      } else if (attempts >= MAX_POLLS) {
        setStage("timeout");
        clearInterval(timer);
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [stage, payment.id, onPaid]);

  React.useEffect(() => {
    if (stage !== "awaiting") return;
    const timer = setInterval(async () => {
      const latest = await getPayment(payment.id);
      if (latest.status === "PAID") {
        setPayment(latest);
        setStage("success");
        onPaid();
        clearInterval(timer);
      }
    }, AWAITING_POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [stage, payment.id, onPaid]);

  async function handleConfirm() {
    setError(null);
    setSubmitting(true);
    try {
      const initiated = await initiatePayment(channel);
      setPayment(initiated);
      const selected = CHANNELS.find((c) => c.value === channel);
      setStage(selected?.guaranteed ? "polling" : "awaiting");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedChannel = CHANNELS.find((c) => c.value === channel)!;

  return (
    <Modal open={open} onOpenChange={onOpenChange} maxWidth={420}>
      {stage === "select" && (
        <>
          <h3 className="font-display font-bold text-xl mb-[6px]">Pay rent</h3>
          <p className="text-[13px] text-[var(--stone)] mb-5">
            {fmtKES(payment.amount)} due
            {payment.dueDate ? ` — ${new Date(payment.dueDate).toLocaleDateString("en-KE", { day: "numeric", month: "long" })}` : ""}
          </p>

          {error && <InlineError>{error}</InlineError>}

          <div className="flex flex-col gap-2 mb-6">
            {CHANNELS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setChannel(c.value)}
                className={cn(
                  "text-left rounded-[10px] px-4 py-[11px] border-[1.5px]",
                  channel === c.value ? "border-[var(--green)] bg-[var(--green-soft)]" : "border-[var(--line-2)]",
                )}
              >
                <div className="text-[14px] font-semibold">{c.label}</div>
                <div className="text-xs text-[var(--stone)]">{c.description}</div>
              </button>
            ))}
          </div>

          <FormButton onClick={handleConfirm} disabled={submitting}>
            {submitting ? "Starting…" : `Pay ${fmtKES(payment.amount)}`}
          </FormButton>
        </>
      )}

      {stage === "polling" && (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full border-4 border-[var(--line)] border-t-[var(--green)] animate-spin mx-auto mb-5" />
          <h3 className="font-display font-bold text-xl mb-2">Processing payment</h3>
          <p className="text-[13px] text-[var(--stone)]">
            {channel === PaymentChannel.STK_PUSH ? "Check your phone for the M-Pesa prompt…" : "Confirm the payment in WhatsApp…"}
          </p>
        </div>
      )}

      {stage === "awaiting" && (
        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-full bg-[var(--paper)] border border-[var(--line)] flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth={1.8}>
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <path d="M9 18h6" />
            </svg>
          </div>
          <h3 className="font-display font-bold text-xl mb-2">Complete it on your phone</h3>
          <p className="text-[13px] text-[var(--stone)] mb-4">{instructionsFor(channel, payment)}</p>
          <div className="font-mono text-lg font-bold tracking-wide bg-[var(--paper)] border border-[var(--line)] rounded-[10px] py-3 mb-5">
            {fmtKES(payment.amount)}
          </div>
          <p className="text-xs text-[var(--stone)] mb-5">
            This will update on its own once we receive confirmation — you can close this and check Receipts later.
          </p>
          <FormButton variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </FormButton>
        </div>
      )}

      {stage === "success" && (
        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-full bg-[var(--green-soft)] flex items-center justify-center mx-auto mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--green-deep)" strokeWidth={2}>
              <path d="M4 12l5 5L20 6" />
            </svg>
          </div>
          <h3 className="font-display font-bold text-xl mb-2">Payment successful</h3>
          <p className="text-[13px] text-[var(--stone)] mb-6">
            {fmtKES(payment.amount)} paid via {selectedChannel.label}. Your receipt is ready in Receipts.
          </p>
          <FormButton onClick={() => onOpenChange(false)}>Done</FormButton>
        </div>
      )}

      {stage === "failed" && (
        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-full bg-[var(--error-bg)] flex items-center justify-center mx-auto mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth={2}>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </div>
          <h3 className="font-display font-bold text-xl mb-2">Payment failed</h3>
          <p className="text-[13px] text-[var(--stone)] mb-6">That didn&apos;t go through. No amount was deducted — you can try again.</p>
          <FormButton onClick={() => setStage("select")}>Try again</FormButton>
        </div>
      )}

      {stage === "timeout" && (
        <div className="text-center py-2">
          <h3 className="font-display font-bold text-xl mb-2">Still processing</h3>
          <p className="text-[13px] text-[var(--stone)] mb-6">
            This is taking longer than usual. Check back in Receipts shortly — it should resolve on its own.
          </p>
          <FormButton onClick={() => onOpenChange(false)}>Close</FormButton>
        </div>
      )}
    </Modal>
  );
}
