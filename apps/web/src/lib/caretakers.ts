import type { CaretakerInviteStatus } from "@makazi/shared-types";
import { apiFetch } from "./api";

export interface CaretakerInvite {
  id: string;
  caretakerId: string;
  propertyId: string;
  inviteStatus: CaretakerInviteStatus;
  invitedAt: string;
  acceptedAt: string | null;
  property: { id: string; name: string; location: string; county: string | null };
}

export interface CaretakerAssignmentListItem {
  id: string;
  caretakerId: string;
  propertyId: string;
  inviteStatus: CaretakerInviteStatus;
  invitedAt: string;
  acceptedAt: string | null;
  caretaker: { id: string; firstName: string; lastName: string; phone: string | null; email: string | null };
}

export interface InviteCaretakerInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

/** Invites someone to help manage a property — links an existing caretaker account if one matches, otherwise pre-creates one and emails a claim link (or returns it for manual relay if no email was given). */
export function inviteCaretaker(propertyId: string, input: InviteCaretakerInput) {
  return apiFetch<CaretakerAssignmentListItem & { inviteToken?: string }>(`/properties/${propertyId}/caretaker-invites`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listCaretakersForProperty(propertyId: string) {
  return apiFetch<CaretakerAssignmentListItem[]>(`/properties/${propertyId}/caretakers`);
}

/** Resends an expired/lost invite link for a caretaker who hasn't joined Makazi yet. */
export function resendCaretakerInvite(caretakerId: string) {
  return apiFetch<{ resent: boolean; inviteToken?: string }>(`/caretaker-invites/${caretakerId}/resend`, { method: "POST" });
}

export function listMyInvites() {
  return apiFetch<CaretakerInvite[]>("/caretaker/invites");
}

export function acceptInvite(id: string) {
  return apiFetch<CaretakerInvite>(`/caretaker/invites/${id}/accept`, { method: "POST" });
}

export function declineInvite(id: string) {
  return apiFetch<CaretakerInvite>(`/caretaker/invites/${id}/decline`, { method: "POST" });
}
