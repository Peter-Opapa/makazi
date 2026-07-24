"use client";

import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { toast } from "sonner";
import { clearToken } from "@/lib/api";
import { clearAuthDraft } from "@/lib/auth";
import { FormButton } from "@/components/shared/form-button";

export default function LogoutConfirmPage() {
  const router = useRouter();
  const { signOut } = useClerk();

  async function handleConfirm() {
    clearToken();
    clearAuthDraft();
    toast("You've been logged out.");
    // No-ops harmlessly for Admin/staff, who never had a Clerk session.
    await signOut({ redirectUrl: "/login" });
  }

  return (
    <div className="text-center py-4">
      <h2 className="font-display font-bold text-2xl mb-[10px]">Log out of Makazi?</h2>
      <p className="text-sm text-[var(--stone)] mb-[26px]">You&apos;ll need to log in again to access your account.</p>
      <div className="flex gap-[10px]">
        <FormButton variant="outline" onClick={() => router.back()}>
          Cancel
        </FormButton>
        <FormButton variant="destructive" onClick={handleConfirm}>
          Log out
        </FormButton>
      </div>
    </div>
  );
}
