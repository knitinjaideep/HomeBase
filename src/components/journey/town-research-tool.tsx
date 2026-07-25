"use client";

import { useState } from "react";
import type { TownDesignation, TownResearch } from "@/lib/models";
import { createTown, deleteTown, saveTown } from "@/lib/repo";
import { Button, Field, Input, Select, Textarea, Toggle, Chip, Callout, RatingInput } from "@/components/ui";
import { TOWN_DESIGNATION_LABELS } from "@/lib/labels";
import { cn } from "@/lib/util";

/**
 * Stage 9 town research. A town may not be promoted to Primary until an
 * in-person visit is recorded — so the Primary option is disabled until then,
 * and the tool nudges toward a visit first.
 */
export function TownResearchTool({ towns }: { towns: TownResearch[] }) {
  const [newName, setNewName] = useState("");
  const sorted = [...towns].sort((a, b) => {
    const rank: Record<TownDesignation, number> = { primary: 0, considering: 1, backup: 2, "ruled-out": 3 };
    return rank[a.designation] - rank[b.designation] || a.name.localeCompare(b.name);
  });

  const addTown = async () => {
    const name = newName.trim();
    if (!name) return;
    await createTown({ name });
    setNewName("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-3">
        <Field label="Add a town" className="min-w-[12rem] flex-1">
          <Input
            value={newName}
            placeholder="e.g. Maplewood"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTown())}
          />
        </Field>
        <Button onClick={addTown}>Add town</Button>
      </div>

      {sorted.length === 0 ? (
        <Callout tone="neutral">No towns yet. Add the ones you are considering.</Callout>
      ) : (
        sorted.map((town) => <TownCard key={town.id} town={town} />)
      )}
    </div>
  );
}

