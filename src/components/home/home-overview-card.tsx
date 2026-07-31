"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { updateOwnedHome } from "@/lib/maintenance/service";
import { useOwnerModeProfile } from "@/lib/workspace/hooks";
import { newId } from "@/lib/util";
import { dateLabel } from "@/lib/format";
import { Button, Field, Input, Panel } from "@/components/ui";
import { TextField, NumberField } from "@/components/form-fields";
import { useToast } from "@/components/toast";
import { useSaveStatus } from "@/lib/data/save-status";
import { SaveIndicator } from "@/components/save-indicator";
import type { HomeSystem, OwnedHome, OwnerPropertyType } from "@/lib/models";

const OWNER_PROPERTY_TYPE_LABELS: Record<OwnerPropertyType, string> = {
  "single-family": "Single-family home",
  "condo-townhouse": "Condo or townhouse",
  other: "Other",
};

interface FormValues {
  name: string;
  address: string;
  yearBuilt: number | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
}

/**
 * The home overview — name/address/year built/purchase details, editable
 * inline (react-hook-form + useSaveStatus, same pattern as
 * HouseholdSettings), plus the free-form "systems" list. Usable with just a
 * name or address: nothing else is required. Property type / move-in date
 * are shown read-only from `ownerModeProfile` (captured once at onboarding —
 * see lib/models/home.ts for why they aren't re-collected here).
 */
export function HomeOverviewCard({ home }: { home: OwnedHome | null }) {
  const { notify } = useToast();
  const saveStatus = useSaveStatus();
  const ownerProfile = useOwnerModeProfile();
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      name: home?.name ?? "",
      address: home?.address ?? "",
      yearBuilt: home?.yearBuilt ?? null,
      purchaseDate: home?.purchaseDate ?? null,
      purchasePrice: home?.purchasePrice ?? null,
    },
  });

  const [systems, setSystems] = useState<HomeSystem[]>(home?.systems ?? []);

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveStatus.run(() => updateOwnedHome(values));
    if (result.ok) notify("Home overview saved.");
  });

  const saveSystems = async (next: HomeSystem[]) => {
    setSystems(next);
    await updateOwnedHome({ systems: next });
  };

  return (
    <Panel className="p-5 sm:p-6">
      <h2 className="font-display text-lg text-ink">Home overview</h2>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField register={register} name="name" label="Name" placeholder="e.g. Our Home" />
          <TextField register={register} name="address" label="Address" placeholder="Street address" />
          <NumberField register={register} name="yearBuilt" label="Year built (optional)" />
          <Field label="Purchase date (optional)">
            <Input type="date" {...register("purchaseDate")} />
          </Field>
          <NumberField register={register} name="purchasePrice" label="Purchase price (optional)" prefix="$" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 border-t border-line pt-4 text-sm text-ink-muted">
          <div>
            <span className="block text-xs text-ink-subtle">Property type</span>
            {ownerProfile ? OWNER_PROPERTY_TYPE_LABELS[ownerProfile.propertyType] : "—"}
          </div>
          <div>
            <span className="block text-xs text-ink-subtle">Move-in date</span>
            {ownerProfile?.moveInDate ? dateLabel(ownerProfile.moveInDate) : "Not set"}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <SaveIndicator status={saveStatus.status} error={saveStatus.error} onRetry={saveStatus.retry} />
          <Button type="submit" disabled={saveStatus.status === "saving"}>
            Save
          </Button>
        </div>
      </form>

      <div className="mt-5 border-t border-line pt-4">
        <h3 className="text-sm font-medium text-ink">Systems &amp; areas</h3>
        <p className="mt-0.5 text-xs text-ink-subtle">Free-form records — e.g. &ldquo;HVAC: Carrier, installed 2019&rdquo;.</p>
        <div className="mt-3 space-y-2">
          {systems.map((s) => (
            <div key={s.id} className="flex items-start gap-2">
              <Input
                defaultValue={s.label}
                placeholder="Label (e.g. HVAC)"
                className="w-40 shrink-0"
                onBlur={(e) => void saveSystems(systems.map((x) => (x.id === s.id ? { ...x, label: e.target.value } : x)))}
              />
              <Input
                defaultValue={s.notes}
                placeholder="Notes"
                onBlur={(e) => void saveSystems(systems.map((x) => (x.id === s.id ? { ...x, notes: e.target.value } : x)))}
              />
              <button
                type="button"
                onClick={() => void saveSystems(systems.filter((x) => x.id !== s.id))}
                className="shrink-0 px-2 text-xs text-ink-subtle hover:text-critical"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => void saveSystems([...systems, { id: newId(), label: "", notes: "" }])}
        >
          Add system or area
        </Button>
      </div>
    </Panel>
  );
}
