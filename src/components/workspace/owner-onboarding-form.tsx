"use client";

import { useState } from "react";
import { Button, Callout, Field, Input } from "@/components/ui";
import { ChoiceGroup, type Choice } from "./choice-group";
import type { OwnerOwnershipStage, OwnerPropertyType } from "@/lib/models";

/** The subset of the owner profile captured in the compact secondary step. */
export interface OwnerOnboardingValues {
  propertyType: OwnerPropertyType;
  ownershipStage: OwnerOwnershipStage;
  moveInDate: string | null;
}

const PROPERTY_TYPE: Choice<OwnerPropertyType>[] = [
  { value: "single-family", label: "Single-family home" },
  { value: "condo-townhouse", label: "Condo or townhouse" },
  { value: "other", label: "Other" },
];

const OWNERSHIP_STAGE: Choice<OwnerOwnershipStage>[] = [
  { value: "new-owner", label: "New homeowner" },
  { value: "established-owner", label: "Established homeowner" },
];

export function OwnerOnboardingForm({
  initial,
  onSubmit,
  onBack,
  busy = false,
  error = null,
}: {
  initial?: Partial<OwnerOnboardingValues>;
  onSubmit: (values: OwnerOnboardingValues) => void;
  onBack: () => void;
  busy?: boolean;
  error?: string | null;
}) {
  const [propertyType, setPropertyType] = useState<OwnerPropertyType>(
    initial?.propertyType ?? "single-family",
  );
  const [ownershipStage, setOwnershipStage] = useState<OwnerOwnershipStage>(
    initial?.ownershipStage ?? "new-owner",
  );
  const [moveInDate, setMoveInDate] = useState<string>(initial?.moveInDate ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ propertyType, ownershipStage, moveInDate: moveInDate.trim() || null });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <ChoiceGroup
        legend="Property type"
        name="owner-property-type"
        tone="caution"
        columns={3}
        options={PROPERTY_TYPE}
        value={propertyType}
        onChange={setPropertyType}
      />

      <ChoiceGroup
        legend="Ownership stage"
        name="owner-ownership-stage"
        tone="caution"
        options={OWNERSHIP_STAGE}
        value={ownershipStage}
        onChange={setOwnershipStage}
      />

      <Field label="Move-in date (optional)" hint="You can skip this and add it later." htmlFor="owner-move-in">
        <Input
          id="owner-move-in"
          type="date"
          value={moveInDate}
          onChange={(e) => setMoveInDate(e.target.value)}
        />
      </Field>

      {error && <Callout tone="critical">{error}</Callout>}

      <div className="flex items-center justify-between gap-3 pt-1">
        <Button type="button" variant="ghost" onClick={onBack} disabled={busy}>
          Back
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Setting up…" : "Enter HomeScope"}
        </Button>
      </div>
    </form>
  );
}
