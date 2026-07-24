"use client";

import { useRouter } from "next/navigation";
import { FormButton } from "@/components/shared/form-button";

export default function SessionExpiredPage() {
  const router = useRouter();

  return (
    <div className="text-center py-4">
      <div
        className="w-14 h-14 rounded-[14px] flex items-center justify-center mx-auto mb-5"
        style={{ background: "var(--warning-bg)" }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth={1.8}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      </div>
      <h2 className="font-display font-bold text-2xl mb-[10px]">Your session has expired</h2>
      <p className="text-sm text-[var(--stone)] mb-[26px]">For your security, please log in again to continue.</p>
      <FormButton fullWidth={false} className="px-7" onClick={() => router.push("/login")}>
        Log in again
      </FormButton>
    </div>
  );
}
