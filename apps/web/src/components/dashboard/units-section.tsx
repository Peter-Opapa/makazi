"use client";

import * as React from "react";
import { toast } from "sonner";
import { bulkGenerateUnitsAuto, createUnit, deleteUnit, updateUnit, type Unit, type UnitInput } from "@/lib/properties";
import { formatKES, unitStatusColor, unitStatusLabel } from "@/lib/format";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormButton } from "@/components/shared/form-button";
import { UnitFormModal } from "@/components/dashboard/unit-form-modal";
import { BulkGenerateUnitsModal } from "@/components/dashboard/bulk-generate-units-modal";
import { AssignTenantModal } from "@/components/dashboard/assign-tenant-modal";
import { MoveOutWizard } from "@/components/dashboard/move-out-wizard";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TenancyStatus, UnitStatus } from "@makazi/shared-types";
import { cn } from "@/lib/utils";

function statusTone(status: UnitStatus): "success" | "warning" | "error" | "neutral" {
  switch (status) {
    case UnitStatus.OCCUPIED:
      return "success";
    case UnitStatus.RESERVED:
      return "warning";
    case UnitStatus.UNDER_MAINTENANCE:
      return "error";
    default:
      return "neutral";
  }
}

type FilterTab = "all" | UnitStatus.VACANT | UnitStatus.OCCUPIED;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: UnitStatus.VACANT, label: "Vacant" },
  { key: UnitStatus.OCCUPIED, label: "Occupied" },
];

