"use client";

import * as React from "react";
import { listTenants, type TenantListItem } from "@/lib/tenants";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormButton } from "@/components/shared/form-button";
import { RegisterTenantModal } from "@/components/dashboard/register-tenant-modal";

export default function CaretakerTenantsPage() {
  const [search, setSearch] = React.useState("");
  const [tenants, setTenants] = React.useState<TenantListItem[] | null>(null);
  const [registerOpen, setRegisterOpen] = React.useState(false);

  const refetch = React.useCallback(async () => {
    const res = await listTenants(search || undefined);
    setTenants(res);
  }, [search]);

  React.useEffect(() => {
    const timer = setTimeout(refetch, 250);
    return () => clearTimeout(timer);
  }, [refetch]);

  return (
    <div>
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <h1 className="font-display font-bold text-2xl tracking-[-0.02em]">Tenants</h1>
        <FormButton fullWidth={false} onClick={() => setRegisterOpen(true)} className="px-4">
          Register tenant
        </FormButton>
      </div>

      <div className="mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Name, phone or email…" />
      </div>

      {tenants && tenants.length === 0 && (
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
            <circle cx="12" cy="9" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
          </svg>
          <p className="text-sm text-[var(--stone)] mb-4">
            {search ? "No tenants match your search." : "No tenants yet."}
          </p>
          {!search && (
            <FormButton fullWidth={false} onClick={() => setRegisterOpen(true)} className="px-5">
              Register your first tenant
            </FormButton>
          )}
        </div>
      )}

      {tenants && tenants.length > 0 && (
        <div className="border border-[var(--line)] rounded-[14px] overflow-hidden bg-white">
          {tenants.map((t, i) => {
            const activeTenancy = t.tenancies[0];
            return (
              <div
                key={t.id}
                className="flex items-center justify-between px-4 py-[13px] gap-3 flex-wrap"
                style={i > 0 ? { borderTop: "1px solid var(--line)" } : undefined}
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate">
                    {t.firstName} {t.lastName}
                  </div>
                  <div className="text-xs text-[var(--stone)] truncate">{t.phone ?? t.email ?? "—"}</div>
                </div>
                {activeTenancy ? (
                  <StatusBadge tone="success">
                    {activeTenancy.unit.property.name} · {activeTenancy.unit.code}
                  </StatusBadge>
                ) : (
                  <StatusBadge tone="neutral">Unassigned</StatusBadge>
                )}
              </div>
            );
          })}
        </div>
      )}

      <RegisterTenantModal open={registerOpen} onOpenChange={setRegisterOpen} onRegistered={refetch} />
    </div>
  );
}
