"use client";

import * as React from "react";
import Link from "next/link";
import { listExitRequests, type ExitRequest } from "@/lib/tenants";

/**
 * Tenants who've asked to leave, shown to the landlord/caretaker. Each links
 * to the property so they can run the move-out wizard on that unit to finalise
 * it. Renders nothing when there are no outstanding requests.
 */
export function ExitRequestsSection({ propertyHrefBase }: { propertyHrefBase: string }) {
  const [requests, setRequests] = React.useState<ExitRequest[]>([]);

  React.useEffect(() => {
    listExitRequests()
      .then(setRequests)
      .catch(() => setRequests([]));
  }, []);

  if (requests.length === 0) return null;

  return (
    <div className="mb-6 border border-[var(--warning)] bg-[var(--warning-bg)] rounded-2xl p-4">
      <div className="font-semibold text-sm mb-3">Move-out requests ({requests.length})</div>
      <div className="flex flex-col gap-3">
        {requests.map((r) => (
          <div key={r.tenancyId} className="flex justify-between items-center gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="text-[13px] font-semibold truncate">
                {r.tenant.firstName} {r.tenant.lastName} — {r.property.name} · {r.unitCode}
              </div>
              <div className="text-xs text-[var(--stone)] truncate">
                {r.exitReason ? `"${r.exitReason}"` : "No reason given"} · requested{" "}
                {new Date(r.exitRequestedAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
              </div>
            </div>
            <Link
              href={`${propertyHrefBase}/${r.property.id}`}
              className="text-[13px] font-semibold text-[var(--green)] shrink-0"
            >
              Start move-out
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
