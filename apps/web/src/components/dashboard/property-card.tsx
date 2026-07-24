import Link from "next/link";
import type { PropertyListItem } from "@/lib/properties";
import { PROPERTY_TYPE_LABELS } from "@/lib/properties";

export function PropertyCard({
  property,
  basePath = "/landlord/properties",
}: {
  property: PropertyListItem;
  basePath?: string;
}) {
  return (
    <div className="border border-[var(--line)] rounded-2xl overflow-hidden bg-white">
      <div
        className="h-[140px] flex items-center justify-center"
        style={{
          background:
            "repeating-linear-gradient(135deg,#EDEBE4,#EDEBE4 10px,#F4F2EC 10px,#F4F2EC 20px)",
        }}
      >
        <span className="font-mono text-[11px] text-[var(--stone)]">
          {property._count.photos > 0 ? `${property._count.photos} photo${property._count.photos > 1 ? "s" : ""}` : "no photos yet"}
        </span>
      </div>
      <div className="p-[18px]">
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="min-w-0">
            <div className="font-display font-bold text-[16px] truncate">{property.name}</div>
            <div className="text-xs text-[var(--stone)] truncate">
              {property.location}
              {property.county ? `, ${property.county}` : ""}
            </div>
          </div>
          <span className="font-mono text-[10px] bg-[var(--green-soft)] text-[var(--green-deep)] px-[9px] py-1 rounded-full whitespace-nowrap shrink-0">
            {PROPERTY_TYPE_LABELS[property.propertyType]}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-[10px] mt-[14px]">
          <div>
            <div className="font-mono font-bold text-[16px]">{property.occupancy.total}</div>
            <div className="text-[11px] text-[var(--stone)]">Units</div>
          </div>
          <div>
            <div className="font-mono font-bold text-[16px] text-[var(--success)]">{property.occupancy.occupied}</div>
            <div className="text-[11px] text-[var(--stone)]">Occupied</div>
          </div>
          <div>
            <div className="font-mono font-bold text-[16px] text-[var(--stone)]">{property.occupancy.vacant}</div>
            <div className="text-[11px] text-[var(--stone)]">Vacant</div>
          </div>
        </div>
        <Link
          href={`${basePath}/${property.id}`}
          className="mt-4 block w-full text-center border-[1.5px] border-[var(--line-2)] rounded-[9px] py-[10px] text-[13px] font-semibold text-[var(--ink)]"
        >
          View details
        </Link>
      </div>
    </div>
  );
}
