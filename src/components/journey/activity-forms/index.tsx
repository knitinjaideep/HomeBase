import type { ComponentType } from "react";
import type { GuideActivity } from "@/lib/guide";
import type { JourneySnapshot } from "@/lib/journey/snapshot";
import { CommuteActivity } from "./commute-activity";
import { HomePreferencesActivity } from "./home-preferences-activity";

/**
 * Structured, activity-specific forms.
 *
 * `/journey/<activityId>` renders the activity's entry from this registry when
 * there is one, and the generic page (tasks, decisions, checklist, notes)
 * otherwise. The generic content is always still shown below a structured form,
 * so nothing an activity already offered goes away.
 *
 * HOW TO ADD A STRUCTURED FORM FOR ANOTHER ACTIVITY
 *  1. Decide where each answer lives (see `lib/journey/activity-responses.ts`):
 *     reused elsewhere → its domain entity (`updatePreferences`,
 *     `updateFinancial`, towns…); only used here → the activity's `responses`
 *     JSON; free-form thinking → notes.
 *  2. If it has activity-only answers, add a Zod schema and register it in
 *     `ACTIVITY_RESPONSE_SCHEMAS`. No database change is needed — `responses`
 *     is already a JSONB column.
 *  3. Create `<name>-activity.tsx` exporting a component that takes
 *     `ActivityFormProps`, keeps its own draft state, and renders its fields
 *     (see `fields.tsx`) inside `<ActivityFormFrame onSave={...}>`. `onSave`
 *     writes only what changed and throws on failure; the frame supplies owner,
 *     due date, notes, Save for later / Save and continue, and error display.
 *  4. Add one line to `ACTIVITY_FORMS` below, keyed by the guide activity id.
 *  5. Add a test for its schema, and for any helper that derives a value.
 */
export interface ActivityFormProps {
  activity: GuideActivity;
  s: JourneySnapshot;
}

export const ACTIVITY_FORMS: Partial<Record<string, ComponentType<ActivityFormProps>>> = {
  commute: CommuteActivity,
  "home-preferences": HomePreferencesActivity,
};
