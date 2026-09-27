import {
  fetchCensusGeographies,
  type CensusGeographyType,
  type FetchLike,
  type GeographyRecord,
} from "./census";
import type { UsState } from "./states";

/**
 * Idempotent geography import: fetch from Census, compare with what is stored,
 * write only what is new or changed. Storage is behind `GeographyStore` so the
 * same logic runs against Supabase (the sync command) and an in-memory store
 * (tests). A geography is identified by (level, GEOID), never by name.
 */

export interface GeographyStore {
  /** Everything already stored for a state, keyed by `geographyKey`. */
  loadExisting(stateFips: string): Promise<Map<string, GeographyRecord>>;
  upsert(records: GeographyRecord[]): Promise<void>;
}

export interface SyncCounts {
  fetched: number;
  inserted: number;
  updated: number;
  /** Already stored and identical — nothing written. */
  skipped: number;
  /** Rows Census returned that could not be used (malformed, placeholder). */
  rejected: number;
}

export type SyncReport = Record<CensusGeographyType, SyncCounts>;

export const geographyKey = (r: Pick<GeographyRecord, "censusGeographyLevel" | "censusGeoid">) =>
  `${r.censusGeographyLevel}:${r.censusGeoid}`;

const COMPARED: (keyof GeographyRecord)[] = [
  "censusGeographyType", "stateFips", "countyFips", "placeFips", "countySubdivisionFips", "name", "normalizedName",
  "displayName", "stateName", "stateAbbreviation", "countyName", "source", "sourceVintage",
];

function unchanged(a: GeographyRecord, b: GeographyRecord): boolean {
  return COMPARED.every((k) => a[k] === b[k]);
}

export async function syncState(opts: {
  state: UsState;
  apiKey: string;
  fetchImpl: FetchLike;
  store: GeographyStore;
  /** Fetch and count, but write nothing. */
  dryRun?: boolean;
}): Promise<SyncReport> {
  const { state, apiKey, fetchImpl, store, dryRun = false } = opts;
  const existing = await store.loadExisting(state.fips);
  const report = {} as SyncReport;

  for (const type of ["place", "county_subdivision"] as const) {
    const { records, rejected } = await fetchCensusGeographies(type, state, apiKey, fetchImpl);
    // A repeated key inside one response would make the upsert ambiguous; last one wins.
    const unique = new Map(records.map((r) => [geographyKey(r), r]));
    const changed: GeographyRecord[] = [];
    const counts: SyncCounts = { fetched: records.length, inserted: 0, updated: 0, skipped: 0, rejected: rejected.length };
    for (const [key, record] of unique) {
      const stored = existing.get(key);
      if (!stored) counts.inserted++;
      else if (!unchanged(stored, record)) counts.updated++;
      else {
        counts.skipped++;
        continue;
      }
      changed.push(record);
    }
    counts.skipped += records.length - unique.size;
    if (!dryRun && changed.length > 0) await store.upsert(changed);
    report[type] = counts;
  }
  return report;
}
