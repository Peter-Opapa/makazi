"use client";

import * as React from "react";
import { PropertyType } from "@makazi/shared-types";
import { ApiError } from "@/lib/api";
import { KENYAN_COUNTIES, PROPERTY_TYPE_LABELS, bulkGenerateUnitsAuto, type Property, type PropertyInput } from "@/lib/properties";
import { Modal } from "@/components/shared/modal";
import { FormButton } from "@/components/shared/form-button";
import { InlineError } from "@/components/shared/inline-error";

export function PropertyFormModal({
  open,
  onOpenChange,
  mode,
  initial,
  onSubmit,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initial?: PropertyInput;
  onSubmit: (input: PropertyInput) => Promise<Property | void>;
  /** Called after a successful create (and any auto-generated units) — lets callers refetch/advance a setup step. */
  onCreated?: (property: Property) => void;
}) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [propertyType, setPropertyType] = React.useState<PropertyType>(initial?.propertyType ?? PropertyType.APARTMENT_BLOCK);
  const [county, setCounty] = React.useState(initial?.county ?? KENYAN_COUNTIES[0]);
  const [location, setLocation] = React.useState(initial?.location ?? "");
  const [estateArea, setEstateArea] = React.useState(initial?.estateArea ?? "");
  const [physicalAddress, setPhysicalAddress] = React.useState(initial?.physicalAddress ?? "");
  const [unitsCount, setUnitsCount] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setPropertyType(initial?.propertyType ?? PropertyType.APARTMENT_BLOCK);
      setCounty(initial?.county ?? KENYAN_COUNTIES[0]);
      setLocation(initial?.location ?? "");
      setEstateArea(initial?.estateArea ?? "");
      setPhysicalAddress(initial?.physicalAddress ?? "");
      setUnitsCount("");
      setError(null);
    }
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const property = await onSubmit({
        name,
        propertyType,
        county,
        location,
        estateArea: estateArea || undefined,
        physicalAddress: physicalAddress || undefined,
      });
      const count = Number(unitsCount);
      if (mode === "create" && property && count > 0) {
        await bulkGenerateUnitsAuto(property.id, { totalUnits: count, floors: 1 });
      }
      onOpenChange(false);
      if (property) onCreated?.(property);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <h3 className="font-display font-bold text-xl mb-[6px]">
        {mode === "create" ? "Add a property" : "Edit property"}
      </h3>
      <p className="text-[13px] text-[var(--stone)] mb-[22px]">
        {mode === "create" ? "You can add more properties later." : "Update your property details."}
      </p>

      {error && <InlineError>{error}</InlineError>}

      <form onSubmit={handleSubmit}>
        <div className="mb-[14px]">
          <label className="block text-[13px] font-semibold mb-[6px]">Property name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Riverside Heights"
            className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px] focus:outline-2 focus:outline-[var(--green)] focus:outline-offset-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-[14px] mb-[14px]">
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">Property type</label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as PropertyType)}
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
            >
              {Object.values(PropertyType).map((type) => (
                <option key={type} value={type}>
                  {PROPERTY_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">County</label>
            <select
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px]"
            >
              {KENYAN_COUNTIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-[14px] mb-[14px]">
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">Town / City</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Kilimani"
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px] focus:outline-2 focus:outline-[var(--green)] focus:outline-offset-1"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-[6px]">Estate / area (optional)</label>
            <input
              type="text"
              value={estateArea}
              onChange={(e) => setEstateArea(e.target.value)}
              placeholder="Kileleshwa"
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px] focus:outline-2 focus:outline-[var(--green)] focus:outline-offset-1"
            />
          </div>
        </div>
        <div className="mb-[14px]">
          <label className="block text-[13px] font-semibold mb-[6px]">Physical address (optional)</label>
          <input
            type="text"
            value={physicalAddress}
            onChange={(e) => setPhysicalAddress(e.target.value)}
            placeholder="Argwings Kodhek Road, off Chania Ave"
            className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px] focus:outline-2 focus:outline-[var(--green)] focus:outline-offset-1"
          />
        </div>
        {mode === "create" && (
          <div className="mb-[22px]">
            <label className="block text-[13px] font-semibold mb-[6px]">Number of units (optional)</label>
            <input
              type="number"
              min={0}
              value={unitsCount}
              onChange={(e) => setUnitsCount(e.target.value)}
              placeholder="Leave blank to add units later"
              className="w-full px-[13px] py-[11px] border-[1.5px] border-[var(--line-2)] rounded-[9px] focus:outline-2 focus:outline-[var(--green)] focus:outline-offset-1"
            />
          </div>
        )}
        <FormButton type="submit" disabled={submitting}>
          {submitting ? "Saving…" : mode === "create" ? "Save property" : "Save changes"}
        </FormButton>
      </form>
    </Modal>
  );
}
