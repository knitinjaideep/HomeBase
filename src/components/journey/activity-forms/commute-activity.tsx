"use client";

import { useState } from "react";
import { updatePreferences, setActivityResponses } from "@/lib/repo";
import { readActivityResponses } from "@/lib/journey/activity-responses";
import { NumberField, SegmentedField } from "./fields";
import { ActivityFormFrame } from "./activity-form-frame";
import type { ActivityFormProps } from "./index";

const MINUTE_PRESETS = [15, 30, 45, 60, 90].map((m) => ({ value: m, label: `${m} min` }));
const DAY_OPTIONS = [1, 2, 3, 4, 5].map((d) => ({ value: d, label: `${d}` }));

/**
 * Commute — the first structured activity, and the worked example for
 * `activity-forms/index.tsx`.
 *
 *  - The commute limit is reused elsewhere ("What we know so far", search
 *    filtering), so it is written to the domain entity it already belongs to:
 *    `homePreferences.maxCommuteMinutes`.
 *  - Days per week matters only here, so it goes in this activity's
 *    `responses` JSON (schema: `commuteResponsesSchema`).
 *  - Anything else ("Jersey City is fine if there's a direct train") is a note.
 */
export function CommuteActivity({ activity, s }: ActivityFormProps) {
  const stored = readActivityResponses("commute", s.stageStates.find((x) => x.id === activity.id)?.responses);
  const [minutes, setMinutes] = useState<number | null>(s.preferences.maxCommuteMinutes > 0 ? s.preferences.maxCommuteMinutes : null);
  const [days, setDays] = useState<number | null>(stored.daysPerWeek ?? null);

  async function save() {
    // Write only what changed, so untouched values are never overwritten.
    if ((minutes ?? 0) !== s.preferences.maxCommuteMinutes) {
      await updatePreferences({ maxCommuteMinutes: minutes ?? 0 });
    }
    if (days !== (stored.daysPerWeek ?? null)) {
      await setActivityResponses("commute", { daysPerWeek: days }, s.stageStates.find((x) => x.id === activity.id)?.responses);
    }
  }

  return (
    <ActivityFormFrame activity={activity} s={s} onSave={save}>
      <SegmentedField
        label="Longest door-to-door commute we'd accept"
        hint="Include the walk and parking, not just the drive or train."
        options={MINUTE_PRESETS}
        value={minutes !== null && MINUTE_PRESETS.some((p) => p.value === minutes) ? minutes : null}
        onChange={setMinutes}
      />
      <NumberField label="Or enter your own" unit="minutes" min={0} max={240} value={minutes} onChange={setMinutes} />
      <SegmentedField
        label="Commute days per week"
        hint="Optional. Helps weigh a longer commute against fewer trips."
        options={DAY_OPTIONS}
        value={days}
        onChange={setDays}
      />
    </ActivityFormFrame>
  );
}
