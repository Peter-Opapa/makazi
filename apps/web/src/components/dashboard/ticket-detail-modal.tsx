"use client";

import * as React from "react";
import { MaintenanceCategory, MaintenanceStatus } from "@makazi/shared-types";
import { ApiError } from "@/lib/api";
import {
  addMaintenanceComment,
  assignTechnician,
  getMaintenanceTicket,
  listMaintenanceActivities,
  updateMaintenanceStatus,
  type MaintenanceActivityItem,
  type MaintenanceTicket,
} from "@/lib/maintenance";
import { createTechnician, listTechnicians, type Technician } from "@/lib/technicians";
import {
  maintenanceCategoryLabel,
  maintenancePriorityTone,
  maintenanceStatusLabel,
  maintenanceStatusTone,
} from "@/lib/format";
import { timeAgo } from "@/lib/utils";
import { Modal } from "@/components/shared/modal";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";
import { StatusBadge } from "@/components/shared/status-badge";

const STATUS_OPTIONS = Object.values(MaintenanceStatus);
const SPECIALTY_OPTIONS = Object.values(MaintenanceCategory);

function activityDescription(activity: MaintenanceActivityItem): string {
  const who = `${activity.actor.firstName} ${activity.actor.lastName}`;
  switch (activity.type) {
    case "CREATED":
      return `${who} reported this issue`;
    case "STATUS_CHANGED": {
      const to = (activity.metadata?.to as string | undefined) ?? "";
      return `${who} changed status to ${maintenanceStatusLabel(to as MaintenanceStatus)}`;
    }
    case "TECHNICIAN_ASSIGNED": {
      const name = (activity.metadata?.technicianName as string | undefined) ?? "a technician";
      return `${who} assigned ${name}`;
    }
    default:
      return who;
  }
}