function TownCard({ town }: { town: TownResearch }) {
  const [open, setOpen] = useState(false);
  const set = (patch: Partial<TownResearch>) => void saveTown({ ...town, ...patch });
  const canBePrimary = town.visited;

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-ink">{town.name}</h4>
            <Chip tone={town.designation === "primary" ? "accent" : "neutral"}>
              {TOWN_DESIGNATION_LABELS[town.designation]}
            </Chip>
            {town.visited && <Chip tone="neutral">Visited</Chip>}
          </div>
          <p className="mt-0.5 text-xs text-ink-subtle">
            {town.doorToDoorCommuteMinutes ? `${town.doorToDoorCommuteMinutes} min commute` : "commute not tested"}
            {town.trainLine ? ` · ${town.trainLine}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Select
            className="h-8 min-h-0 w-auto py-0 text-xs"
            value={town.designation}
            onChange={(e) => {
              const next = e.target.value as TownDesignation;
              if (next === "primary" && !canBePrimary) return;
              set({ designation: next });
            }}
          >
            {(Object.keys(TOWN_DESIGNATION_LABELS) as TownDesignation[]).map((d) => (
              <option key={d} value={d} disabled={d === "primary" && !canBePrimary}>
                {TOWN_DESIGNATION_LABELS[d]}
                {d === "primary" && !canBePrimary ? " (visit first)" : ""}
              </option>
            ))}
          </Select>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="text-xs text-ink-subtle hover:text-ink"
          >
            {open ? "Less" : "Edit"}
          </button>
        </div>
      </div>

      {!canBePrimary && town.designation !== "primary" && (
        <p className="mt-2 text-xs text-caution">
          Record a weekday and weekend visit before promoting this town to Primary.
        </p>
      )}

      {open && (
        <div className="mt-4 space-y-4 border-t border-line pt-4">
          <Field label="Why we're considering it">
            <Textarea
              rows={2}
              defaultValue={town.whyConsidering}
              onBlur={(e) => set({ whyConsidering: e.target.value })}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Typical price note">
              <Input defaultValue={town.typicalPriceNote} onBlur={(e) => set({ typicalPriceNote: e.target.value })} />
            </Field>
            <Field label="Property-tax note">
              <Input defaultValue={town.taxNotes} onBlur={(e) => set({ taxNotes: e.target.value })} />
            </Field>
            <Field label="Train line">
              <Input defaultValue={town.trainLine} onBlur={(e) => set({ trainLine: e.target.value })} />
            </Field>
            <Field label="Station">
              <Input defaultValue={town.stationName} onBlur={(e) => set({ stationName: e.target.value })} />
            </Field>
            <Field label="Station parking / permits">
              <Input defaultValue={town.stationParking} onBlur={(e) => set({ stationParking: e.target.value })} />
            </Field>
            <Field label="Door-to-door commute (min)">
              <Input
                type="number"
                inputMode="numeric"
                defaultValue={town.doorToDoorCommuteMinutes ?? ""}
                onBlur={(e) =>
                  set({ doorToDoorCommuteMinutes: e.target.value === "" ? null : Number(e.target.value) })
                }
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="School verification method">
              <Input
                defaultValue={town.schoolVerificationMethod}
                placeholder="District boundary tool, called the office…"
                onBlur={(e) => set({ schoolVerificationMethod: e.target.value })}
              />
            </Field>
            <Field label="School rating metric">
              <Input
                defaultValue={town.schoolRatingMetric}
                placeholder="Kept as text — verify independently"
                onBlur={(e) => set({ schoolRatingMetric: e.target.value })}
              />
            </Field>
            <Field label="Childcare availability">
              <Input defaultValue={town.childcareNotes} onBlur={(e) => set({ childcareNotes: e.target.value })} />
            </Field>
            <Field label="Healthcare / hospital access">
              <Input defaultValue={town.healthcareNotes} onBlur={(e) => set({ healthcareNotes: e.target.value })} />
            </Field>
            <Field label="Flood considerations">
              <Input defaultValue={town.floodNotes} onBlur={(e) => set({ floodNotes: e.target.value })} />
            </Field>
            <Field label="Typical home age">
              <Input defaultValue={town.typicalHomeAge} onBlur={(e) => set({ typicalHomeAge: e.target.value })} />
            </Field>
          </div>

          <div className="rounded-lg border border-line bg-surface-muted/40 p-3">
            <div className="flex flex-wrap items-center gap-4">
              <Toggle
                checked={town.visited}
                onChange={(v) =>
                  set({ visited: v, visitDate: v ? (town.visitDate ?? new Date().toISOString().slice(0, 10)) : null })
                }
                label="We have visited in person"
              />
              {town.visited && (
                <Field label="Visit date" className="w-44">
                  <Input
                    type="date"
                    value={town.visitDate ?? ""}
                    onChange={(e) => set({ visitDate: e.target.value || null })}
                  />
                </Field>
              )}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Weekday impression">
                <Textarea rows={2} defaultValue={town.weekdayImpression} onBlur={(e) => set({ weekdayImpression: e.target.value })} />
              </Field>
              <Field label="Weekend impression">
                <Textarea rows={2} defaultValue={town.weekendImpression} onBlur={(e) => set({ weekendImpression: e.target.value })} />
              </Field>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Strengths">
              <Textarea rows={2} defaultValue={town.strengths} onBlur={(e) => set({ strengths: e.target.value })} />
            </Field>
            <Field label="Weaknesses">
              <Textarea rows={2} defaultValue={town.weaknesses} onBlur={(e) => set({ weaknesses: e.target.value })} />
            </Field>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className={cn("flex items-center gap-3")}>
              <span className="text-sm text-ink-muted">Overall confidence</span>
              <RatingInput
                value={town.confidence}
                onChange={(v) => set({ confidence: v })}
                ariaLabel={`Confidence in ${town.name}`}
              />
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (confirm(`Remove ${town.name} from town research?`)) void deleteTown(town.id);
              }}
            >
              Remove town
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
