"use client";

import { useRouter } from "next/navigation";
import { clearAuthDraft } from "@/lib/auth";
import { FormButton } from "@/components/shared/form-button";

export default function ResetSuccessPage() {
  const router = useRouter();

  function handleBackToLogin() {
    clearAuthDraft();
    router.push("/login");
  }

  return (
    <div className="text-center py-5">
      <div className="w-16 h-16 rounded-full bg-[var(--green-soft)] flex items-center justify-center mx-auto mb-[22px]">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--green-deep)" strokeWidth={2}>
          <path d="M4 12l5 5L20 6" />
        </svg>
      </div>
      <h2 className="font-display font-bold text-2xl mb-[10px]">Password updated</h2>
      <p className="text-sm text-[var(--stone)] mb-[26px]">You can now log in with your new password.</p>
      <FormButton fullWidth={false} onClick={handleBackToLogin} className="px-7">
        Back to log in
      </FormButton>
    </div>
  );
}
