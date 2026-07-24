"use client";

import * as React from "react";
import { MaintenanceCategory, MaintenancePriority } from "@makazi/shared-types";
import { ApiError } from "@/lib/api";
import { createMaintenanceTicket, presignMaintenancePhoto } from "@/lib/maintenance";
import { uploadFileDirect } from "@/lib/properties";
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

export function TenantReportIssueModal({
  open,
  onOpenChange,
  unitId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId: string;
  onCreated: () => void;
}) {
  const [issue, setIssue] = React.useState("");
  const [category, setCategory] = React.useState<MaintenanceCategory | "">("");
  const [priority, setPriority] = React.useState<MaintenancePriority>(MaintenancePriority.NORMAL);
  const [photoUrls, setPhotoUrls] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    setIssue("");
    setCategory("");
    setPriority(MaintenancePriority.NORMAL);
    setPhotoUrls([]);
    setError(null);
  }, [open]);

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      for (const file of files) {
        const { uploadUrl, publicUrl } = await presignMaintenancePhoto(unitId, file.type);
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
    setSubmitting(true);
    try {
      await createMaintenanceTicket({ unitId, issue, category: category || undefined, priority, photoUrls });
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
      <p className="text-[13px] text-[var(--stone)] mb-5">Let your caretaker know what's wrong — add a photo if you can.</p>

      {error && <InlineError>{error}</InlineError>}

      <form onSubmit={handleSubmit}>
        <div className="mb-[14px]">
          <label className="block text-[13px] font-semibold mb-[6px]">What&apos;s the issue?</label>
          <textarea
            required
            rows={3}
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            placeholder="Describe the issue…"
            className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px] resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-[14px] mb-[18px]">
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

        <div className="mb-[22px]">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-[13px] font-semibold">Photos</label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
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
                  <img src={url} alt="Issue" className="w-full h-full object-cover" />
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
          {submitting ? "Submitting…" : "Submit ticket"}
        </FormButton>
      </form>
    </Modal>
  );
}
