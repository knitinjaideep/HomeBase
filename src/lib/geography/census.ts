import { z } from "zod";
import { stateByFips, type UsState } from "./states";

/**
 * Census Bureau 2025 Geography Information API → typed geography records.
 * Server-side only: it needs `CENSUS_API_KEY`, which must never reach the browser.
 *
 * The API returns an array of arrays: the first row is a header, the rest are
 * values, all strings. We validate that shape, map each row into a
 * `GeographyRecord`, and report (never throw on) individual bad rows.
 *
 * Identity is the Census GEOID — never the name:
 *   place              state FIPS (2) + place FIPS (5)                   → 7 digits
 *   county subdivision state FIPS (2) + county FIPS (3) + subdivision (5) → 10 digits
 */

export const CENSUS_VINTAGE = "2025";
const CENSUS_BASE_URL = `https://api.census.gov/data/${CENSUS_VINTAGE}/geoinfo`;

export type CensusGeographyType = "place" | "county_subdivision";

interface LevelSpec {
  type: CensusGeographyType;
  /** Census summary level code. */
  level: "160" | "060";
  /** The `for=` geography, already URL-encoded. */
  forClause: string;
  /** Header name of this geography's own FIPS column. */
  fipsColumn: string;
}

export const CENSUS_LEVELS: Record<CensusGeographyType, LevelSpec> = {
  place: { type: "place", level: "160", forClause: "place:*", fipsColumn: "place" },
  county_subdivision: { type: "county_subdivision", level: "060", forClause: "county%20subdivision:*", fipsColumn: "county subdivision" },
};

export interface GeographyRecord {
  censusGeographyType: CensusGeographyType;
  censusGeographyLevel: "160" | "060";
  censusGeoid: string;
  stateFips: string;
  countyFips: string | null;
  placeFips: string | null;
  countySubdivisionFips: string | null;
  /** Official Census NAME, kept as received. */
  name: string;
  normalizedName: string;
  /** "Princeton, NJ" */
  displayName: string;
  stateName: string;
  stateAbbreviation: string;
  countyName: string | null;
  source: "census";
  sourceVintage: string;
}

export interface RejectedRow {
  row: string[];
  reason: string;
}

export class CensusResponseError extends Error {}

const censusTable = z.array(z.array(z.string().nullable())).min(1);
const FIPS = { state: /^\d{2}$/, county: /^\d{3}$/, place: /^\d{5}$/, countySubdivision: /^\d{5}$/ };

