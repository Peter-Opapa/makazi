"use client";

import * as React from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { inviteCaretaker } from "@/lib/caretakers";
import { Modal } from "@/components/shared/modal";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";

export function InviteCaretakerModal({
  open,
  onOpenChange,
  properties,
  onInvited,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: { id: string; name: string }[];
  onInvited: () => void;
}) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [inviteLink, setInviteLink] = React.useState<string | null>(null);
  const [attachedNames, setAttachedNames] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (open) {
      // A single property has no real choice to make — preselect it. With
      // more than one, force an explicit pick so it's never ambiguous which
      // plot(s) the caretaker is actually being attached to.
      setSelectedIds(properties.length === 1 ? [properties[0].id] : []);
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      setError(null);
      setInviteLink(null);
      setAttachedNames([]);
    }
  }, [open, properties]);

  function toggleProperty(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (selectedIds.length === 0) {
      setError("Select at least one property to attach this caretaker to.");
      return;
    }
    setSubmitting(true);
    try {
      // One CaretakerAssignment per selected property. The backend already
      // dedupes correctly whether this is a brand-new caretaker (first call
      // creates the account + sends the invite email; later calls just add
      // another assignment to the same pending account) or an existing one
      // (each call adds its own pending assignment for that caretaker to accept).
      let lastInviteToken: string | undefined;
      const failures: string[] = [];
      for (const propertyId of selectedIds) {
        const propertyName = properties.find((p) => p.id === propertyId)?.name ?? propertyId;
        try {
          const result = await inviteCaretaker(propertyId, { firstName, lastName, phone, email: email || undefined });
          if (result.inviteToken) lastInviteToken = result.inviteToken;
        } catch (err) {
          failures.push(`${propertyName}: ${err instanceof ApiError ? err.message : "failed"}`);
        }
      }

      const attached = selectedIds
        .map((id) => properties.find((p) => p.id === id)?.name)
        .filter((n): n is string => Boolean(n));

      if (failures.length === selectedIds.length) {
        setError(failures.join(" "));
        return;
      }
      if (failures.length > 0) {
        toast(`Invited for some properties, but not all: ${failures.join(" ")}`);
      }

      if (lastInviteToken) {
        setAttachedNames(attached);
        setInviteLink(`${window.location.origin}/invitations/caretaker?token=${lastInviteToken}`);
      } else {
        toast(failures.length ? "Invitation sent for the properties that succeeded." : "Invitation sent.");
        onInvited();
        onOpenChange(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleDoneAfterLinkReveal() {
    onInvited();
    onOpenChange(false);
  }

  if (inviteLink) {
    return (
      <Modal open={open} onOpenChange={onOpenChange} maxWidth={460}>
        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-full bg-[var(--green-soft)] flex items-center justify-center mx-auto mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--green-deep)" strokeWidth={2}>
              <path d="M4 12l5 5L20 6" />
            </svg>
          </div>
          <h3 className="font-display font-bold text-xl mb-2">Invitation created</h3>
          <p className="text-[13px] text-[var(--stone)] mb-1">
            Attached to: <span className="font-semibold text-[var(--ink)]">{attachedNames.join(", ")}</span>
          </p>
          <p className="text-[13px] text-[var(--stone)] mb-5">
            {firstName} has no email on file, so share this link with them directly — it won&apos;t be shown again.
          </p>
          <div className="font-mono text-[13px] break-all bg-[var(--paper)] border border-[var(--line)] rounded-[12px] p-4 mb-6">
            {inviteLink}
          </div>
          <FormButton onClick={handleDoneAfterLinkReveal}>Done</FormButton>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} maxWidth={460}>
      <h3 className="font-display font-bold text-xl mb-[6px]">Invite a caretaker</h3>
      <p className="text-[13px] text-[var(--stone)] mb-5">
        They'll join Makazi to manage the propert{selectedIds.length === 1 ? "y" : "ies"} you attach below — no
        property setup or payment access on their side.
      </p>

      {error && <InlineError>{error}</InlineError>}

      <form onSubmit={handleSubmit}>
        <div className="mb-[18px]">
          <label className="block text-[13px] font-semibold mb-[8px]">
            Propert{properties.length === 1 ? "y" : "ies"} to attach
          </label>
          <div className="border-[1.5px] border-[var(--line-2)] rounded-[9px] divide-y divide-[var(--line)] max-h-[160px] overflow-y-auto">
            {properties.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-[10px] px-[13px] py-[10px] text-[13px] cursor-pointer hover:bg-[var(--paper)]"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(p.id)}
                  onChange={() => toggleProperty(p.id)}
                  className="accent-[var(--green)]"
                />
                <span className="font-medium">{p.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-[14px] mb-[14px]">
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">First name</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">Last name</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-[14px] mb-[22px]">
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">Phone</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+254 7XX XXX XXX"
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">
              Email <span className="text-[var(--stone)] font-normal">(optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
            />
          </div>
        </div>

        <FormButton type="submit" disabled={submitting}>
          {submitting ? "Inviting…" : "Send invitation"}
        </FormButton>
      </form>
    </Modal>
  );
}
