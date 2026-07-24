"use client";

import * as React from "react";
import { UserRole } from "@makazi/shared-types";
import { updateMe, presignMePhoto, confirmMePhoto } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";

/**
 * Shown once, right after a caretaker or tenant claims their invitation —
 * collects the handful of optional details the spec asks for progressively
 * rather than upfront. Reusable from a profile/settings page too, so
 * skipping here is never a dead end.
 */
export function ProfileExtrasForm({ role, onDone }: { role: UserRole; onDone: () => void }) {
  const [nationalId, setNationalId] = React.useState("");
  const [emergencyContactName, setEmergencyContactName] = React.useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = React.useState("");
  const [photo, setPhoto] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSave() {
    setError(null);
    setSubmitting(true);
    try {
      if (photo) {
        const { uploadUrl, key } = await presignMePhoto({ contentType: photo.type });
        const res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": photo.type }, body: photo });
        if (!res.ok) throw new Error("Photo upload failed");
        await confirmMePhoto({ key });
      }
      await updateMe({
        nationalId: nationalId.trim() || undefined,
        ...(role === UserRole.TENANT
          ? {
              emergencyContactName: emergencyContactName.trim() || undefined,
              emergencyContactPhone: emergencyContactPhone.trim() || undefined,
            }
          : {}),
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="font-display font-bold text-[26px] tracking-[-0.02em] mb-2">A few optional details</h2>
      <p className="text-sm text-[var(--stone)] mb-6">
        You can add these now or skip and fill them in later from your profile.
      </p>

      {error && <InlineError>{error}</InlineError>}

      <div className="mb-[18px]">
        <label className="block text-[13px] font-semibold mb-[6px]">National ID (optional)</label>
        <input
          type="text"
          value={nationalId}
          onChange={(e) => setNationalId(e.target.value)}
          className="w-full px-[14px] py-3 border-[1.5px] border-[var(--line-2)] rounded-[10px] focus:outline-2 focus:outline-[var(--green)] focus:outline-offset-1"
        />
      </div>

      <div className="mb-[18px]">
        <label className="block text-[13px] font-semibold mb-[6px]">Profile photo (optional)</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          className="w-full text-[13px]"
        />
      </div>

      {role === UserRole.TENANT && (
        <>
          <div className="mb-[18px]">
            <label className="block text-[13px] font-semibold mb-[6px]">Emergency contact name (optional)</label>
            <input
              type="text"
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
              className="w-full px-[14px] py-3 border-[1.5px] border-[var(--line-2)] rounded-[10px] focus:outline-2 focus:outline-[var(--green)] focus:outline-offset-1"
            />
          </div>
          <div className="mb-[22px]">
            <label className="block text-[13px] font-semibold mb-[6px]">Emergency contact phone (optional)</label>
            <input
              type="tel"
              value={emergencyContactPhone}
              onChange={(e) => setEmergencyContactPhone(e.target.value)}
              className="w-full px-[14px] py-3 border-[1.5px] border-[var(--line-2)] rounded-[10px] focus:outline-2 focus:outline-[var(--green)] focus:outline-offset-1"
            />
          </div>
        </>
      )}

      <div className="flex gap-[10px]">
        <FormButton variant="outline" onClick={onDone} disabled={submitting}>
          Skip for now
        </FormButton>
        <FormButton onClick={handleSave} disabled={submitting}>
          {submitting ? "Saving…" : "Save & continue"}
        </FormButton>
      </div>
    </div>
  );
}