export function UnitsSection({
  propertyId,
  units,
  onChange,
}: {
  propertyId: string;
  units: Unit[];
  onChange: () => void;
}) {
  const [filter, setFilter] = React.useState<FilterTab>("all");
  const [addOpen, setAddOpen] = React.useState(false);
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [editingUnit, setEditingUnit] = React.useState<Unit | null>(null);
  const [deletingUnit, setDeletingUnit] = React.useState<Unit | null>(null);
  const [assigningUnit, setAssigningUnit] = React.useState<Unit | null>(null);
  const [movingOutUnit, setMovingOutUnit] = React.useState<Unit | null>(null);

  const filteredUnits = React.useMemo(() => {
    if (filter === "all") return units;
    return units.filter((u) => u.status === filter);
  }, [units, filter]);

  const byFloor = React.useMemo(() => {
    const groups = new Map<string, Unit[]>();
    for (const unit of filteredUnits) {
      const key = unit.floor === null || unit.floor === undefined ? "Unassigned" : `Floor ${unit.floor}`;
      groups.set(key, [...(groups.get(key) ?? []), unit]);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
  }, [filteredUnits]);

  const counts = React.useMemo(
    () => ({
      all: units.length,
      [UnitStatus.VACANT]: units.filter((u) => u.status === UnitStatus.VACANT).length,
      [UnitStatus.OCCUPIED]: units.filter((u) => u.status === UnitStatus.OCCUPIED).length,
    }),
    [units],
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <span className="font-semibold text-sm">Units ({units.length})</span>
        <div className="flex gap-2">
          <FormButton variant="outline" fullWidth={false} onClick={() => setBulkOpen(true)} className="px-3 py-2 text-xs">
            Generate units
          </FormButton>
          <FormButton fullWidth={false} onClick={() => setAddOpen(true)} className="px-3 py-2 text-xs">
            Add unit
          </FormButton>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              "rounded-full px-3 py-[6px] text-xs font-semibold",
              filter === tab.key ? "bg-[var(--ink)] text-white" : "border-[1.5px] border-[var(--line-2)] text-[var(--ink)]",
            )}
          >
            {tab.label} ({counts[tab.key]})
          </button>
        ))}
      </div>

      {filteredUnits.length === 0 ? (
        <div className="border-[1.5px] border-dashed border-[var(--line-2)] rounded-2xl py-14 px-5 text-center">
          <p className="text-sm text-[var(--stone)]">
            {units.length === 0 ? "No units yet. Generate units or add them one at a time." : "No units match this filter."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {byFloor.map(([floorLabel, floorUnits]) => (
            <div key={floorLabel}>
              <div className="text-xs font-semibold text-[var(--stone)] uppercase tracking-wide mb-2">{floorLabel}</div>
              <div className="border border-[var(--line)] rounded-[14px] overflow-hidden bg-white">
                {floorUnits.map((unit, i) => {
                  const occupant = unit.tenancies[0];
                  const tenant = occupant?.tenant;
                  const isPending = occupant?.status === TenancyStatus.PENDING;
                  return (
                    <div
                      key={unit.id}
                      className="flex items-center justify-between px-4 py-[11px] gap-3 flex-wrap"
                      style={i > 0 ? { borderTop: "1px solid var(--line)" } : undefined}
                    >
                      <span className="font-mono text-[13px] font-semibold w-16 shrink-0">{unit.code}</span>
                      <div className="flex-1 min-w-0">
                        {tenant ? (
                          <span className="text-[13px] font-medium truncate block">
                            {tenant.firstName} {tenant.lastName}
                            {isPending && <span className="text-[var(--stone)] font-normal"> · awaiting acceptance</span>}
                          </span>
                        ) : (
                          <span className="font-mono text-[13px] text-[var(--stone)]">
                            {unit.rentAmount ? formatKES(Number(unit.rentAmount)) : "—"}
                          </span>
                        )}
                      </div>
                      <StatusBadge tone={statusTone(unit.status)}>{unitStatusLabel(unit.status)}</StatusBadge>

                      {unit.status === UnitStatus.OCCUPIED && (
                        <FormButton
                          variant="outline"
                          fullWidth={false}
                          onClick={() => setMovingOutUnit(unit)}
                          className="px-[10px] py-[6px] text-xs"
                        >
                          Move out & reassign
                        </FormButton>
                      )}
                      {unit.status === UnitStatus.VACANT && (
                        <FormButton fullWidth={false} onClick={() => setAssigningUnit(unit)} className="px-[10px] py-[6px] text-xs">
                          Assign tenant
                        </FormButton>
                      )}

                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => setEditingUnit(unit)}
                          className="p-[6px] text-[var(--stone)]"
                          aria-label={`Edit unit ${unit.code}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeletingUnit(unit)}
                          className="p-[6px] text-[var(--error)]"
                          aria-label={`Delete unit ${unit.code}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M3 6h18" />
                            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <UnitFormModal
        open={addOpen}
        onOpenChange={setAddOpen}
        mode="create"
        onSubmit={async (input: UnitInput) => {
          await createUnit(propertyId, input);
          toast("Unit added.");
          onChange();
        }}
      />

      <BulkGenerateUnitsModal
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onSubmit={async (input) => {
          await bulkGenerateUnitsAuto(propertyId, input);
          toast("Units generated.");
          onChange();
        }}
      />

      {editingUnit && (
        <UnitFormModal
          open={!!editingUnit}
          onOpenChange={(open) => !open && setEditingUnit(null)}
          mode="edit"
          initial={{
            code: editingUnit.code,
            floor: editingUnit.floor ?? undefined,
            rentAmount: editingUnit.rentAmount ? Number(editingUnit.rentAmount) : undefined,
            status: editingUnit.status,
          }}
          onSubmit={async (input) => {
            await updateUnit(editingUnit.id, input);
            toast("Unit updated.");
            onChange();
          }}
        />
      )}

      {deletingUnit && (
        <ConfirmDialog
          open={!!deletingUnit}
          onOpenChange={(open) => !open && setDeletingUnit(null)}
          title="Delete this unit?"
          description={`Unit ${deletingUnit.code} will be permanently removed. This can't be undone.`}
          confirmLabel="Delete unit"
          onConfirm={async () => {
            await deleteUnit(deletingUnit.id);
            toast("Unit deleted.");
            onChange();
          }}
        />
      )}

      {assigningUnit && (
        <AssignTenantModal
          open={!!assigningUnit}
          onOpenChange={(open) => !open && setAssigningUnit(null)}
          unit={assigningUnit}
          onAssigned={onChange}
        />
      )}

      {movingOutUnit && (
        <MoveOutWizard
          open={!!movingOutUnit}
          onOpenChange={(open) => !open && setMovingOutUnit(null)}
          unit={movingOutUnit}
          onCompleted={onChange}
        />
      )}
    </div>
  );
}
