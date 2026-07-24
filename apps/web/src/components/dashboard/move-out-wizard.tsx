"use client";

import * as React from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import {
  completeMoveOut,
  confirmMoveOut,
  moveOutDamageAssessment,
  moveOutDepositReconciliation,
  moveOutGenerateReport,
  moveOutInspect,
  presignInspectionPhoto,
  startMoveOut,
  uploadFileDirect,
  type MoveOut,
  type Unit,
} from "@/lib/properties";
import { Modal } from "@/components/shared/modal";
import { Stepper } from "@/components/shared/stepper";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";
import { cn } from "@/lib/utils";

const STEP_KEYS: MoveOut["step"][] = ["confirm", "inspect", "damage_assessment", "deposit_reconciliation", "report", "vacant"];
const STEP_LABELS = ["Confirm", "Inspect", "Damage", "Deposit", "Report", "Vacant"];
const CHECKLIST_ITEMS = ["Walls", "Plumbing", "Electrical", "Fixtures", "Flooring"];

export function MoveOutWizard({
  open,
  onOpenChange,
  unit,
  onCompleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: Unit;
  onCompleted: () => void;
}) {
  const [moveOut, setMoveOut] = React.useState<MoveOut | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const [checklist, setChecklist] = React.useState<Record<string, "ok" | "damaged">>({});
  const [photoUrls, setPhotoUrls] = React.useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
  const [damageNotes, setDamageNotes] = React.useState("");
  const [depositDeductions, setDepositDeductions] = React.useState("");

  const tenant = unit.tenancies[0]?.tenant;

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setChecklist({});
    setPhotoUrls([]);
    setDamageNotes("");
    setDepositDeductions("");
    startMoveOut(unit.id)
      .then(setMoveOut)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't start the move-out."));
  }, [open, unit.id]);

  async function run(action: () => Promise<MoveOut>) {
    setError(null);
    setSubmitting(true);
    try {
      const updated = await action();
      setMoveOut(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingPhoto(true);
    setError(null);
    try {
      const { uploadUrl, publicUrl } = await presignInspectionPhoto(unit.id, file.type);
      await uploadFileDirect(uploadUrl, file);
      setPhotoUrls((prev) => [...prev, publicUrl]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't upload that photo.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  if (!moveOut) {
    return (
      <Modal open={open} onOpenChange={onOpenChange}>
        {error ? <InlineError>{error}</InlineError> : <p className="text-sm text-[var(--stone)]">Starting move-out…</p>}
      </Modal>
    );
  }

  const currentIndex = STEP_KEYS.indexOf(moveOut.step);

  return (
    <Modal open={open} onOpenChange={onOpenChange} maxWidth={520}>
      <h3 className="font-display font-bold text-xl mb-4">Move out {tenant ? `${tenant.firstName} ${tenant.lastName}` : "tenant"}</h3>
      <Stepper steps={STEP_LABELS} currentIndex={currentIndex} />

      {error && <InlineError icon={false}>{error}</InlineError>}

      {moveOut.step === "confirm" && (
        <div>
          <p className="text-[13px] text-[var(--stone)] mb-5">
            This starts the move-out process for <strong>{tenant ? `${tenant.firstName} ${tenant.lastName}` : "this tenant"}</strong> in
            unit <strong className="font-mono">{unit.code}</strong>. You can complete each step at your own pace.
          </p>
          <FormButton disabled={submitting} onClick={() => run(() => confirmMoveOut(unit.id))}>
            {submitting ? "Starting…" : "Confirm move-out"}
          </FormButton>
        </div>
      )}

      {moveOut.step === "inspect" && (
        <div>
          <p className="text-[13px] text-[var(--stone)] mb-4">Record the condition of the unit before the tenant leaves.</p>
          <div className="flex flex-col gap-2 mb-4">
            {CHECKLIST_ITEMS.map((item) => (
              <div key={item} className="flex items-center justify-between border border-[var(--line)] rounded-[10px] px-3 py-[10px]">
                <span className="text-[13px] font-medium">{item}</span>
                <div className="flex gap-1.5">
                  {(["ok", "damaged"] as const).map((state) => (
                    <button
                      key={state}
                      type="button"
                      onClick={() => setChecklist((prev) => ({ ...prev, [item]: state }))}
                      className={cn(
                        "rounded-[7px] px-[10px] py-1 text-[11px] font-semibold capitalize",
                        checklist[item] === state
                          ? state === "ok"
                            ? "bg-[var(--success)] text-white"
                            : "bg-[var(--error)] text-white"
                          : "border-[1.5px] border-[var(--line-2)] text-[var(--ink)]",
                      )}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[13px] font-semibold">Photos</span>
              <label className="border-[1.5px] border-[var(--line-2)] rounded-[9px] px-3 py-[7px] text-xs font-semibold cursor-pointer">
                {uploadingPhoto ? "Uploading…" : "Add photo"}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelected} disabled={uploadingPhoto} />
              </label>
            </div>
            {photoUrls.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {photoUrls.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt="Inspection" className="aspect-square object-cover rounded-[8px] border border-[var(--line)]" />
                ))}
              </div>
            )}
          </div>

          <FormButton disabled={submitting} onClick={() => run(() => moveOutInspect(unit.id, { checklist, photoUrls }))}>
            {submitting ? "Saving…" : "Continue"}
          </FormButton>
        </div>
      )}

      {moveOut.step === "damage_assessment" && (
        <div>
          <label className="block text-[13px] font-semibold mb-[6px]">Damage notes</label>
          <textarea
            value={damageNotes}
            onChange={(e) => setDamageNotes(e.target.value)}
            rows={4}
            placeholder="Describe any damage found during inspection, if any."
            className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px] mb-5"
          />
          <FormButton disabled={submitting} onClick={() => run(() => moveOutDamageAssessment(unit.id, damageNotes))}>
            {submitting ? "Saving…" : "Continue"}
          </FormButton>
        </div>
      )}

      {moveOut.step === "deposit_reconciliation" && (
        <div>
          <label className="block text-[13px] font-semibold mb-[6px]">Deposit deductions (KES)</label>
          <p className="text-xs text-[var(--stone)] mb-2">Cost of any repairs or unpaid charges to deduct from the deposit.</p>
          <input
            type="number"
            min={0}
            value={depositDeductions}
            onChange={(e) => setDepositDeductions(e.target.value)}
            placeholder="0"
            className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px] mb-5"
          />
          <FormButton
            disabled={submitting}
            onClick={() => run(() => moveOutDepositReconciliation(unit.id, Number(depositDeductions || 0)))}
          >
            {submitting ? "Saving…" : "Continue"}
          </FormButton>
        </div>
      )}

      {moveOut.step === "report" && (
        <div>
          {moveOut.reportUrl ? (
            <>
              <p className="text-[13px] text-[var(--stone)] mb-4">Your move-out report is ready.</p>
              <a
                href={moveOut.reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center border-[1.5px] border-[var(--line-2)] rounded-[10px] py-[12px] text-[13px] font-semibold mb-3"
              >
                View report
              </a>
              <FormButton disabled={submitting} onClick={() => run(() => completeMoveOut(unit.id))}>
                {submitting ? "Finishing…" : "Complete move-out"}
              </FormButton>
            </>
          ) : (
            <>
              <p className="text-[13px] text-[var(--stone)] mb-4">
                Generate a summary of the inspection, damage notes and deposit reconciliation.
              </p>
              <FormButton disabled={submitting} onClick={() => run(() => moveOutGenerateReport(unit.id))}>
                {submitting ? "Generating…" : "Generate report"}
              </FormButton>
            </>
          )}
        </div>
      )}

      {moveOut.step === "vacant" && (
        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-full bg-[var(--green-soft)] flex items-center justify-center mx-auto mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--green-deep)" strokeWidth={2}>
              <path d="M4 12l5 5L20 6" />
            </svg>
          </div>
          <h4 className="font-display font-bold text-lg mb-2">Move-out complete</h4>
          <p className="text-[13px] text-[var(--stone)] mb-5">Unit {unit.code} is now vacant.</p>
          <FormButton
            onClick={() => {
              toast("Move-out complete.");
              onCompleted();
              onOpenChange(false);
            }}
          >
            Close
          </FormButton>
        </div>
      )}
    </Modal>
  );
}
