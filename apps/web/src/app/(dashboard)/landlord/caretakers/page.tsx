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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

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

      {rows && rows.length === 0 && (
        <div className="text-center py-16 border border-dashed border-[var(--line-2)] rounded-[16px]">
          <p className="text-sm text-[var(--stone)] mb-4">
            {properties.length === 0 ? "Add a property first, then invite a caretaker to help manage it." : "No caretakers invited yet."}
          </p>
          {properties.length > 0 && (
            <FormButton fullWidth={false} className="px-5" onClick={() => setInviteOpen(true)}>
              Invite your first caretaker
            </FormButton>
          )}
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="border border-[var(--line)] rounded-[14px] overflow-hidden">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)] last:border-b-0"
            >
              <div>
                <div className="font-semibold text-[14px]">
                  {row.caretaker.firstName} {row.caretaker.lastName}
                </div>
                <div className="text-[13px] text-[var(--stone)]">
                  {row.propertyName} · {row.caretaker.phone ?? row.caretaker.email ?? "No contact on file"}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[12px] font-semibold" style={{ color: STATUS_COLOR[row.inviteStatus] }}>
                  {STATUS_LABEL[row.inviteStatus]}
                </span>
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
