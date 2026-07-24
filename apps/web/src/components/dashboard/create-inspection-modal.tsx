"use client";

import * as React from "react";
import { InspectionType } from "@makazi/shared-types";
import { ApiError } from "@/lib/api";
import { createInspection, presignInspectionPhoto } from "@/lib/inspections";
import { listProperties, listUnits, uploadFileDirect, type PropertyListItem, type Unit } from "@/lib/properties";
import { Modal } from "@/components/shared/modal";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";
import { cn } from "@/lib/utils";

const CHECKLIST_ITEMS = ["Walls", "Floors", "Doors & Windows", "Plumbing", "Electrical", "Kitchen", "Bathroom"];

const TYPE_OPTIONS: { value: InspectionType; label: string }[] = [
  { value: InspectionType.MOVE_IN, label: "Move-in" },
  { value: InspectionType.ROUTINE, label: "Routine" },
  { value: InspectionType.MOVE_OUT, label: "Move-out" },
];

export function CreateInspectionModal({
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
  const [type, setType] = React.useState<InspectionType>(InspectionType.ROUTINE);
  const [checklist, setChecklist] = React.useState<Record<string, "ok" | "damaged">>(
    Object.fromEntries(CHECKLIST_ITEMS.map((item) => [item, "ok"])) as Record<string, "ok" | "damaged">,
  );
  const [photoUrls, setPhotoUrls] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    setPropertyId("");
    setUnitId("");
    setUnits([]);
    setType(InspectionType.ROUTINE);
    setChecklist(Object.fromEntries(CHECKLIST_ITEMS.map((item) => [item, "ok"])) as Record<string, "ok" | "damaged">);
    setPhotoUrls([]);
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

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0 || !unitId) return;

    setUploading(true);
    setError(null);
    try {
      for (const file of files) {
        const { uploadUrl, publicUrl } = await presignInspectionPhoto(unitId, file.type);
        await uploadFileDirect(uploadUrl, file);
        setPhotoUrls((prev) => [...prev, publicUrl]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't upload one of those photos. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!unitId) {
      setError("Select a unit first.");
      return;
    }
    setSubmitting(true);
    try {
      await createInspection({ unitId, type, checklist, photoUrls });
      onCreated();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} maxWidth={520}>
      <h3 className="font-display font-bold text-xl mb-[6px]">New inspection</h3>
      <p className="text-[13px] text-[var(--stone)] mb-5">Walk through the unit and mark each item.</p>

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

        <div className="mb-[18px]">
          <label className="block text-[13px] font-semibold mb-[6px]">Inspection type</label>
          <div className="flex gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={cn(
                  "flex-1 rounded-[9px] py-[9px] text-[13px] font-semibold",
                  type === opt.value ? "bg-[var(--ink)] text-white" : "bg-transparent border-[1.5px] border-[var(--line-2)] text-[var(--ink)]",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-[18px]">
          <label className="block text-[13px] font-semibold mb-[8px]">Checklist</label>
          <div className="border border-[var(--line)] rounded-[12px] overflow-hidden">
            {CHECKLIST_ITEMS.map((item, i) => (
              <div
                key={item}
                className="flex items-center justify-between px-3 py-[10px]"
                style={i > 0 ? { borderTop: "1px solid var(--line)" } : undefined}
              >
                <span className="text-[13px]">{item}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setChecklist((prev) => ({ ...prev, [item]: "ok" }))}
                    className={cn(
                      "rounded-full px-[10px] py-[4px] text-xs font-semibold",
                      checklist[item] === "ok" ? "bg-[var(--green-soft)] text-[var(--green-deep)]" : "text-[var(--stone)]",
                    )}
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => setChecklist((prev) => ({ ...prev, [item]: "damaged" }))}
                    className={cn(
                      "rounded-full px-[10px] py-[4px] text-xs font-semibold",
                      checklist[item] === "damaged" ? "bg-[var(--error-bg)] text-[var(--error)]" : "text-[var(--stone)]",
                    )}
                  >
                    Damaged
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-[22px]">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-[13px] font-semibold">Photos</label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!unitId || uploading}
              className="border-[1.5px] border-[var(--line-2)] rounded-[9px] px-3 py-[6px] text-xs font-semibold disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Add photos"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFilesSelected}
              className="hidden"
            />
          </div>
          {photoUrls.length > 0 && (
            <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))" }}>
              {photoUrls.map((url) => (
                <div key={url} className="relative aspect-square rounded-[8px] overflow-hidden border border-[var(--line)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Inspection" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrls((prev) => prev.filter((u) => u !== url))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                    aria-label="Remove photo"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <FormButton type="submit" disabled={submitting || uploading}>
          {submitting ? "Saving…" : "Save inspection"}
        </FormButton>
      </form>
    </Modal>
  );
}
