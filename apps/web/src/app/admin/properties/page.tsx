"use client";

import * as React from "react";
import { getAdminPropertyDetail, listAdminProperties, type AdminPropertyDetail, type AdminPropertyListItem } from "@/lib/admin";
import { Modal } from "@/components/shared/modal";
import { SearchInput } from "@/components/shared/search-input";
import { Select } from "@/components/shared/field";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { SkeletonList } from "@/components/shared/skeletons";

export default function AdminPropertiesPage() {
  const [properties, setProperties] = React.useState<AdminPropertyListItem[] | null>(null);
  const [county, setCounty] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [viewingId, setViewingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setProperties(null);
    listAdminProperties({ county: county || undefined, search: search || undefined }).then(setProperties);
  }, [county, search]);

  const counties = React.useMemo(() => {
    const set = new Set((properties ?? []).map((p) => p.county).filter((c): c is string => !!c));
    return [...set].sort();
  }, [properties]);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl tracking-[-0.02em] mb-[18px]">Properties</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="w-[240px]">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name…" />
        </div>
        <Select value={county} onChange={(e) => setCounty(e.target.value)} className="w-auto">
          <option value="">All counties</option>
          {counties.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>

      {!properties && <SkeletonList rows={6} />}

      {properties && properties.length === 0 && (
        <EmptyState title="No properties found" description={search || county ? "No properties match your filters." : undefined} />
      )}

      {properties && properties.length > 0 && (
        <DataTable
          rows={properties}
          rowKey={(p) => p.id}
          onRowClick={(p) => setViewingId(p.id)}
          columns={[
            { key: "name", header: "Property", sortValue: (p) => p.name.toLowerCase(), render: (p) => <span className="font-semibold">{p.name}</span> },
            { key: "county", header: "County", sortValue: (p) => p.county ?? "", render: (p) => <span className="text-[var(--stone)]">{p.county ?? "—"}</span> },
            { key: "landlord", header: "Landlord", sortValue: (p) => p.landlord.toLowerCase(), render: (p) => <span className="text-[var(--stone)]">{p.landlord}</span> },
            { key: "units", header: "Units", align: "right", sortValue: (p) => p.units, render: (p) => <span className="font-mono">{p.units}</span> },
            { key: "occupancy", header: "Occupancy", align: "right", sortValue: (p) => p.occupancyPct, render: (p) => <span className="font-mono">{p.occupancyPct}%</span> },
          ]}
        />
      )}

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
