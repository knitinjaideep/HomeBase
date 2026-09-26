"use client";

import { useMemo, useState } from "react";
import { setActivityResponses, updatePreferences } from "@/lib/repo";
import { parseActivityResponses, readActivityResponses } from "@/lib/journey/activity-responses";
import {
  AVOID_PRESETS,
  BATHROOM_OPTIONS,
  BEDROOM_OPTIONS,
  HOME_TYPES,
  MUST_HAVE_PRESETS,
  WOULD_LOVE_PRESETS,
  answersFrom,
  cleanList,
  describeHome,
  formatMinimum,
  type HomePreferenceAnswers,
  type HomeTypeId,
} from "@/lib/journey/home-preferences";
import { Field, Input, Panel, Textarea } from "@/components/ui";
import { AddItem, PresetChipPicker, RemovableChip, SegmentedField, ToggleChip } from "./fields";
import { ActivityFormFrame } from "./activity-form-frame";
import type { ActivityFormProps } from "./index";

/**
 * Home preferences — structured replacement for the generic activity page.
 * Towns, bedroom and bathroom minimums live on `homePreferences`; everything
 * else lives in this activity's `responses` (see `lib/journey/home-preferences.ts`).
 * Nothing is written until Save, and only fields that changed are written.
 */
export function HomePreferencesActivity({ activity, s }: ActivityFormProps) {
  const storedResponses = s.stageStates.find((x) => x.id === activity.id)?.responses;
  const initial = useMemo(
    () => answersFrom(s.preferences, readActivityResponses("home-preferences", storedResponses)),
    [s.preferences, storedResponses],
  );
  // The draft is seeded once; later snapshot refreshes must not clobber typing.
  const [draft, setDraft] = useState<HomePreferenceAnswers>(initial);
  const [extraNotes, setExtraNotes] = useState(readActivityResponses("home-preferences", storedResponses).extraNotes ?? "");
  const set = <K extends keyof HomePreferenceAnswers>(key: K, value: HomePreferenceAnswers[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const preview = useMemo(() => describeHome(draft), [draft]);
  const knownTowns = useMemo(() => s.towns.map((t) => t.name).filter((n) => !draft.towns.includes(n)), [s.towns, draft.towns]);
  const legacyNotes = [
    ["Required", s.preferences.requiredNotes],
    ["Preferred", s.preferences.preferredNotes],
    ["Deal-breakers", s.preferences.dealbreakerNotes],
  ].filter(([, text]) => text.trim());

  const toggleType = (id: HomeTypeId) =>
    set("homeTypes", draft.homeTypes.includes(id) ? draft.homeTypes.filter((t) => t !== id) : [...draft.homeTypes, id]);

  async function save() {
    // Structured answers first: they are validated (and throw) before anything is written.
    const responses = parseActivityResponses("home-preferences", {
      homeTypes: draft.homeTypes,
      homeTypeOther: draft.homeTypes.includes("other") ? draft.homeTypeOther : "",
      mustHave: draft.mustHave,
      mustHaveCustom: cleanList(draft.mustHaveCustom),
      wouldLove: draft.wouldLove,
      wouldLoveCustom: cleanList(draft.wouldLoveCustom),
      avoid: draft.avoid,
      avoidCustom: cleanList(draft.avoidCustom),
      extraNotes,
    });
    const towns = cleanList(draft.towns);
    const patch: { primaryTowns?: string[]; minBedrooms?: number; minBathrooms?: number } = {};
    if (JSON.stringify(towns) !== JSON.stringify(initial.towns)) patch.primaryTowns = towns;
    if (draft.minBedrooms !== initial.minBedrooms) patch.minBedrooms = draft.minBedrooms;
    if (draft.minBathrooms !== initial.minBathrooms) patch.minBathrooms = draft.minBathrooms;
    if (Object.keys(patch).length > 0) await updatePreferences(patch);
    await setActivityResponses("home-preferences", responses, storedResponses);
  }

  return (
    <ActivityFormFrame activity={activity} s={s} onSave={save} aside={<HomePreview preview={preview} />}>
      <Section title="Where are we looking?">
        <div className="flex flex-wrap items-center gap-2">
          {draft.towns.map((t) => (
            <RemovableChip key={t} label={t} onRemove={() => set("towns", draft.towns.filter((x) => x !== t))} />
          ))}
          <AddItem
            addLabel={draft.towns.length > 0 ? "Add another town" : "Add a town"}
            placeholder="e.g. Princeton"
            suggestions={knownTowns}
            onAdd={(town) => set("towns", cleanList([...draft.towns, town]))}
          />
        </div>
      </Section>

      <Section title="Home type" hint="Pick every type you'd consider.">
        <div className="flex flex-wrap gap-2">
          {HOME_TYPES.map((t) => (
            <ToggleChip key={t.id} label={t.label} selected={draft.homeTypes.includes(t.id)} onToggle={() => toggleType(t.id)} />
          ))}
        </div>
        {draft.homeTypes.includes("other") && (
          <Field label="What other type?" className="mt-3 max-w-xs">
            <Input value={draft.homeTypeOther} maxLength={60} onChange={(e) => set("homeTypeOther", e.target.value)} />
          </Field>
        )}
      </Section>

      <Section title="Must have" hint="The things a home has to offer to be worth touring.">
        <div className="space-y-4">
          <SegmentedField
            label="Bedrooms"
            options={BEDROOM_OPTIONS.map((n) => ({ value: n, label: formatMinimum(n) }))}
            value={draft.minBedrooms > 0 ? draft.minBedrooms : null}
            onChange={(n) => set("minBedrooms", n === draft.minBedrooms ? 0 : n)}
            hint={draft.minBedrooms > 0 ? "Select again to clear." : undefined}
          />
          <SegmentedField
            label="Bathrooms"
            options={BATHROOM_OPTIONS.map((n) => ({ value: n, label: formatMinimum(n) }))}
            value={draft.minBathrooms > 0 ? draft.minBathrooms : null}
            onChange={(n) => set("minBathrooms", n === draft.minBathrooms ? 0 : n)}
            hint={draft.minBathrooms > 0 ? "Select again to clear." : undefined}
          />
          <PresetChipPicker
            presets={MUST_HAVE_PRESETS}
            selected={draft.mustHave}
            custom={draft.mustHaveCustom}
            onSelectedChange={(v) => set("mustHave", v)}
            onCustomChange={(v) => set("mustHaveCustom", v)}
            customPlaceholder="e.g. first-floor bedroom"
          />
        </div>
      </Section>

      <Section title="Would love" hint="Nice to have, but we'd trade them for the right home.">
        <PresetChipPicker
          presets={WOULD_LOVE_PRESETS}
          selected={draft.wouldLove}
          custom={draft.wouldLoveCustom}
          onSelectedChange={(v) => set("wouldLove", v)}
          onCustomChange={(v) => set("wouldLoveCustom", v)}
          customPlaceholder="e.g. screened porch"
        />
      </Section>

      <Section title="Avoid" hint="Things we'd rather not live with.">
        <PresetChipPicker
          presets={AVOID_PRESETS}
          selected={draft.avoid}
          custom={draft.avoidCustom}
          onSelectedChange={(v) => set("avoid", v)}
          onCustomChange={(v) => set("avoidCustom", v)}
          customPlaceholder="e.g. flood zone"
        />
      </Section>

      <Section title="Extra notes">
        <Textarea
          rows={4}
          value={extraNotes}
          maxLength={4000}
          placeholder="Add anything else about your home preferences, lifestyle, or what's most important to you."
          onChange={(e) => setExtraNotes(e.target.value)}
        />
        {legacyNotes.length > 0 && (
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-ink-muted hover:text-ink">Earlier notes saved in Settings</summary>
            <dl className="mt-2 space-y-2 text-ink-muted">
              {legacyNotes.map(([label, text]) => (
                <div key={label}>
                  <dt className="text-xs font-medium text-ink-subtle">{label}</dt>
                  <dd className="whitespace-pre-wrap">{text}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}
      </Section>
    </ActivityFormFrame>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-base text-ink">{title}</h2>
      {hint && <p className="mb-2 text-xs text-ink-subtle">{hint}</p>}
      <div className={hint ? "" : "mt-2"}>{children}</div>
    </section>
  );
}

function HomePreview({ preview }: { preview: ReturnType<typeof describeHome> }) {
  const rows: [string, string[]][] = [
    ["Home type", preview.homeTypes],
    ["Locations", preview.locations],
    ["Must have", preview.mustHave],
    ["Would love", preview.wouldLove],
    ["Avoid", preview.avoid],
  ];
  return (
    <Panel className="p-4 sm:p-5">
      <h2 className="font-display text-lg text-ink">Preview of our home</h2>
      <p aria-live="polite" className="mt-2 text-sm text-ink">
        {preview.sentence ?? <span className="text-ink-subtle">Your choices will appear here as you make them.</span>}
      </p>
      <dl className="mt-4 space-y-3">
        {rows.map(([label, items]) => (
          <div key={label}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">{label}</dt>
            <dd className="text-sm text-ink-muted">{items.length > 0 ? items.join(", ") : "—"}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
