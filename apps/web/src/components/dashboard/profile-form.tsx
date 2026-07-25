"use client";

import * as React from "react";
import { toast } from "sonner";
import { useClerk, useUser } from "@clerk/nextjs";
import { UserRole } from "@makazi/shared-types";
import { updateMe, presignMePhoto, confirmMePhoto, syncEmailFromClerk, type AuthUser } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";
import { Field, Input } from "@/components/shared/field";
import { DeleteAccountSection } from "@/components/dashboard/delete-account-section";

/**
 * Shared profile editor for Landlord/Caretaker/Tenant. Name/phone/photo/
 * national ID/emergency contact are Makazi's own data (see the auth
 * architecture's data-ownership split) and are edited right here. Email is
 * Clerk's — shown read-only, changed via Clerk's own account UI (opened via
 * "Manage login email"), then mirrored back into Makazi's record
 * automatically once Clerk's client-side state reflects the change.
 */
export function ProfileForm({ user, role, onUpdated }: { user: AuthUser; role: UserRole; onUpdated: (user: AuthUser) => void }) {
  const { openUserProfile } = useClerk();
  const { user: clerkUser } = useUser();

  const [firstName, setFirstName] = React.useState(user.firstName);
  const [lastName, setLastName] = React.useState(user.lastName);
  const [phone, setPhone] = React.useState(user.phone ?? "");
  const [nationalId, setNationalId] = React.useState(user.nationalId ?? "");
  const [emergencyContactName, setEmergencyContactName] = React.useState(user.emergencyContactName ?? "");
  const [emergencyContactPhone, setEmergencyContactPhone] = React.useState(user.emergencyContactPhone ?? "");
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(user.profilePhotoUrl);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Clerk's client-side user state updates immediately once the account
  // modal saves a new email — pick that up and mirror it into Makazi's
  // record without the user having to do anything else.
  React.useEffect(() => {
    const liveEmail = clerkUser?.primaryEmailAddress?.emailAddress;
    if (liveEmail && liveEmail !== user.email) {
      syncEmailFromClerk()
        .then(onUpdated)
        .catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clerkUser?.primaryEmailAddress?.emailAddress]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (photoFile) {
        const { uploadUrl, key } = await presignMePhoto({ contentType: photoFile.type });
        const res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": photoFile.type }, body: photoFile });
        if (!res.ok) throw new Error("Photo upload failed");
        await confirmMePhoto({ key });
      }
      const updated = await updateMe({
        firstName,
        lastName,
        phone: phone || undefined,
        nationalId: nationalId || undefined,
        ...(role === UserRole.TENANT
          ? {
              emergencyContactName: emergencyContactName || undefined,
              emergencyContactPhone: emergencyContactPhone || undefined,
            }
          : {}),
      });
      onUpdated(updated);
      setPhotoFile(null);
      toast("Profile updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="border border-[var(--line)] rounded-2xl bg-white p-5 max-w-[520px]">
      {error && <InlineError>{error}</InlineError>}
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-4 mb-[22px]">
          <div
            className="w-16 h-16 rounded-full bg-[var(--green-soft)] flex items-center justify-center text-lg font-semibold text-[var(--green-deep)] shrink-0 overflow-hidden bg-cover bg-center"
            style={photoPreview ? { backgroundImage: `url(${photoPreview})` } : undefined}
          >
            {!photoPreview && initials}
          </div>
          <div>
            <label className="inline-block text-[13px] font-semibold text-[var(--green)] cursor-pointer">
              Change photo
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handlePhotoChange} className="hidden" />
            </label>
            <p className="text-xs text-[var(--stone)] mt-1">JPG, PNG, WebP or GIF.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-[14px] mb-[14px]">
          <Field label="First name" required>
            <Input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </Field>
          <Field label="Last name" required>
            <Input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Field>
        </div>

        <Field label="Phone" required className="mb-[14px]">
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" />
        </Field>

        <Field label="National ID" className="mb-[14px]">
          <Input type="text" value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
        </Field>

        {role === UserRole.TENANT && (
          <div className="grid grid-cols-2 gap-[14px] mb-[14px]">
            <Field label="Emergency contact name">
              <Input type="text" value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} />
            </Field>
            <Field label="Emergency contact phone">
              <Input type="tel" value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} />
            </Field>
          </div>
        )}

        <div className="mb-[22px]">
          <label className="block text-[13px] font-semibold mb-[6px]">Email</label>
          <div className="flex items-center gap-[10px]">
            <input
              type="email"
              disabled
              value={user.email ?? "—"}
              className="flex-1 px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px] bg-[var(--paper)] text-[var(--stone)]"
            />
            <button
              type="button"
              onClick={() => openUserProfile()}
              className="shrink-0 text-[13px] font-semibold text-[var(--green)] whitespace-nowrap"
            >
              Manage login email
            </button>
          </div>
          <p className="text-xs text-[var(--stone)] mt-[8px]">
            Your email is part of your Makazi login, so it's changed from your account security settings, not here.
          </p>
        </div>

        <FormButton type="submit" fullWidth={false} disabled={submitting} className="px-5">
          {submitting ? "Saving…" : "Save changes"}
        </FormButton>
      </form>

      <DeleteAccountSection />
    </div>
  );
}
