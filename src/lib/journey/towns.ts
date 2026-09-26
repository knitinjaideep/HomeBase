import type { TownResearch } from "@/lib/models";
import { stateByAbbreviation } from "@/lib/geography/states";
import type { GeographyResult } from "@/lib/geography/search";

/**
 * Pure rules for the Locations (Towns) activity: what a chosen location is,
 * de-duplicating, adopting older selections, and turning the household's
 * choices into row changes.
 *
 * Where it is stored: the household's `towns` rows (one per location).
 * `designation` is the role — only "primary" and "backup" are managed here;
 * "considering" and "ruled-out" belong to town research and are never set by
 * this activity. `priority` is the optional order, `geographyId` links to the
 * Census-backed `geographies` row, and `isCustom` marks a location typed by the
 * household (which never has a geography or a GEOID). Selections made earlier in
 * `homePreferences` (`primaryTowns`, `backupTowns`) are adopted, never deleted.
 */

export type TownRole = "primary" | "backup";

/** One chosen location. The list it sits in decides whether it is primary or backup. */
export interface TownChoice {
  name: string;
  /** Two-letter state, "" when unknown. */
  state: string;
  /** "" unless the geography has one (county subdivisions do). */
  county: string;
  /** `geographies.id`; null for custom locations and older names not matched yet. */
  geographyId: string | null;
  isCustom: boolean;
}

export interface TownSelection {
  /** In priority order (first is the top choice). */
  primary: TownChoice[];
  backup: TownChoice[];
}

/** "Princeton, NJ" — or just "Princeton" when the state is unknown. */
export function formatTown(t: Pick<TownChoice, "name" | "state">): string {
  return t.state ? `${t.name}, ${t.state}` : t.name;
}

export function choiceFromGeography(g: GeographyResult): TownChoice {
  return { name: g.name, state: g.state, county: g.county ?? "", geographyId: g.id, isCustom: false };
}

/** A location typed by the household. Returns null when the name is empty or the state is not a US state. */
export function customChoice(name: string, state: string): TownChoice | null {
  const cleanName = name.trim().replace(/\s+/g, " ");
  const st = stateByAbbreviation(state);
  if (!cleanName || !st) return null;
  return { name: cleanName, state: st.abbreviation, county: "", geographyId: null, isCustom: true };
}

/** Same location? Geography ids decide when both have one; otherwise name, and state/county when both know them. */
export function sameTown(a: TownChoice | TownResearch, b: TownChoice | TownResearch): boolean {
  if (a.geographyId && b.geographyId) return a.geographyId === b.geographyId;
  if (a.name.trim().toLowerCase() !== b.name.trim().toLowerCase()) return false;
  return (!a.state || !b.state || a.state === b.state) && (!a.county || !b.county || a.county === b.county);
}

/** Turn an older free-text entry ("Princeton" / "Princeton, NJ") into a choice not yet linked to a geography. */
export function choiceFromLegacyName(raw: string): TownChoice {
  const text = raw.trim();
  const [namePart, statePart] = text.split(/\s*,\s*/);
  const st = statePart ? stateByAbbreviation(statePart) : undefined;
  return { name: st ? namePart : text, state: st?.abbreviation ?? "", county: "", geographyId: null, isCustom: false };
}

/** A choice that still needs matching to a Census geography (an older free-text name). */
export const isUnlinked = (t: TownChoice) => !t.geographyId && !t.isCustom;

function choiceFromRow(t: TownResearch): TownChoice {
  return { name: t.name, state: t.state, county: t.county, geographyId: t.geographyId, isCustom: t.isCustom };
}

/** Rows of one role, in the household's order (ranked first, then alphabetical). */
export function townsWithRole(towns: TownResearch[], role: TownRole): TownResearch[] {
  return towns
    .filter((t) => t.designation === role)
    .sort((a, b) => (a.priority ?? Number.MAX_SAFE_INTEGER) - (b.priority ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name));
}

