import { z } from "zod";
import { HOME_TYPE_IDS } from "./home-preferences";

/**
 * Structured answers that belong to a single activity (stored in
 * `journeyStages.responses`, JSONB). One Zod schema per activity id.
 *
 * Rule of thumb for where an answer lives:
 *  - Reused elsewhere (target date, towns, price range, bedrooms, commute
 *    limit, must-haves…) → the domain entity that already owns it
 *    (`homePreferences`, `financialProfile`, towns…). The activity form just
 *    edits that entity.
 *  - Only meaningful inside this activity → a field here.
 *  - Free-form thinking → the activity's notes, never a field.
 *
 * Every field is optional/nullable so a partly filled form still validates and
 * the schema can grow without a data migration.
 */

export const commuteResponsesSchema = z.object({
  /** Days per week the household expects to commute. Null = not decided. */
  daysPerWeek: z.number().int().min(0).max(7).nullable().optional(),
});
export type CommuteResponses = z.infer<typeof commuteResponsesSchema>;

const presetIds = z.array(z.string().max(40)).max(30);
const customItems = z.array(z.string().trim().min(1).max(60)).max(20);

/** Home preferences: what is not stored on `homePreferences` itself. See `home-preferences.ts`. */
export const homePreferencesResponsesSchema = z.object({
  homeTypes: z.array(z.enum(HOME_TYPE_IDS)).max(HOME_TYPE_IDS.length).optional(),
  homeTypeOther: z.string().trim().max(60).optional(),
  mustHave: presetIds.optional(),
  mustHaveCustom: customItems.optional(),
  wouldLove: presetIds.optional(),
  wouldLoveCustom: customItems.optional(),
  avoid: presetIds.optional(),
  avoidCustom: customItems.optional(),
  extraNotes: z.string().max(4000).optional(),
});
export type HomePreferencesResponses = z.infer<typeof homePreferencesResponsesSchema>;

/** Registry: activity id → schema. Add a line here for each new structured activity that needs one. */
export const ACTIVITY_RESPONSE_SCHEMAS = {
  commute: commuteResponsesSchema,
  "home-preferences": homePreferencesResponsesSchema,
} as const;

export type ActivityResponseId = keyof typeof ACTIVITY_RESPONSE_SCHEMAS;

/**
 * Read an activity's stored answers. Anything that fails validation (older or
 * hand-edited data) is treated as "nothing recorded" rather than thrown, and is
 * never overwritten unless the household saves the form.
 */
export function readActivityResponses<K extends ActivityResponseId>(
  activityId: K,
  raw: Record<string, unknown> | undefined,
): z.infer<(typeof ACTIVITY_RESPONSE_SCHEMAS)[K]> {
  const schema = ACTIVITY_RESPONSE_SCHEMAS[activityId] as z.ZodTypeAny;
  const parsed = schema.safeParse(raw ?? {});
  return (parsed.success ? parsed.data : {}) as z.infer<(typeof ACTIVITY_RESPONSE_SCHEMAS)[K]>;
}

/** Validate before writing. Throws a ZodError on invalid input. */
export function parseActivityResponses<K extends ActivityResponseId>(
  activityId: K,
  values: unknown,
): z.infer<(typeof ACTIVITY_RESPONSE_SCHEMAS)[K]> {
  return (ACTIVITY_RESPONSE_SCHEMAS[activityId] as z.ZodTypeAny).parse(values);
}
