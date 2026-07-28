"use client";

import { useState } from "react";
import { Button, Callout, Field, Input } from "@/components/ui";
import { ChoiceGroup, type Choice } from "./choice-group";
import type { BuyerArrangement, BuyerExperience } from "@/lib/models";

/** The subset of the buyer profile captured in the compact secondary step. */
export interface BuyerOnboardingValues {
  experience: BuyerExperience;
  arrangement: BuyerArrangement;
  participantNames: string[];
}

const EXPERIENCE: Choice<BuyerExperience>[] = [
  { value: "first-time", label: "First-time buyer" },
  { value: "repeat", label: "Bought before" },
];

const ARRANGEMENT: Choice<BuyerArrangement>[] = [
  { value: "solo", label: "Solo" },
  { value: "partner", label: "With a partner" },
  { value: "group", label: "Family or group" },
];

/** Split a comma/newline separated list into trimmed, non-empty names. */
function parseNames(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function BuyerOnboardingForm({
  initial,
  onSubmit,
  onBack,
  busy = false,
  error = null,
}: {
  initial?: Partial<BuyerOnboardingValues>;
  onSubmit: (values: BuyerOnboardingValues) => void;
  onBack: () => void;
  busy?: boolean;
  error?: string | null;
}) {
  const [experience, setExperience] = useState<BuyerExperience>(initial?.experience ?? "first-time");
  const [arrangement, setArrangement] = useState<BuyerArrangement>(initial?.arrangement ?? "solo");
  const [names, setNames] = useState<string>((initial?.participantNames ?? []).join(", "));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ experience, arrangement, participantNames: parseNames(names) });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <ChoiceGroup
        legend="Buying experience"
        name="buyer-experience"
        tone="accent"
        options={EXPERIENCE}
        value={experience}
        onChange={setExperience}
      />

      <ChoiceGroup
        legend="Buying arrangement"
        name="buyer-arrangement"
        tone="accent"
        columns={3}
        options={ARRANGEMENT}
        value={arrangement}
        onChange={setArrangement}
      />

      {arrangement !== "solo" && (
        <Field
          label="Who’s buying with you? (optional)"
          hint="Just display names — separate with commas. No invites or accounts are created."
          htmlFor="buyer-participants"
        >
          <Input
            id="buyer-participants"
            value={names}
            onChange={(e) => setNames(e.target.value)}
            placeholder="e.g. Sam, Alex"
            autoComplete="off"
          />
        </Field>
      )}

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
