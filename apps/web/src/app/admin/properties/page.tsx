"use client";

import * as React from "react";
import { getAdminPropertyDetail, listAdminProperties, type AdminPropertyDetail, type AdminPropertyListItem } from "@/lib/admin";
import { Modal } from "@/components/shared/modal";

export default function AdminPropertiesPage() {
  const [properties, setProperties] = React.useState<AdminPropertyListItem[]>([]);
  const [county, setCounty] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [viewingId, setViewingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    listAdminProperties({ county: county || undefined, search: search || undefined }).then(setProperties);
  }, [county, search]);

  const counties = React.useMemo(() => {
    const set = new Set(properties.map((p) => p.county).filter((c): c is string => !!c));
    return [...set].sort();
  }, [properties]);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl tracking-[-0.02em] mb-[18px]">Properties</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="px-3.5 py-2.5 border border-[var(--line)] rounded-[9px] text-sm bg-white"
        />
        <select
          value={county}
          onChange={(e) => setCounty(e.target.value)}
          className="px-3 py-2.5 border border-[var(--line)] rounded-[9px] text-sm bg-white"
        >
          <option value="">All counties</option>
          {counties.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="border border-[var(--line)] rounded-[14px] overflow-hidden bg-white">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] px-4 py-3 bg-[var(--paper)] text-[11px] font-semibold text-[var(--stone)] uppercase tracking-wide">
          <span>Property</span>
          <span>County</span>
          <span>Landlord</span>
          <span>Units</span>
          <span>Occupancy</span>
        </div>
        {properties.length === 0 && <div className="px-4 py-8 text-center text-sm text-[var(--stone)]">No properties found.</div>}
        {properties.map((p) => (
          <div
            key={p.id}
            onClick={() => setViewingId(p.id)}
            className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] px-4 py-3.5 border-t border-[var(--line)] items-center text-[13px] cursor-pointer hover:bg-[var(--paper)]"
          >
            <span className="font-semibold">{p.name}</span>
            <span className="text-[var(--stone)]">{p.county ?? "—"}</span>
            <span className="text-[var(--stone)]">{p.landlord}</span>
            <span className="font-mono">{p.units}</span>
            <span className="font-mono">{p.occupancyPct}%</span>
          </div>
        ))}
      </div>

      {viewingId && <PropertyDetailModal propertyId={viewingId} onOpenChange={(open) => !open && setViewingId(null)} />}
    </div>
  );
}

function PropertyDetailModal({ propertyId, onOpenChange }: { propertyId: string; onOpenChange: (open: boolean) => void }) {
  const [detail, setDetail] = React.useState<AdminPropertyDetail | null>(null);

  React.useEffect(() => {
    getAdminPropertyDetail(propertyId).then(setDetail);
  }, [propertyId]);

  if (!detail) return null;

  return (
    <Modal open onOpenChange={onOpenChange}>
      <h3 className="font-display font-bold text-[19px] mb-1">{detail.name}</h3>
      <p className="text-[12.5px] text-[var(--stone)] mb-[18px]">
        {detail.county ?? detail.location} · Landlord: {detail.landlord}
      </p>
      <div className="grid grid-cols-2 gap-2.5 mb-[18px]">
        <div className="border border-[var(--line)] rounded-[10px] p-3">
          <div className="text-[10px] text-[var(--stone)] uppercase mb-1">Units</div>
          <div className="text-[15px] font-mono font-bold">{detail.units}</div>
        </div>
        <div className="border border-[var(--line)] rounded-[10px] p-3">
          <div className="text-[10px] text-[var(--stone)] uppercase mb-1">Occupancy</div>
          <div className="text-[15px] font-mono font-bold">{detail.occupancyPct}%</div>
        </div>
        <div className="border border-[var(--line)] rounded-[10px] p-3">
          <div className="text-[10px] text-[var(--stone)] uppercase mb-1">Caretakers</div>
          <div className="text-[13px] font-semibold">{detail.caretakers}</div>
        </div>
        <div className="border border-[var(--line)] rounded-[10px] p-3">
          <div className="text-[10px] text-[var(--stone)] uppercase mb-1">Tenants</div>
          <div className="text-[15px] font-mono font-bold">{detail.tenants}</div>
        </div>
      </div>
      <div className="text-xs font-semibold text-[var(--stone)] uppercase mb-2">Maintenance history</div>
      <p className="text-[12.5px] text-[var(--stone)]">
        {detail.maintenanceTotal} requests logged, {detail.maintenanceOpen} currently open.
      </p>
    </Modal>
  );
}
