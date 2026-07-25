"use client";

import * as React from "react";
import { listTenants, type TenantListItem } from "@/lib/tenants";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormButton } from "@/components/shared/form-button";
import { RegisterTenantModal } from "@/components/dashboard/register-tenant-modal";
import { ExitRequestsSection } from "@/components/dashboard/exit-requests-section";
import { EmptyState } from "@/components/shared/empty-state";
import { SkeletonList } from "@/components/shared/skeletons";
import { DataTable } from "@/components/shared/data-table";

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

      <ExitRequestsSection propertyHrefBase="/caretaker/properties" />

      <div className="mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Name, phone or email…" />
      </div>

      {!tenants && <SkeletonList rows={5} />}

      {tenants && tenants.length === 0 && (
        <EmptyState
          icon={
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
              <circle cx="12" cy="9" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
          }
          title={search ? "No tenants match your search." : "No tenants yet."}
          description={search ? undefined : "Register a tenant, then assign them to a unit from a property's Units tab."}
          action={
            !search ? (
              <FormButton fullWidth={false} onClick={() => setRegisterOpen(true)} className="px-5">
                Register your first tenant
              </FormButton>
            ) : undefined
          }
        />
      )}

      {tenants && tenants.length > 0 && (
        <DataTable
          rows={tenants}
          rowKey={(t) => t.id}
          columns={[
            {
              key: "tenant",
              header: "Tenant",
              sortValue: (t) => `${t.firstName} ${t.lastName}`.toLowerCase(),
              render: (t) => (
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {t.firstName} {t.lastName}
                  </div>
                  <div className="text-xs text-[var(--stone)] truncate">{t.phone ?? t.email ?? "—"}</div>
                </div>
              ),
            },
            {
              key: "unit",
              header: "Unit",
              align: "right",
              sortValue: (t) => t.tenancies[0]?.unit.code ?? "",
              render: (t) => {
                const activeTenancy = t.tenancies[0];
                return activeTenancy ? (
                  <StatusBadge tone="success">
                    {activeTenancy.unit.property.name} · {activeTenancy.unit.code}
                  </StatusBadge>
                ) : (
                  <StatusBadge tone="neutral">Unassigned</StatusBadge>
                );
              },
            },
          ]}
        />
      )}

      <RegisterTenantModal open={registerOpen} onOpenChange={setRegisterOpen} onRegistered={refetch} />
    </div>
  );
}
