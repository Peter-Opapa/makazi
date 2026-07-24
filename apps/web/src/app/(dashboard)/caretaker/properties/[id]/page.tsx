"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getProperty, PROPERTY_TYPE_LABELS, type PropertyDetail } from "@/lib/properties";
import { UnitsSection } from "@/components/dashboard/units-section";

type Tab = "overview" | "units";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "units", label: "Units" },
];

export default function CaretakerPropertyDetailsPage() {
  const params = useParams<{ id: string }>();
  const [property, setProperty] = React.useState<PropertyDetail | null>(null);
  const [tab, setTab] = React.useState<Tab>("overview");

  const refetch = React.useCallback(async () => {
    const detail = await getProperty(params.id);
    setProperty(detail);
  }, [params.id]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  if (!property) return null;

  const occupied = property.units.filter((u) => u.status === "OCCUPIED").length;
  const vacant = property.units.filter((u) => u.status === "VACANT").length;
  const reserved = property.units.filter((u) => u.status === "RESERVED").length;
  const underMaintenance = property.units.filter((u) => u.status === "UNDER_MAINTENANCE").length;
  const total = property.units.length;

  return (
    <div>
      <Link href="/caretaker/properties" className="text-[13px] text-[var(--stone)] mb-3 inline-block">
        ← Back to properties
      </Link>

      <div className="flex justify-between items-start flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl tracking-[-0.02em] mb-1">{property.name}</h1>
          <p className="text-sm text-[var(--stone)]">
            {property.location}
            {property.county ? `, ${property.county}` : ""} · {PROPERTY_TYPE_LABELS[property.propertyType]}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-[var(--line)]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-1 pb-3 text-[13px] font-semibold -mb-px"
            style={{
              color: tab === t.key ? "var(--ink)" : "var(--stone)",
              borderBottom: tab === t.key ? "2px solid var(--green)" : "2px solid transparent",
              marginRight: 20,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-[var(--line)] rounded-2xl bg-white p-5">
            <div className="text-xs font-semibold text-[var(--stone)] uppercase tracking-wide mb-4">Address</div>
            <div className="flex flex-col gap-[10px] text-[13px]">
              <div className="flex justify-between">
                <span className="text-[var(--stone)]">Town</span>
                <span className="font-semibold">{property.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--stone)]">County</span>
                <span className="font-semibold">{property.county ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--stone)]">Property type</span>
                <span className="font-semibold">{PROPERTY_TYPE_LABELS[property.propertyType]}</span>
              </div>
            </div>
          </div>

          <div className="border border-[var(--line)] rounded-2xl bg-white p-5">
            <div className="text-xs font-semibold text-[var(--stone)] uppercase tracking-wide mb-4">Occupancy status</div>
            <div className="flex h-3 rounded-full overflow-hidden mb-4 bg-[var(--paper)]">
              {total > 0 ? (
                <>
                  <div style={{ flex: occupied || 0.0001, background: "var(--success)" }} />
                  <div style={{ flex: vacant || 0.0001, background: "var(--line-2)" }} />
                  <div style={{ flex: reserved || 0.0001, background: "var(--warning)" }} />
                  <div style={{ flex: underMaintenance || 0.0001, background: "var(--error)" }} />
                </>
              ) : (
                <div className="flex-1" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[var(--stone)]">Total units</span>
                <span className="font-mono font-semibold">{total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--stone)]">Occupied</span>
                <span className="font-mono font-semibold text-[var(--success)]">{occupied}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--stone)]">Vacant</span>
                <span className="font-mono font-semibold">{vacant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--stone)]">Reserved</span>
                <span className="font-mono font-semibold text-[var(--warning)]">{reserved}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "units" && <UnitsSection propertyId={property.id} units={property.units} onChange={refetch} />}
    </div>
  );
}
