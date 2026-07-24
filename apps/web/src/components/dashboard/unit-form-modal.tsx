"use client";

import * as React from "react";
import { UnitStatus } from "@makazi/shared-types";
import { ApiError } from "@/lib/api";
import type { UnitInput } from "@/lib/properties";
import { unitStatusLabel } from "@/lib/format";
import { Modal } from "@/components/shared/modal";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";

export function UnitFormModal({
  open,
  onOpenChange,
  mode,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initial?: UnitInput;
  onSubmit: (input: UnitInput) => Promise<void>;
}) {
  const [code, setCode] = React.useState(initial?.code ?? "");
  const [floor, setFloor] = React.useState(initial?.floor?.toString() ?? "");
  const [rentAmount, setRentAmount] = React.useState(initial?.rentAmount?.toString() ?? "");
  const [status, setStatus] = React.useState<UnitStatus>(initial?.status ?? UnitStatus.VACANT);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setCode(initial?.code ?? "");
      setFloor(initial?.floor?.toString() ?? "");
      setRentAmount(initial?.rentAmount?.toString() ?? "");
      setStatus(initial?.status ?? UnitStatus.VACANT);
      setError(null);
    }
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        code,
        floor: floor ? Number(floor) : undefined,
        rentAmount: rentAmount ? Number(rentAmount) : undefined,
        status,
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
      <h3 className="font-display font-bold text-xl mb-[18px]">{mode === "create" ? "Add unit" : "Edit unit"}</h3>
      {error && <InlineError icon={false}>{error}</InlineError>}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-[14px] mb-[14px]">
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">Unit code</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="1-01"
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">Floor</label>
            <input
              type="number"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="1"
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-[14px] mb-[22px]">
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">Rent (KES)</label>
            <input
              type="number"
              value={rentAmount}
              onChange={(e) => setRentAmount(e.target.value)}
              placeholder="15000"
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as UnitStatus)}
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
            >
              {Object.values(UnitStatus).map((s) => (
                <option key={s} value={s}>
                  {unitStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <FormButton type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save unit"}
        </FormButton>
      </form>
    </Modal>
  );
}
