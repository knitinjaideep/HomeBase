import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeSearchText, type CensusGeographyType } from "./census";
import { stateByAbbreviation } from "./states";

/**
 * Location search over the `geographies` table. Runs server-side against
 * Supabase only (never Census). Matching is a case-insensitive prefix match on
 * the normalized name — of the whole name or of any word in it, so "windsor"
 * finds "West Windsor" — served by the (state, normalizedName) index.
 */

export const MIN_QUERY_LENGTH = 2;
export const DEFAULT_LIMIT = 8;
export const MAX_LIMIT = 10;

export interface GeographyResult {
  /** `geographies.id` — what a household's location stores. */
  id: string;
  censusGeoid: string | null;
  /** The recognisable name: "Princeton", "Washington Township". */
  name: string;
  /** "Princeton, NJ" */
  displayName: string;
  /** Two-letter state code. */
  state: string;
  stateName: string;
  county?: string;
  geographyType: CensusGeographyType;
  /**
   * The second line under the name: the state, or — when several results share
   * a name — the county (and the kind of geography if even that is not enough).
   */
  detail: string;
}

export interface GeographyRow {
  id: string;
  censusGeoid: string | null;
  censusGeographyType: CensusGeographyType;
  normalizedName: string;
  displayName: string;
  stateName: string;
  stateAbbreviation: string;
  countyName: string | null;
}

const TYPE_LABEL: Record<CensusGeographyType, string> = { place: "Census place", county_subdivision: "County subdivision" };

/** "princeton, nj" → { text: "princeton", state: "NJ" }. A trailing ", XX" that is a state becomes the filter. */
export function parseQuery(raw: string, stateFilter?: string): { text: string; state: string | undefined } {
  const trailing = raw.match(/^(.*),\s*([A-Za-z]{2})\s*$/);
  const inline = trailing ? stateByAbbreviation(trailing[2]) : undefined;
  const explicit = stateFilter ? stateByAbbreviation(stateFilter) : undefined;
  return {
    text: normalizeSearchText(inline ? trailing![1] : raw),
    state: (inline ?? explicit)?.abbreviation,
  };
}

/** Lower is better: exact name, then name prefix, then a word inside the name. */
function rank(row: GeographyRow, text: string): number {
  if (row.normalizedName === text) return 0;
  if (row.normalizedName.startsWith(text)) return 1;
  return 2;
}

/** Rank, then label. Exported for tests; `searchGeographies` is the entry point. */
export function toResults(rows: GeographyRow[], text: string, limit: number): GeographyResult[] {
  const ordered = [...rows]
    .sort(
      (a, b) =>
        rank(a, text) - rank(b, text) ||
        a.normalizedName.localeCompare(b.normalizedName) ||
        // The same municipality often exists as both a place and a county subdivision.
        (a.censusGeographyType === "place" ? 0 : 1) - (b.censusGeographyType === "place" ? 0 : 1) ||
        (a.countyName ?? "").localeCompare(b.countyName ?? ""),
    )
    .slice(0, limit);

  const groups = new Map<string, GeographyRow[]>();
  for (const r of ordered) {
    const key = r.displayName.toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  const county = (r: GeographyRow) => (r.countyName ? `${r.countyName}, ${r.stateAbbreviation}` : r.stateName);

  return ordered.map((r) => {
    const group = groups.get(r.displayName.toLowerCase())!;
    let detail = r.stateName;
    if (group.length > 1) {
      detail = county(r);
      // Same county (or both county-less) — say what kind of geography each one is.
      if (group.filter((g) => county(g) === detail).length > 1) detail = `${detail} · ${TYPE_LABEL[r.censusGeographyType]}`;
    }
    return {
      id: r.id,
      censusGeoid: r.censusGeoid,
      name: r.displayName.slice(0, r.displayName.lastIndexOf(",")),
      displayName: r.displayName,
      state: r.stateAbbreviation,
      stateName: r.stateName,
      county: r.countyName ?? undefined,
      geographyType: r.censusGeographyType,
      detail,
    };
  });
}

export async function searchGeographies(
  db: SupabaseClient,
  opts: { query: string; state?: string; limit?: number },
): Promise<GeographyResult[]> {
  const { text, state } = parseQuery(opts.query, opts.state);
  if (text.length < MIN_QUERY_LENGTH) return [];
  const limit = Math.min(Math.max(Math.trunc(opts.limit ?? DEFAULT_LIMIT), 1), MAX_LIMIT);

  // `text` holds only [a-z0-9 ], so it is safe inside the filter string; `*` is PostgREST's LIKE wildcard.
  let q = db
    .from("geographies")
    .select('id, censusGeoid, censusGeographyType, normalizedName, displayName, stateName, stateAbbreviation, countyName')
    .or(`normalizedName.like.${text}*,normalizedName.like.* ${text}*`)
    .order("normalizedName")
    .limit(limit * 4);
  if (state) q = q.eq("stateAbbreviation", state);

  const { data, error } = await q;
  if (error) throw new Error(`Geography search failed: ${error.message}`);
  return toResults((data ?? []) as GeographyRow[], text, limit);
}