export function TicketDetailModal({
  open,
  onOpenChange,
  ticketId,
  canManage,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  /** Landlord/caretaker: can change status, assign a technician, add resolution notes. Tenant: read-only except comments. */
  canManage: boolean;
  onChanged?: () => void;
}) {
  const [ticket, setTicket] = React.useState<MaintenanceTicket | null>(null);
  const [activities, setActivities] = React.useState<MaintenanceActivityItem[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [statusDraft, setStatusDraft] = React.useState<MaintenanceStatus>(MaintenanceStatus.REPORTED);
  const [resolutionNotes, setResolutionNotes] = React.useState("");
  const [savingStatus, setSavingStatus] = React.useState(false);

  const [assigning, setAssigning] = React.useState(false);
  const [technicians, setTechnicians] = React.useState<Technician[]>([]);
  const [selectedTechId, setSelectedTechId] = React.useState("");
  const [newTechName, setNewTechName] = React.useState("");
  const [newTechPhone, setNewTechPhone] = React.useState("");
  const [newTechSpecialty, setNewTechSpecialty] = React.useState<MaintenanceCategory | "">("");
  const [savingTechnician, setSavingTechnician] = React.useState(false);

  const [commentBody, setCommentBody] = React.useState("");
  const [postingComment, setPostingComment] = React.useState(false);

  const refetch = React.useCallback(async () => {
    const [t, a] = await Promise.all([getMaintenanceTicket(ticketId), listMaintenanceActivities(ticketId)]);
    setTicket(t);
    setActivities(a);
    setStatusDraft(t.status);
    setResolutionNotes(t.resolutionNotes ?? "");
    onChanged?.();
  }, [ticketId, onChanged]);

  React.useEffect(() => {
    if (open) {
      setError(null);
      setAssigning(false);
      setCommentBody("");
      refetch();
    }
  }, [open, refetch]);

  async function handleSaveStatus() {
    setError(null);
    setSavingStatus(true);
    try {
      await updateMaintenanceStatus(ticketId, {
        status: statusDraft,
        resolutionNotes: resolutionNotes || undefined,
      });
      await refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSavingStatus(false);
    }
  }

  function openAssignPanel() {
    setSelectedTechId("");
    setNewTechName("");
    setNewTechPhone("");
    setNewTechSpecialty("");
    setAssigning(true);
    listTechnicians().then(setTechnicians);
  }

  async function handleAssignTechnician() {
    if (!ticket) return;
    setError(null);
    setSavingTechnician(true);
    try {
      let technicianId = selectedTechId;
      if (!technicianId) {
        if (!newTechName || !newTechPhone) {
          setError("Enter a name and phone number, or pick an existing technician.");
          setSavingTechnician(false);
          return;
        }
        const created = await createTechnician({
          name: newTechName,
          phone: newTechPhone,
          specialty: newTechSpecialty || undefined,
          propertyId: ticket.unit.propertyId,
        });
        technicianId = created.id;
      }
      await assignTechnician(ticketId, technicianId);
      setAssigning(false);
      await refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSavingTechnician(false);
    }
  }

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setError(null);
    setPostingComment(true);
    try {
      await addMaintenanceComment(ticketId, commentBody.trim());
      setCommentBody("");
      await refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setPostingComment(false);
    }
  }

  if (!ticket || !activities) return null;

  return (
    <Modal open={open} onOpenChange={onOpenChange} maxWidth={640}>
      <div className="flex justify-between items-start gap-2 mb-1">
        <h3 className="font-display font-bold text-xl">{ticket.ticketNumber}</h3>
        <div className="flex gap-2">
          <StatusBadge tone={maintenancePriorityTone(ticket.priority)}>{ticket.priority}</StatusBadge>
          <StatusBadge tone={maintenanceStatusTone(ticket.status)}>{maintenanceStatusLabel(ticket.status)}</StatusBadge>
        </div>
      </div>
      <p className="text-[13px] mb-1">{ticket.issue}</p>
      <p className="text-xs text-[var(--stone)] mb-5">
        {ticket.unit.property.name} · <span className="font-mono">{ticket.unit.code}</span>
        {ticket.category ? ` · ${maintenanceCategoryLabel(ticket.category)}` : ""} · reported by {ticket.reportedBy.firstName}{" "}
        {ticket.reportedBy.lastName}
      </p>

      {error && <InlineError>{error}</InlineError>}

      {ticket.photoUrls.length > 0 && (
        <div className="grid gap-2 mb-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))" }}>
          {ticket.photoUrls.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="aspect-square rounded-[8px] overflow-hidden border border-[var(--line)] block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Issue" className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      )}

      <div className="border border-[var(--line)] rounded-[12px] p-4 mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-[var(--stone)] uppercase tracking-wide">Technician</span>
          {canManage && !assigning && (
            <button type="button" onClick={openAssignPanel} className="text-xs font-semibold text-[var(--green-deep)]">
              {ticket.technician ? "Reassign" : "Assign"}
            </button>
          )}
        </div>

        {!assigning && (
          <p className="text-[13px]">
            {ticket.technician ? `${ticket.technician.name} · ${ticket.technician.phone}` : "Not assigned yet"}
          </p>
        )}

        {assigning && (
          <div className="flex flex-col gap-3">
            <select
              value={selectedTechId}
              onChange={(e) => setSelectedTechId(e.target.value)}
              className="w-full px-3 py-[9px] border-[1.5px] border-[var(--line-2)] rounded-[9px] bg-white text-[13px]"
            >
              <option value="">+ New technician</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.phone}
                </option>
              ))}
            </select>

            {!selectedTechId && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newTechName}
                  onChange={(e) => setNewTechName(e.target.value)}
                  placeholder="Name"
                  className="px-3 py-[9px] border-[1.5px] border-[var(--line-2)] rounded-[9px] text-[13px]"
                />
                <input
                  type="tel"
                  value={newTechPhone}
                  onChange={(e) => setNewTechPhone(e.target.value)}
                  placeholder="Phone"
                  className="px-3 py-[9px] border-[1.5px] border-[var(--line-2)] rounded-[9px] text-[13px]"
                />
                <select
                  value={newTechSpecialty}
                  onChange={(e) => setNewTechSpecialty(e.target.value as MaintenanceCategory | "")}
                  className="col-span-2 px-3 py-[9px] border-[1.5px] border-[var(--line-2)] rounded-[9px] bg-white text-[13px]"
                >
                  <option value="">Specialty (optional)</option>
                  {SPECIALTY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {maintenanceCategoryLabel(c)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-2">
              <FormButton variant="outline" onClick={() => setAssigning(false)} disabled={savingTechnician}>
                Cancel
              </FormButton>
              <FormButton onClick={handleAssignTechnician} disabled={savingTechnician}>
                {savingTechnician ? "Saving…" : "Assign"}
              </FormButton>
            </div>
          </div>
        )}
      </div>

      {canManage && (
        <div className="border border-[var(--line)] rounded-[12px] p-4 mb-5">
          <span className="text-xs font-semibold text-[var(--stone)] uppercase tracking-wide block mb-3">Status</span>
          <select
            value={statusDraft}
            onChange={(e) => setStatusDraft(e.target.value as MaintenanceStatus)}
            className="w-full px-3 py-[9px] border-[1.5px] border-[var(--line-2)] rounded-[9px] bg-white text-[13px] mb-3"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {maintenanceStatusLabel(s)}
              </option>
            ))}
          </select>
          {(statusDraft === MaintenanceStatus.COMPLETED || ticket.resolutionNotes) && (
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="What was done to resolve this?"
              rows={2}
              className="w-full px-3 py-[9px] border-[1.5px] border-[var(--line-2)] rounded-[9px] text-[13px] resize-none mb-3"
            />
          )}
          <FormButton fullWidth={false} onClick={handleSaveStatus} disabled={savingStatus} className="px-4">
            {savingStatus ? "Saving…" : "Update status"}
          </FormButton>
        </div>
      )}

      <div className="mb-4">
        <span className="text-xs font-semibold text-[var(--stone)] uppercase tracking-wide block mb-3">Activity</span>
        <div className="flex flex-col gap-3 max-h-[280px] overflow-y-auto pr-1">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-2 text-[13px]">
              <div className="w-6 h-6 rounded-full bg-[var(--paper)] border border-[var(--line)] flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">
                {activity.actor.firstName[0]}
              </div>
              <div className="flex-1 min-w-0">
                {activity.type === "COMMENT" ? (
                  <>
                    <span className="font-semibold">
                      {activity.actor.firstName} {activity.actor.lastName}
                    </span>
                    <p className="mt-0.5">{activity.body}</p>
                  </>
                ) : (
                  <p className="text-[var(--stone)] italic">
                    {activityDescription(activity)}
                    {activity.type === "STATUS_CHANGED" && activity.body ? ` — "${activity.body}"` : ""}
                  </p>
                )}
                <div className="font-mono text-[10px] text-[var(--stone)] mt-0.5">{timeAgo(activity.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handlePostComment} className="flex gap-2">
        <input
          type="text"
          value={commentBody}
          onChange={(e) => setCommentBody(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 px-3 py-[9px] border-[1.5px] border-[var(--line-2)] rounded-[9px] text-[13px]"
        />
        <FormButton type="submit" fullWidth={false} disabled={postingComment || !commentBody.trim()} className="px-4">
          Post
        </FormButton>
      </form>
    </Modal>
  );
}
