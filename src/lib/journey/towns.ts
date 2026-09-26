import type { TownResearch } from "@/lib/models";
import { REFERENCE_TOWNS, US_STATES, referenceTownById, townRefId, type ReferenceTown } from "./town-reference";

/**
 * Pure rules for the Towns activity: searching, de-duplicating, adopting older
 * selections, and turning the household's choices into row changes.
 *
 * Where it is stored: the household's `towns` rows. `designation` is the role
 * (only "primary" and "backup" are managed here — "considering" and "ruled-out"
 * belong to town research and are never set by this activity), `priority` is
 * the optional order, and `refId` / `isCustom` say whether the location came
 * from the reference list. Selections made earlier in `homePreferences`
 * (`primaryTowns`, `backupTowns`) are adopted, never deleted.
 */

export type TownRole = "primary" | "backup";

/** One chosen location. The list it sits in decides whether it is primary or backup. */
export interface TownChoice {
  name: string;
  /** Two-letter state, "" when unknown. */
  state: string;
  /** Canonical reference id, or null for custom / unrecognised locations. */
  refId: string | null;
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

export function choiceFromReference(t: ReferenceTown): TownChoice {
  return { name: t.name, state: t.state, refId: t.id, isCustom: false };
}

/** A location typed by the household. Returns null when the name is empty or the state is not a US state. */
export function customChoice(name: string, state: string): TownChoice | null {
  const cleanName = name.trim().replace(/\s+/g, " ");
  const code = state.trim().toUpperCase();
  if (!cleanName || !(code in US_STATES)) return null;
  // Typing something that is already in the reference list should use the canonical entry.
  const known = referenceTownById(townRefId(cleanName, code));
  return known ? choiceFromReference(known) : { name: cleanName, state: code, refId: null, isCustom: true };
}

/** Same location? Ids decide when both have one; otherwise name (and state when both know it). */
export function sameTown(a: Pick<TownChoice, "name" | "state" | "refId">, b: Pick<TownChoice, "name" | "state" | "refId">): boolean {
  if (a.refId && b.refId) return a.refId === b.refId;
  if (a.name.trim().toLowerCase() !== b.name.trim().toLowerCase()) return false;
  return !a.state || !b.state || a.state === b.state;
}

/**
 * Reference towns matching a query. Every word must appear in "name, state" or
 * the state's full name, so "princeton", "princeton nj", "Princeton, NJ" and
 * "new jersey" all work. Names that start with the query come first.
 */
export function searchTowns(query: string, limit = 8): ReferenceTown[] {
  const words = query.toLowerCase().split(/[\s,]+/).filter(Boolean);
  if (words.length === 0) return [];
  const q = words.join(" ");
  const scored: { town: ReferenceTown; rank: number }[] = [];
  for (const town of REFERENCE_TOWNS) {
    const name = town.name.toLowerCase();
    const haystack = `${name} ${town.state.toLowerCase()} ${(US_STATES[town.state] ?? "").toLowerCase()}`;
    if (!words.every((w) => haystack.includes(w))) continue;
    scored.push({ town, rank: name.startsWith(q) ? 0 : name.startsWith(words[0]) ? 1 : 2 });
  }
  return scored
    .sort((a, b) => a.rank - b.rank || a.town.name.localeCompare(b.town.name))
    .slice(0, limit)
    .map((x) => x.town);
}

/** Turn an older free-text entry ("Princeton" / "Princeton, NJ") into a choice. */
export function choiceFromLegacyName(raw: string): TownChoice {
  const text = raw.trim();
  const [namePart, statePart] = text.split(/\s*,\s*/);
  const state = statePart?.toUpperCase();
  if (state && state in US_STATES) {
    return customChoice(namePart, state) ?? { name: text, state: "", refId: null, isCustom: true };
  }
  const matches = REFERENCE_TOWNS.filter((t) => t.name.toLowerCase() === text.toLowerCase());
  if (matches.length === 1) return choiceFromReference(matches[0]);
  return { name: text, state: "", refId: null, isCustom: true };
}

function choiceFromRow(t: TownResearch): TownChoice {
  const ref = referenceTownById(t.refId);
  if (ref) return choiceFromReference(ref);
  if (t.state) return { name: t.name, state: t.state, refId: t.refId, isCustom: t.isCustom };
  // Row from before states were recorded: adopt the reference entry when the name is unambiguous.
  const legacy = choiceFromLegacyName(t.name);
  return { ...legacy, isCustom: legacy.refId ? false : true };
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

export interface TownSavePlan {
  create: (Pick<TownResearch, "name" | "state" | "refId" | "isCustom" | "designation" | "priority">)[];
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
    const fields = { name: c.name, state: c.state, refId: c.refId, isCustom: c.isCustom, designation: role, priority };
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
