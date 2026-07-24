"use client";

import * as React from "react";
import { ApiError } from "@/lib/api";
import { Modal } from "@/components/shared/modal";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";

export function BulkGenerateUnitsModal({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: { totalUnits: number; floors: number; defaultRentAmount?: number }) => Promise<void>;
}) {
  const [totalUnits, setTotalUnits] = React.useState("12");
  const [floors, setFloors] = React.useState("4");
  const [defaultRentAmount, setDefaultRentAmount] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) setError(null);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        totalUnits: Number(totalUnits),
        floors: Number(floors),
        defaultRentAmount: defaultRentAmount ? Number(defaultRentAmount) : undefined,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} maxWidth={400}>
      <h3 className="font-display font-bold text-xl mb-[6px]">Generate units</h3>
      <p className="text-[13px] text-[var(--stone)] mb-5">
        Units are distributed evenly across floors, coded as floor-sequence (e.g. 1-01, 1-02, 2-01…).
      </p>
      {error && <InlineError icon={false}>{error}</InlineError>}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-[14px] mb-[14px]">
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">Total units</label>
            <input
              type="number"
              required
              min={1}
              value={totalUnits}
              onChange={(e) => setTotalUnits(e.target.value)}
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">Floors</label>
            <input
              type="number"
              required
              min={1}
              value={floors}
              onChange={(e) => setFloors(e.target.value)}
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
            />
          </div>
        </div>
        <div className="mb-[22px]">
          <label className="block text-[13px] font-semibold mb-[6px]">Default rent (KES, optional)</label>
          <input
            type="number"
            value={defaultRentAmount}
            onChange={(e) => setDefaultRentAmount(e.target.value)}
            placeholder="15000"
            className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
          />
        </div>
        <FormButton type="submit" disabled={submitting}>
          {submitting ? "Generating…" : "Generate units"}
        </FormButton>
      </form>
    </Modal>
  );
}
