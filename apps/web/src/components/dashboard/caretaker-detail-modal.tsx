"use client";

import * as React from "react";
import { CaretakerInviteStatus } from "@makazi/shared-types";
import { getCaretakerDetail, type CaretakerDetail } from "@/lib/caretakers";
import { Modal } from "@/components/shared/modal";
import { StatusBadge } from "@/components/shared/status-badge";

const ASSIGNMENT_TONE: Record<CaretakerInviteStatus, "success" | "warning" | "neutral"> = {
  [CaretakerInviteStatus.ACCEPTED]: "success",
  [CaretakerInviteStatus.PENDING]: "warning",
  [CaretakerInviteStatus.DECLINED]: "neutral",
};

const ASSIGNMENT_LABEL: Record<CaretakerInviteStatus, string> = {
  [CaretakerInviteStatus.ACCEPTED]: "Active",
  [CaretakerInviteStatus.PENDING]: "Pending",
  [CaretakerInviteStatus.DECLINED]: "Declined",
};

export function CaretakerDetailModal({
  caretakerId,
  open,
  onOpenChange,
}: {
  caretakerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = React.useState<CaretakerDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setDetail(null);
      setError(null);
      getCaretakerDetail(caretakerId)
        .then(setDetail)
        .catch(() => setError("We couldn't load this caretaker's details. Please try again."));
    }
  }, [open, caretakerId]);

  return (
    <Modal open={open} onOpenChange={onOpenChange} maxWidth={460}>
      {error ? (
        <p className="text-[13px] text-[var(--stone)] py-6 text-center">{error}</p>
      ) : !detail ? (
        <p className="text-[13px] text-[var(--stone)] py-6 text-center">Loading…</p>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-full bg-[var(--green-soft)] flex items-center justify-center font-display font-bold text-[var(--green-deep)]">
              {detail.firstName[0]}
              {detail.lastName[0]}
            </div>
            <div>
              <h3 className="font-display font-bold text-lg leading-tight">
                {detail.firstName} {detail.lastName}
              </h3>
              <StatusBadge tone={detail.joined ? "success" : "warning"}>
                {detail.joined ? "Joined Makazi" : "Invite pending"}
              </StatusBadge>
            </div>
          </div>

          <div className="flex flex-col gap-[10px] text-[13px] border border-[var(--line)] rounded-[12px] p-4 mb-5">
            <div className="flex justify-between">
              <span className="text-[var(--stone)]">Phone</span>
              <span className="font-semibold">{detail.phone ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--stone)]">Email</span>
              <span className="font-semibold">{detail.email ?? "—"}</span>
            </div>
          </div>

          <div className="text-xs font-semibold text-[var(--stone)] uppercase tracking-wide mb-2">
            Properties they manage ({detail.assignments.length})
          </div>
          <div className="flex flex-col gap-2">
            {detail.assignments.map((a) => (
              <div key={a.id} className="flex justify-between items-center gap-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate">{a.property.name}</div>
                  <div className="text-xs text-[var(--stone)] truncate">
                    {a.property.location}
                    {a.property.county ? `, ${a.property.county}` : ""}
                  </div>
                </div>
                <StatusBadge tone={ASSIGNMENT_TONE[a.inviteStatus]}>{ASSIGNMENT_LABEL[a.inviteStatus]}</StatusBadge>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
