"use client";

import * as React from "react";
import { MaintenanceCategory, MaintenancePriority } from "@makazi/shared-types";
import { ApiError } from "@/lib/api";
import { createMaintenanceTicket } from "@/lib/maintenance";
import { listProperties, listUnits, type PropertyListItem, type Unit } from "@/lib/properties";
import { maintenanceCategoryLabel } from "@/lib/format";
import { Modal } from "@/components/shared/modal";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";

const PRIORITY_OPTIONS: { value: MaintenancePriority; label: string }[] = [
  { value: MaintenancePriority.LOW, label: "Low" },
  { value: MaintenancePriority.NORMAL, label: "Normal" },
  { value: MaintenancePriority.URGENT, label: "Urgent" },
];

const CATEGORY_OPTIONS = Object.values(MaintenanceCategory);

export function ReportIssueModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [properties, setProperties] = React.useState<PropertyListItem[]>([]);
  const [units, setUnits] = React.useState<Unit[]>([]);
  const [propertyId, setPropertyId] = React.useState("");
  const [unitId, setUnitId] = React.useState("");
  const [issue, setIssue] = React.useState("");
  const [category, setCategory] = React.useState<MaintenanceCategory | "">("");
  const [priority, setPriority] = React.useState<MaintenancePriority>(MaintenancePriority.NORMAL);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setPropertyId("");
    setUnitId("");
    setUnits([]);
    setIssue("");
    setCategory("");
    setPriority(MaintenancePriority.NORMAL);
    setError(null);
    listProperties({ pageSize: 100 }).then((res) => setProperties(res.data));
  }, [open]);

  React.useEffect(() => {
    if (!propertyId) {
      setUnits([]);
      return;
    }
    setUnitId("");
    listUnits(propertyId).then(setUnits);
  }, [propertyId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!unitId) {
      setError("Select a unit first.");
      return;
    }
    setSubmitting(true);
    try {
      await createMaintenanceTicket({ unitId, issue, category: category || undefined, priority });
      onCreated();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} maxWidth={460}>
      <h3 className="font-display font-bold text-xl mb-[6px]">Report an issue</h3>
      <p className="text-[13px] text-[var(--stone)] mb-5">File a maintenance ticket for a unit on one of your properties.</p>

      {error && <InlineError>{error}</InlineError>}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-[14px] mb-[14px]">
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">Property</label>
            <select
              required
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px] bg-white"
            >
              <option value="">Select…</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">Unit</label>
            <select
              required
              disabled={!propertyId}
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px] bg-white disabled:opacity-50"
            >
              <option value="">Select…</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-[14px]">
          <label className="block text-[13px] font-semibold mb-[6px]">Issue</label>
          <textarea
            required
            rows={3}
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            placeholder="Describe the issue…"
            className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px] resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-[14px] mb-[22px]">
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">
              Category <span className="text-[var(--stone)] font-normal">(optional)</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MaintenanceCategory | "")}
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px] bg-white"
            >
              <option value="">Select…</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {maintenanceCategoryLabel(c)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as MaintenancePriority)}
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px] bg-white"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <FormButton type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit ticket"}
        </FormButton>
      </form>
    </Modal>
  );
}
