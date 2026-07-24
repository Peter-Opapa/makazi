"use client";

import * as React from "react";
import { listInspections, type Inspection } from "@/lib/inspections";
import { listProperties, type PropertyListItem } from "@/lib/properties";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormButton } from "@/components/shared/form-button";
import { CreateInspectionModal } from "@/components/dashboard/create-inspection-modal";

function typeLabel(type: string): string {
  return type.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CaretakerInspectionsPage() {
  const [inspections, setInspections] = React.useState<Inspection[] | null>(null);
  const [properties, setProperties] = React.useState<PropertyListItem[]>([]);
  const [propertyId, setPropertyId] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);

  const refetch = React.useCallback(async () => {
    const res = await listInspections(propertyId ? { propertyId } : undefined);
    setInspections(res);
  }, [propertyId]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  React.useEffect(() => {
    listProperties({ pageSize: 100 }).then((res) => setProperties(res.data));
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <h1 className="font-display font-bold text-2xl tracking-[-0.02em]">Inspections</h1>
        <div className="flex gap-2">
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="border border-[var(--line)] rounded-[9px] px-3 py-[9px] text-[13px] bg-[var(--paper)]"
          >
            <option value="">All properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <FormButton fullWidth={false} onClick={() => setCreateOpen(true)} className="px-4">
            New inspection
          </FormButton>
        </div>
      </div>

      {inspections && inspections.length === 0 && (
        <div className="border-[1.5px] border-dashed border-[var(--line-2)] rounded-2xl py-16 px-5 text-center">
          <p className="text-sm text-[var(--stone)] mb-4">No inspections logged yet.</p>
          <FormButton fullWidth={false} onClick={() => setCreateOpen(true)} className="px-5">
            Log your first inspection
          </FormButton>
        </div>
      )}

      {inspections && inspections.length > 0 && (
        <div className="border border-[var(--line)] rounded-[14px] overflow-hidden bg-white">
          {inspections.map((inspection, i) => {
            const items = Object.entries(inspection.checklist);
            const damagedCount = items.filter(([, v]) => v === "damaged").length;
            return (
              <div
                key={inspection.id}
                className="flex items-center justify-between px-4 py-[13px] gap-3 flex-wrap"
                style={i > 0 ? { borderTop: "1px solid var(--line)" } : undefined}
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate">
                    {inspection.unit.property.name} · <span className="font-mono">{inspection.unit.code}</span>
                  </div>
                  <div className="text-xs text-[var(--stone)]">
                    {new Date(inspection.submittedAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    {inspection.photoUrls.length > 0 && ` · ${inspection.photoUrls.length} photo${inspection.photoUrls.length > 1 ? "s" : ""}`}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {damagedCount > 0 && <StatusBadge tone="error">{damagedCount} damaged</StatusBadge>}
                  <StatusBadge tone="neutral">{typeLabel(inspection.type)}</StatusBadge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateInspectionModal open={createOpen} onOpenChange={setCreateOpen} onCreated={refetch} />
    </div>
  );
}