/** Lowercase, accents and punctuation removed, single spaces: "St. Mary's" → "st mary s". */
export function normalizeSearchText(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * The name people recognise: the Census legal descriptor is dropped where it is
 * only a classification ("Princeton borough" → "Princeton", "Atlantic City city"
 * → "Atlantic City", "Lawrenceville CDP" → "Lawrenceville") but kept where it is
 * part of how the town is named ("West Windsor township" → "West Windsor Township").
 * Only the lowercase suffix Census appends is stripped, so a name that itself
 * ends in "City" or "Town" is left alone.
 */
export function displayBaseName(censusName: string): string {
  const stripped = censusName.replace(/\s+(borough|city|town|village|municipality|CDP)$/, "");
  return stripped.replace(/\s+(township|plantation)$/, (m) => ` ${m.trim()[0].toUpperCase()}${m.trim().slice(1)}`);
}

/**
 * Split a Census NAME: "Princeton borough, New Jersey" (place) or
 * "Washington township, Morris County, New Jersey" (county subdivision).
 */
export function parseCensusName(name: string): { local: string; county: string | null; state: string } | null {
  const parts = name.split(",").map((p) => p.trim());
  if (parts.length === 2 && parts[0]) return { local: parts[0], county: null, state: parts[1] };
  if (parts.length === 3 && parts[0] && parts[1]) return { local: parts[0], county: parts[1], state: parts[2] };
  return null;
}

/**
 * Turn a Census Data API response into records. Throws `CensusResponseError`
 * when the response is not the expected table at all; rows that are individually
 * unusable (bad FIPS, unexpected name, "not defined" placeholders) come back in
 * `rejected` so one bad row never blocks an import.
 */
export function parseCensusResponse(
  json: unknown,
  type: CensusGeographyType,
  state: UsState,
): { records: GeographyRecord[]; rejected: RejectedRow[] } {
  const table = censusTable.safeParse(json);
  if (!table.success) throw new CensusResponseError("Census response is not an array of string rows");
  const [header, ...rows] = table.data;
  const col = new Map(header.map((h, i) => [h ?? "", i]));
  const spec = CENSUS_LEVELS[type];
  for (const required of ["NAME", "state", spec.fipsColumn]) {
    if (!col.has(required)) throw new CensusResponseError(`Census response is missing the "${required}" column`);
  }
  const at = (row: (string | null)[], name: string) => (col.has(name) ? row[col.get(name)!] ?? null : null);

  const records: GeographyRecord[] = [];
  const rejected: RejectedRow[] = [];
  const reject = (row: (string | null)[], reason: string) => rejected.push({ row: row.map((c) => c ?? ""), reason });

  for (const row of rows) {
    if (row.length !== header.length) {
      reject(row, "row length does not match header");
      continue;
    }
    const name = at(row, "NAME");
    const stateFips = at(row, "state");
    const ownFips = at(row, spec.fipsColumn);
    const countyFips = at(row, "county");
    if (!name || !stateFips || !ownFips) {
      reject(row, "missing NAME or FIPS value");
      continue;
    }
    if (!FIPS.state.test(stateFips) || stateFips !== state.fips) {
      reject(row, `unexpected state FIPS ${stateFips}`);
      continue;
    }
    if (!FIPS.place.test(ownFips) || (countyFips !== null && !FIPS.county.test(countyFips))) {
      reject(row, "malformed FIPS code");
      continue;
    }
    if (/not defined/i.test(name)) {
      reject(row, "placeholder geography");
      continue;
    }
    if (type === "county_subdivision" && !countyFips) {
      // Without the county there is no complete GEOID; never guess one.
      reject(row, "county subdivision without a county FIPS");
      continue;
    }
    const parsed = parseCensusName(name);
    if (!parsed || parsed.state !== state.name) {
      reject(row, "unexpected NAME format");
      continue;
    }
    const base = displayBaseName(parsed.local);
    records.push({
      censusGeographyType: type,
      censusGeographyLevel: spec.level,
      censusGeoid: type === "place" ? `${stateFips}${ownFips}` : `${stateFips}${countyFips}${ownFips}`,
      stateFips,
      countyFips: type === "county_subdivision" ? countyFips : null,
      placeFips: type === "place" ? ownFips : null,
      countySubdivisionFips: type === "county_subdivision" ? ownFips : null,
      name,
      normalizedName: normalizeSearchText(base),
      displayName: `${base}, ${state.abbreviation}`,
      stateName: state.name,
      stateAbbreviation: state.abbreviation,
      countyName: parsed.county,
      source: "census",
      sourceVintage: CENSUS_VINTAGE,
    });
  }
  return { records, rejected };
}

/** The request URL. Contains the API key — never log it; use `redactKey`. */
export function censusUrl(type: CensusGeographyType, stateFips: string, apiKey: string, withCounty = false): string {
  const { forClause } = CENSUS_LEVELS[type];
  const inClause = withCounty ? `state:${stateFips}%20county:*` : `state:${stateFips}`;
  return `${CENSUS_BASE_URL}?get=NAME&for=${forClause}&in=${inClause}&key=${encodeURIComponent(apiKey)}`;
}

export function redactKey(text: string, apiKey: string): string {
  return apiKey ? text.split(apiKey).join("[redacted]").split(encodeURIComponent(apiKey)).join("[redacted]") : text;
}

export type FetchLike = (url: string) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

async function requestTable(fetchImpl: FetchLike, url: string, apiKey: string): Promise<unknown> {
  let res;
  try {
    res = await fetchImpl(url);
  } catch (err) {
    throw new CensusResponseError(redactKey(`Census request failed: ${err instanceof Error ? err.message : String(err)}`, apiKey));
  }
  const body = await res.text();
  if (!res.ok) throw new CensusResponseError(redactKey(`Census API returned HTTP ${res.status}: ${body.slice(0, 200)}`, apiKey));
  try {
    return JSON.parse(body);
  } catch {
    throw new CensusResponseError(redactKey(`Census API returned non-JSON: ${body.slice(0, 200)}`, apiKey));
  }
}

/**
 * Fetch one geography level for a state. County subdivisions are requested
 * exactly as documented (`in=state:NN`); if the API rejects that or answers
 * without the county column, one retry adds `county:*` so the county FIPS —
 * needed for a complete GEOID — comes back.
 */
export async function fetchCensusGeographies(
  type: CensusGeographyType,
  state: UsState,
  apiKey: string,
  fetchImpl: FetchLike,
): Promise<{ records: GeographyRecord[]; rejected: RejectedRow[] }> {
  if (!apiKey) throw new CensusResponseError("CENSUS_API_KEY is not set");
  if (!stateByFips(state.fips)) throw new CensusResponseError(`Unknown state FIPS ${state.fips}`);
  const attempt = async (withCounty: boolean) =>
    parseCensusResponse(await requestTable(fetchImpl, censusUrl(type, state.fips, apiKey, withCounty), apiKey), type, state);
  if (type === "place") return attempt(false);
  try {
    const first = await attempt(false);
    // Every row rejected for a missing county means the county column was absent.
    if (first.records.length > 0 || first.rejected.length === 0) return first;
  } catch (err) {
    if (!(err instanceof CensusResponseError)) throw err;
  }
  return attempt(true);
}
