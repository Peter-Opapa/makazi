import { AdminSubRole, UserRole } from "@makazi/shared-types";
import { apiFetch } from "./api";

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  adminSubRole: AdminSubRole | null;
  emailVerifiedAt: string | null;
  nationalId: string | null;
  profilePhotoUrl: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}

export interface AuthResult {
  accessToken: string;
  user: AuthUser;
}

export function getMe() {
  return apiFetch<AuthUser>("/auth/me");
}

export interface UpdateMeInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  nationalId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export function updateMe(input: UpdateMeInput) {
  return apiFetch<AuthUser>("/auth/me", { method: "PATCH", body: JSON.stringify(input) });
}

export function presignMePhoto(input: { contentType: string }) {
  return apiFetch<{ uploadUrl: string; key: string; publicUrl: string }>("/auth/me/photo/presign", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function confirmMePhoto(input: { key: string }) {
  return apiFetch<AuthUser>("/auth/me/photo", { method: "POST", body: JSON.stringify(input) });
}

/** Re-reads the live Clerk identity and mirrors its email into Makazi's own record — call after the user manages their email via Clerk's own account UI. */
export function syncEmailFromClerk() {
  return apiFetch<AuthUser>("/auth/me/sync-email", { method: "POST" });
}

// ---------- Forgot / reset password (Admin/staff only — Landlord/Caretaker/Tenant use their Makazi account's own reset flow) ----------

export function forgotPassword(input: { email: string }) {
  return apiFetch<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function verifyResetOtp(input: { email: string; code: string }) {
  return apiFetch<{ valid: true }>("/auth/forgot-password/verify-otp", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function resetPassword(input: { email: string; code: string; newPassword: string }) {
  return apiFetch<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ---------- Staff (Admin) login — a separate, untouched system ----------

export function staffLogin(input: { email: string; password: string }) {
  return apiFetch<{ mfaRequired: true }>("/auth/staff-login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function verifyStaffMfa(input: { email: string; password: string; code: string }) {
  return apiFetch<AuthResult>("/auth/staff-login/verify-mfa", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ---------- Landlord sign-up / Caretaker & Tenant sign-in (Clerk under the hood — never surfaced to the user) ----------

export interface ClerkProfileStatus {
  exists: boolean;
  user?: AuthUser;
  /** Only present when exists=false — the raw Clerk identity, so /finish-profile can prefill instead of asking from scratch. */
  identity?: { firstName: string; lastName: string; email: string | null };
}

/** Right after sign-in: does a Makazi account already exist for this identity, or do we still need to finish setting it up? */
export function getClerkProfileStatus() {
  return apiFetch<ClerkProfileStatus>("/auth/clerk/me");
}

/** First-ever sign-in after a landlord signs up — creates their Makazi account. Landlord-only; Caretaker/Tenant accounts are always pre-created by an invitation instead. */
export function completeClerkProfile(input: { phone: string; firstName?: string; lastName?: string }) {
  return apiFetch<AuthUser>("/auth/clerk/complete-profile", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ---------- Tenant invitation claim (tenant pre-created by a landlord/caretaker via Assign Tenant) ----------

export interface TenantCodePreview {
  firstName: string;
  lastName: string;
  unit: { code: string; rentAmount: string; property: { name: string; location: string } } | null;
}

export function verifyTenantCode(input: { tenantCode: string }) {
  return apiFetch<TenantCodePreview>("/auth/claim-tenant/verify", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** Links the signed-in identity to a pre-existing, unclaimed tenant row — preserves the original User.id/Tenancy links. */
export function claimTenantWithClerk(input: { tenantCode: string }) {
  return apiFetch<AuthUser>("/auth/clerk/claim-tenant", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ---------- Caretaker invitation claim (caretaker pre-created by a landlord via Invite Caretaker) ----------

export interface CaretakerInvitePreview {
  firstName: string;
  lastName: string;
  landlordName: string | null;
  properties: { id: string; name: string }[];
}

export function verifyCaretakerInvite(input: { token: string }) {
  return apiFetch<CaretakerInvitePreview>("/auth/caretaker-invite/verify", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** Links the signed-in identity to a pre-existing, unclaimed caretaker row and accepts their pending property assignments. */
export function claimCaretakerInviteWithClerk(input: { token: string }) {
  return apiFetch<AuthUser>("/auth/clerk/claim-caretaker-invite", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ---------- Role -> destination ----------

export const roleDashboardPath: Record<UserRole, string> = {
  [UserRole.LANDLORD]: "/landlord",
  [UserRole.CARETAKER]: "/caretaker",
  [UserRole.TENANT]: "/tenant",
  [UserRole.ADMIN]: "/admin",
};

// ---------- Cross-screen draft — the role picked on the Sign In screen (UX only, never trusted for authorization) and Admin's own forgot-password flow ----------

const DRAFT_KEY = "makazi_auth_draft";

export interface AuthDraft {
  role?: UserRole;
  forgotEmail?: string;
  forgotCode?: string;
}

export function getAuthDraft(): AuthDraft {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(DRAFT_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function updateAuthDraft(patch: Partial<AuthDraft>) {
  const next = { ...getAuthDraft(), ...patch };
  window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next));
  return next;
}

export function clearAuthDraft() {
  window.sessionStorage.removeItem(DRAFT_KEY);
}
