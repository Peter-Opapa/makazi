"use client";

import * as React from "react";
import { PropertyType } from "@makazi/shared-types";
import { KENYAN_COUNTIES, listProperties, PROPERTY_TYPE_LABELS, type PropertyListItem } from "@/lib/properties";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { PropertyCard } from "@/components/dashboard/property-card";

const PAGE_SIZE = 12;

export default function CaretakerPropertiesPage() {
  const [search, setSearch] = React.useState("");
  const [county, setCounty] = React.useState("");
  const [propertyType, setPropertyType] = React.useState<PropertyType | "">("");
  const [page, setPage] = React.useState(1);
  const [result, setResult] = React.useState<{ data: PropertyListItem[]; totalPages: number; total: number } | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refetch = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await listProperties({
        search: search || undefined,
        county: county || undefined,
        propertyType: propertyType || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setResult(res);
    } finally {
      setLoading(false);
    }
  }, [search, county, propertyType, page]);

  React.useEffect(() => {
    const timer = setTimeout(refetch, 250);
    return () => clearTimeout(timer);
  }, [refetch]);

  React.useEffect(() => {
    setPage(1);
  }, [search, county, propertyType]);

  return (
    <div>
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <h1 className="font-display font-bold text-2xl tracking-[-0.02em]">Assigned Properties</h1>
      </div>

      <div className="flex flex-wrap gap-[10px] mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search properties…" />
        <select
          value={county}
          onChange={(e) => setCounty(e.target.value)}
          className="border border-[var(--line)] rounded-[9px] px-3 py-[9px] text-[13px] bg-[var(--paper)]"
        >
          <option value="">All counties</option>
          {KENYAN_COUNTIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value as PropertyType | "")}
          className="border border-[var(--line)] rounded-[9px] px-3 py-[9px] text-[13px] bg-[var(--paper)]"
        >
          <option value="">All types</option>
          {Object.values(PropertyType).map((type) => (
            <option key={type} value={type}>
              {PROPERTY_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      {!loading && result && result.data.length === 0 && (
        <div className="border-[1.5px] border-dashed border-[var(--line-2)] rounded-2xl py-16 px-5 text-center">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--line-2)"
            strokeWidth={1.6}
            className="mx-auto mb-3"
          >
            <rect x="3" y="9" width="7" height="12" />
            <rect x="14" y="4" width="7" height="17" />
          </svg>
          <p className="text-sm text-[var(--stone)]">
            {search || county || propertyType
              ? "No properties match your filters."
              : "No properties assigned to you yet. Once a landlord invites you, accept it from your Overview page."}
          </p>
        </div>
      )}

      {result && result.data.length > 0 && (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {result.data.map((property) => (
            <PropertyCard key={property.id} property={property} basePath="/caretaker/properties" />
          ))}
        </div>
      )}

      {result && <Pagination page={page} totalPages={result.totalPages} onPageChange={setPage} />}
    </div>
  );
}
