"use client";

import * as React from "react";
import { toast } from "sonner";
import { CaretakerInviteStatus } from "@makazi/shared-types";
import { listProperties } from "@/lib/properties";
import {
  listCaretakersForProperty,
  resendCaretakerInvite,
  revokeCaretaker,
  updateCaretakerContact,
  type CaretakerAssignmentListItem,
} from "@/lib/caretakers";
import { ApiError } from "@/lib/api";
import { FormButton } from "@/components/shared/form-button";
import { InviteCaretakerModal } from "@/components/dashboard/invite-caretaker-modal";
import { EditContactModal } from "@/components/dashboard/edit-contact-modal";
import { CaretakerDetailModal } from "@/components/dashboard/caretaker-detail-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { SkeletonList } from "@/components/shared/skeletons";

const STATUS_LABEL: Record<CaretakerInviteStatus, string> = {
  [CaretakerInviteStatus.PENDING]: "Pending",
  [CaretakerInviteStatus.ACCEPTED]: "Active",
  [CaretakerInviteStatus.DECLINED]: "Declined",
};

const STATUS_COLOR: Record<CaretakerInviteStatus, string> = {
  [CaretakerInviteStatus.PENDING]: "var(--warning)",
  [CaretakerInviteStatus.ACCEPTED]: "var(--green)",
  [CaretakerInviteStatus.DECLINED]: "var(--stone)",
};

interface Row extends CaretakerAssignmentListItem {
  propertyName: string;
}

export default function CaretakersPage() {
  const [properties, setProperties] = React.useState<{ id: string; name: string }[]>([]);
  const [rows, setRows] = React.useState<Row[] | null>(null);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<Row | null>(null);
  const [revokeRow, setRevokeRow] = React.useState<Row | null>(null);
  const [detailCaretakerId, setDetailCaretakerId] = React.useState<string | null>(null);

  const refetch = React.useCallback(async () => {
    const result = await listProperties({ page: 1, pageSize: 100 });
    const props = result.data.map((p) => ({ id: p.id, name: p.name }));
    setProperties(props);
    const perProperty = await Promise.all(
      props.map(async (p) => {
        const assignments = await listCaretakersForProperty(p.id);
        return assignments.map((a) => ({ ...a, propertyName: p.name }));
      }),
    );
    setRows(perProperty.flat());
  }, []);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  async function handleResend(caretakerId: string) {
    try {
      await resendCaretakerInvite(caretakerId);
      toast("Invitation resent.");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display font-bold text-[26px] tracking-[-0.02em] mb-1">Caretakers</h1>
          <p className="text-sm text-[var(--stone)]">Everyone helping manage your properties.</p>
        </div>
        <FormButton fullWidth={false} className="px-5" onClick={() => setInviteOpen(true)} disabled={properties.length === 0}>
          Invite caretaker
        </FormButton>
      </div>

      {!rows && <SkeletonList rows={4} />}

      {rows && rows.length === 0 && (
        <EmptyState
          icon={
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
              <path d="M14.7 3.3a4 4 0 0 0-5.4 5.4L3 15l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6z" />
            </svg>
          }
          title={properties.length === 0 ? "Add a property first" : "No caretakers invited yet"}
          description={
            properties.length === 0
              ? "Once you have a property, you can invite a caretaker to help manage it."
              : "Invite a caretaker to help manage day-to-day tasks on your properties."
          }
          action={
            properties.length > 0 ? (
              <FormButton fullWidth={false} className="px-5" onClick={() => setInviteOpen(true)}>
                Invite your first caretaker
              </FormButton>
            ) : undefined
          }
        />
      )}

      {rows && rows.length > 0 && (
        <div className="border border-[var(--line)] rounded-[14px] overflow-hidden">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)] last:border-b-0"
            >
              <div>
                <button
                  type="button"
                  onClick={() => setDetailCaretakerId(row.caretakerId)}
                  className="font-semibold text-[14px] text-left hover:text-[var(--green)]"
                >
                  {row.caretaker.firstName} {row.caretaker.lastName}
                </button>
                <div className="text-[13px] text-[var(--stone)]">
                  {row.propertyName} · {row.caretaker.phone ?? row.caretaker.email ?? "No contact on file"}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[12px] font-semibold" style={{ color: STATUS_COLOR[row.inviteStatus] }}>
                  {STATUS_LABEL[row.inviteStatus]}
                </span>
                <button
                  type="button"
                  onClick={() => setDetailCaretakerId(row.caretakerId)}
                  className="text-[13px] font-semibold text-[var(--green)]"
                >
                  Details
                </button>
                {row.inviteStatus === CaretakerInviteStatus.PENDING && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleResend(row.caretakerId)}
                      className="text-[13px] font-semibold text-[var(--green)]"
                    >
                      Resend invite
                    </button>
                    <button type="button" onClick={() => setEditRow(row)} className="text-[13px] font-semibold text-[var(--stone)]">
                      Edit
                    </button>
                  </>
                )}
                {row.inviteStatus !== CaretakerInviteStatus.DECLINED && (
                  <button type="button" onClick={() => setRevokeRow(row)} className="text-[13px] font-semibold text-[var(--error)]">
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <InviteCaretakerModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        properties={properties}
        onInvited={() => refetch()}
      />

      {editRow && (
        <EditContactModal
          open={Boolean(editRow)}
          onOpenChange={(open) => !open && setEditRow(null)}
          name={`${editRow.caretaker.firstName} ${editRow.caretaker.lastName}`}
          currentEmail={editRow.caretaker.email}
          currentPhone={editRow.caretaker.phone}
          onSubmit={(input) => updateCaretakerContact(editRow.caretakerId, input)}
          onUpdated={() => refetch()}
        />
      )}

      {detailCaretakerId && (
        <CaretakerDetailModal
          caretakerId={detailCaretakerId}
          open={Boolean(detailCaretakerId)}
          onOpenChange={(open) => !open && setDetailCaretakerId(null)}
        />
      )}

      {revokeRow && (
        <ConfirmDialog
          open={Boolean(revokeRow)}
          onOpenChange={(open) => !open && setRevokeRow(null)}
          title="Revoke access?"
          description={`${revokeRow.caretaker.firstName} ${revokeRow.caretaker.lastName} will lose access to ${revokeRow.propertyName}. Any other properties they help manage are unaffected.`}
          confirmLabel="Revoke access"
          onConfirm={async () => {
            await revokeCaretaker(revokeRow.propertyId, revokeRow.caretakerId);
            toast("Access revoked.");
            await refetch();
          }}
        />
      )}
    </div>
  );
}
