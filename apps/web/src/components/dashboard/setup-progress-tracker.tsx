"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getSetupProgress, type SetupProgress } from "@/lib/setup";
import { listProperties, createProperty, type PropertyInput } from "@/lib/properties";
import { PropertyFormModal } from "@/components/dashboard/property-form-modal";
import { InviteCaretakerModal } from "@/components/dashboard/invite-caretaker-modal";
import { AddTenantWizard } from "@/components/dashboard/add-tenant-wizard";
import { toast } from "sonner";

interface Step {
  key: keyof SetupProgress;
  label: string;
  optional?: boolean;
  onClick: () => void;
}

export function SetupProgressTracker() {
  const router = useRouter();
  const [progress, setProgress] = React.useState<SetupProgress | null>(null);
  const [properties, setProperties] = React.useState<{ id: string; name: string }[]>([]);
  const [propertyModalOpen, setPropertyModalOpen] = React.useState(false);
  const [caretakerModalOpen, setCaretakerModalOpen] = React.useState(false);
  const [tenantModalOpen, setTenantModalOpen] = React.useState(false);

  const refetch = React.useCallback(async () => {
    const [p, list] = await Promise.all([getSetupProgress(), listProperties({ page: 1, pageSize: 100 })]);
    setProgress(p);
    setProperties(list.data.map((prop) => ({ id: prop.id, name: prop.name })));
  }, []);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  if (!progress || (progress.hasProperty && progress.hasPaymentDestination)) return null;

  const firstPropertyId = properties[0]?.id;

  const steps: Step[] = [
    { key: "accountCreated", label: "Account created", onClick: () => {} },
    { key: "emailVerified", label: "Email verified", onClick: () => {} },
    { key: "hasProperty", label: "Create your first property", onClick: () => setPropertyModalOpen(true) },
    {
      key: "hasPaymentDestination",
      label: "Configure payment destination",
      onClick: () => {
        if (firstPropertyId) router.push(`/landlord/properties/${firstPropertyId}?tab=settings`);
      },
    },
    {
      key: "hasCaretaker",
      label: "Invite a caretaker",
      optional: true,
      onClick: () => setCaretakerModalOpen(true),
    },
    { key: "hasTenant", label: "Add tenants", optional: true, onClick: () => setTenantModalOpen(true) },
  ];

  return (
    <div className="border border-[var(--line)] rounded-[16px] p-6 mb-6 bg-white">
      <h2 className="font-display font-bold text-xl mb-1">Let's set up your property</h2>
      <p className="text-sm text-[var(--stone)] mb-5">Just a few steps — you can skip the optional ones for now.</p>

      <div className="flex flex-col gap-[10px]">
        {steps.map((step) => {
          const done = Boolean(progress[step.key]);
          const clickable = !done && step.key !== "accountCreated" && step.key !== "emailVerified";
          return (
            <div
              key={step.key}
              onClick={clickable ? step.onClick : undefined}
              className={`flex items-center gap-3 px-3 py-[10px] rounded-[10px] ${
                clickable ? "cursor-pointer hover:bg-[var(--paper)]" : ""
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  done ? "bg-[var(--green)]" : "border-[1.5px] border-[var(--line-2)]"
                }`}
              >
                {done && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
                    <path d="M4 12l5 5L20 6" />
                  </svg>
                )}
              </div>
              <span className={`text-[14px] ${done ? "text-[var(--stone)] line-through" : "font-medium"}`}>
                {step.label}
                {step.optional && !done && <span className="text-[var(--stone)] font-normal"> (optional)</span>}
              </span>
            </div>
          );
        })}
      </div>

      <PropertyFormModal
        open={propertyModalOpen}
        onOpenChange={setPropertyModalOpen}
        mode="create"
        onSubmit={async (input: PropertyInput) => {
          const property = await createProperty(input);
          toast("Property added.");
          return property;
        }}
        onCreated={() => refetch()}
      />
      {firstPropertyId && (
        <>
          <InviteCaretakerModal
            open={caretakerModalOpen}
            onOpenChange={setCaretakerModalOpen}
            properties={properties}
            onInvited={() => refetch()}
          />
          <AddTenantWizard
            open={tenantModalOpen}
            onOpenChange={setTenantModalOpen}
            properties={properties}
            onAdded={() => refetch()}
          />
        </>
      )}
    </div>
  );
}
