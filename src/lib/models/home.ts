import { z } from "zod";
import { baseEntitySchema, idSchema, moneySchema } from "./common";

/**
 * A free-form record of one system or area of the home (e.g. "HVAC",
 * "Roof"). Deliberately unstructured — a label plus a notes field, not a
 * typed appliance/system database (see CLAUDE.md: no appliance database).
 */
export const homeSystemSchema = z.object({
  id: idSchema,
  // Not `.min(1)`: a freshly-added row starts blank until the user fills in
  // the label — see StarterTemplatePicker-adjacent HomeOverviewCard, which
  // saves each keystroke's onBlur immediately rather than gating on a
  // "Save" button.
  label: z.string().default(""),
  notes: z.string().default(""),
});
export type HomeSystem = z.infer<typeof homeSystemSchema>;

/**
 * The owned home — a singleton, one row per household, matching
 * `homePreferencesSchema`'s shape (no `householdId` field here: the SQL
 * column exists for RLS/queries, but the service layer stamps it on write
 * and Zod strips it on read, exactly like every other singleton).
 *
 * Deliberately excludes `propertyType`/`moveInDate` — both already live on
 * `ownerModeProfile` (src/lib/models/workspace.ts), captured once at owner
 * onboarding. Re-asking here would create two disagreeing sources of truth;
 * read `useOwnerModeProfile()` instead. Also excludes a photo field — an
 * optional home photo is just a `documents` row with `category: "photo"`,
 * no different from any other document (see document.ts).
 *
 * Usable with just a name or address: every other field defaults or is
 * nullable.
 */
export const ownedHomeSchema = baseEntitySchema.extend({
  name: z.string().default(""),
  address: z.string().default(""),
  yearBuilt: z.number().int().nullable().default(null),
  purchaseDate: z.string().nullable().default(null),
  purchasePrice: moneySchema.default(null),
  systems: z.array(homeSystemSchema).default([]),
});
export type OwnedHome = z.infer<typeof ownedHomeSchema>;

export const OWNED_HOME_TABLE = "ownedHome";
