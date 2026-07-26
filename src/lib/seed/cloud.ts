import type { SupabaseClient } from "@supabase/supabase-js";
import { now } from "@/lib/util";
import { seedProperties } from "./properties";
import { seedAppSettings, seedFinancialProfile, seedHomePreferences, seedHouseholdProfile } from "./profile";
import { seedResources } from "./resources";
import { buildAttendingTransition, buildTemplates, buildTimeline } from "./index";

/** Strip the legacy Dexie `id: "singleton"` marker so Postgres assigns a real uuid. */
function withoutId<T extends { id: string }>(row: T): Omit<T, "id"> {
  const clone: Partial<T> = { ...row };
  delete clone.id;
  return clone as Omit<T, "id">;
}

/**
 * Seeds a brand-new household with the same starter content a fresh local
 * install used to give: a blank planning profile (see profile.ts — no real
 * figures ship in source anymore), three fictional SAMPLE properties, the
 * guide timeline, reusable checklist templates, and the curated resource
 * library. Town research is intentionally left empty — those are the
 * household's own real towns of interest, not generic starter content.
 *
 * Runs once, right after bootstrap_household() returns a household that has
 * no appSettings row yet.
 */
export async function seedNewHousehold(
  supabase: SupabaseClient,
  householdId: string,
): Promise<{ error: string | null }> {
  const ts = now();

  const householdProfile = withoutId(seedHouseholdProfile(ts));
  const financialProfile = withoutId(seedFinancialProfile(ts));
  const homePreferences = withoutId(seedHomePreferences(ts));
  const appSettings = withoutId(seedAppSettings(ts));
  const attendingTransition = withoutId(buildAttendingTransition(ts));

  const timeline = buildTimeline(ts);
  const templates = buildTemplates(ts);
  const properties = seedProperties();
  const resources = seedResources(ts);

  const stamp = <T extends object>(row: T) => ({ ...row, householdId });

  const results = await Promise.all([
    supabase.from("buyerProfile").insert(stamp(householdProfile)),
    supabase.from("financialProfile").insert(stamp(financialProfile)),
    supabase.from("homePreferences").insert(stamp(homePreferences)),
    supabase.from("appSettings").insert(stamp({ ...appSettings, seeded: true })),
    supabase.from("attendingTransition").insert(stamp(attendingTransition)),
    supabase.from("properties").insert(properties.map(stamp)),
    supabase.from("checklists").insert([...timeline.checklists, ...templates.checklists].map(stamp)),
    supabase.from("checklistTasks").insert([...timeline.tasks, ...templates.tasks].map(stamp)),
    supabase.from("resources").insert(resources.map(stamp)),
  ]);

  const failed = results.find((r) => r.error);
  return { error: failed?.error?.message ?? null };
}
