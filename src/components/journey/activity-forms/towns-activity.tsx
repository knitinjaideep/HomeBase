"use client";

import { useEffect, useMemo, useState } from "react";
import { saveTownSelection } from "@/lib/repo";
import { searchGeographiesApi } from "@/lib/geography/client";
import { isUnlinked, linkLegacyChoices, selectionFrom, type TownSelection } from "@/lib/journey/towns";
import { Panel } from "@/components/ui";
import { ActivityFormFrame } from "./activity-form-frame";
import { LocationSelector } from "./location-selector";
import type { ActivityFormProps } from "./index";

/**
 * Towns — primary and backup locations as structured `towns` rows (name, state,
 * canonical id, role, optional order). Older selections saved in
 * `homePreferences` are shown here and adopted on save; nothing is deleted.
 * See `lib/journey/towns.ts` for the rules.
 */
export function TownsActivity({ activity, s }: ActivityFormProps) {
  // Seeded once; later snapshot refreshes must not clobber the household's edits.
  const [draft, setDraft] = useState<TownSelection>(() =>
    selectionFrom(s.towns, { primaryTowns: s.preferences.primaryTowns, backupTowns: s.preferences.backupTowns }),
  );
  // Names saved before Census-backed locations existed are matched to a geography when that is unambiguous.
  useEffect(() => {
    if (![...draft.primary, ...draft.backup].some(isUnlinked)) return;
    let cancelled = false;
    void Promise.all([
      linkLegacyChoices(draft.primary, searchGeographiesApi),
      linkLegacyChoices(draft.backup, searchGeographiesApi),
    ]).then(([primary, backup]) => {
      // Merge by position only if the household has not edited the lists in the meantime.
      if (!cancelled) setDraft((d) => (d.primary.length === primary.length && d.backup.length === backup.length ? { primary, backup } : d));
    });
    return () => {
      cancelled = true;
    };
    // Runs once, on the seeded draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const names = useMemo(
    () => ({ primary: draft.primary.map((t) => t.name), backup: draft.backup.map((t) => t.name) }),
    [draft],
  );

  return (
    <ActivityFormFrame
      activity={activity}
      s={s}
      onSave={() => saveTownSelection(s.towns, draft)}
      aside={
        <Panel className="p-4 sm:p-5">
          <h2 className="font-display text-lg text-ink">Our towns</h2>
          <dl className="mt-3 space-y-3">
            <Summary label="Primary towns" items={names.primary} />
            <Summary label="Backup towns" items={names.backup} />
          </dl>
        </Panel>
      }
    >
      <section>
        <h2 className="font-display text-base text-ink">Where would we most like to live?</h2>
        <p className="mb-3 text-xs text-ink-subtle">Pick as many as you like. Ordering them is optional — the first is your top choice.</p>
        <LocationSelector
          label="primary locations"
          value={draft.primary}
          onChange={(primary) => setDraft((d) => ({ ...d, primary }))}
          taken={draft.backup}
          takenLabel="In backup locations"
          reorderable
        />
      </section>
      <section>
        <h2 className="font-display text-base text-ink">Where else would we consider?</h2>
        <p className="mb-3 text-xs text-ink-subtle">Backups keep the search moving if inventory dries up in a primary town.</p>
        <LocationSelector
          label="backup locations"
          value={draft.backup}
          onChange={(backup) => setDraft((d) => ({ ...d, backup }))}
          taken={draft.primary}
          takenLabel="In primary locations"
        />
      </section>
    </ActivityFormFrame>
  );
}

function Summary({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">{label}</dt>
      <dd className="text-sm text-ink-muted">{items.length > 0 ? items.join(", ") : "—"}</dd>
    </div>
  );
}