/** Names of one role's towns, in order — what stage and activity summaries show. */
export function townNames(towns: TownResearch[], role: TownRole): string[] {
  return townsWithRole(towns, role).map((t) => t.name);
}

/**
 * The selection to show when the activity opens: the household's primary and
 * backup town rows, plus any name in the older preference lists that no row
 * covers yet. A town in both lists stays primary only.
 */
export function selectionFrom(
  towns: TownResearch[],
  legacy: { primaryTowns: string[]; backupTowns: string[] },
): TownSelection {
  const fill = (role: TownRole, legacyNames: string[]): TownChoice[] => {
    const list = townsWithRole(towns, role).map(choiceFromRow);
    for (const name of legacyNames) {
      const choice = choiceFromLegacyName(name);
      if (choice.name && !list.some((c) => sameTown(c, choice))) list.push(choice);
    }
    return list;
  };
  const primary = fill("primary", legacy.primaryTowns);
  const backup = fill("backup", legacy.backupTowns).filter((b) => !primary.some((p) => sameTown(p, b)));
  return { primary, backup };
}

/**
 * Link older free-text choices to a Census geography, when that is unambiguous:
 * exactly one result with the same name (preferring the Census place when the
 * same municipality also appears as a county subdivision). Anything unclear is
 * left unlinked for the household to re-pick — never guessed.
 */
export async function linkLegacyChoices(
  choices: TownChoice[],
  search: (query: string, state?: string) => Promise<GeographyResult[]>,
): Promise<TownChoice[]> {
  return Promise.all(
    choices.map(async (c) => {
      if (!isUnlinked(c)) return c;
      let results: GeographyResult[] = [];
      try {
        results = await search(c.name, c.state || undefined);
      } catch (err) {
        console.error("Could not match a saved town to a Census location", err);
        return c;
      }
      const exact = results.filter((r) => r.name.toLowerCase() === c.name.toLowerCase());
      const places = exact.filter((r) => r.geographyType === "place");
      const pick = exact.length === 1 ? exact[0] : places.length === 1 ? places[0] : undefined;
      return pick ? choiceFromGeography(pick) : c;
    }),
  );
}

export interface TownSavePlan {
  create: Pick<TownResearch, "name" | "state" | "county" | "geographyId" | "isCustom" | "designation" | "priority">[];
  /** Full rows with the changed fields applied; research notes are carried over untouched. */
  update: TownResearch[];
}

/**
 * Row changes that make the `towns` table match the selection. Existing rows
 * are matched (never duplicated) so their research notes survive; a primary or
 * backup town the household removed is set back to "considering" rather than
 * deleted, because it may hold research.
 */
export function planTownSave(existing: TownResearch[], selection: TownSelection): TownSavePlan {
  const wanted = [
    ...selection.primary.map((c, i) => ({ c, role: "primary" as const, priority: i + 1 })),
    ...selection.backup
      .filter((b) => !selection.primary.some((p) => sameTown(p, b)))
      .map((c, i) => ({ c, role: "backup" as const, priority: i + 1 })),
  ];
  const used = new Set<string>();
  const plan: TownSavePlan = { create: [], update: [] };

  for (const { c, role, priority } of wanted) {
    const row = existing.find((t) => !used.has(t.id) && sameTown(t, c));
    const fields = { name: c.name, state: c.state, county: c.county, geographyId: c.geographyId, isCustom: c.isCustom, designation: role, priority };
    if (!row) {
      plan.create.push(fields);
      continue;
    }
    used.add(row.id);
    if (Object.entries(fields).some(([k, v]) => row[k as keyof typeof fields] !== v)) plan.update.push({ ...row, ...fields });
  }

  for (const row of existing) {
    if (!used.has(row.id) && (row.designation === "primary" || row.designation === "backup")) {
      plan.update.push({ ...row, designation: "considering", priority: null });
    }
  }
  return plan;
}
