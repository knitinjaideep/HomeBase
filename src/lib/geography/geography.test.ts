import { describe, expect, it } from "vitest";
import {
  CensusResponseError,
  censusUrl,
  displayBaseName,
  fetchCensusGeographies,
  normalizeSearchText,
  parseCensusResponse,
  redactKey,
  type FetchLike,
  type GeographyRecord,
} from "./census";
import { geographyKey, syncState, type GeographyStore } from "./sync";
import { parseQuery, searchGeographies, toResults, type GeographyRow } from "./search";
import { stateByAbbreviation } from "./states";
import type { SupabaseClient } from "@supabase/supabase-js";

const NJ = stateByAbbreviation("NJ")!;
const KEY = "secret-key-123";

const PLACES = [
  ["NAME", "state", "place"],
  ["Princeton borough, New Jersey", "34", "60900"],
  ["Plainsboro CDP, New Jersey", "34", "premature"], // malformed FIPS → rejected
  ["Atlantic City city, New Jersey", "34", "02080"],
];
const SUBDIVISIONS = [
  ["NAME", "state", "county", "county subdivision"],
  ["Princeton borough, Mercer County, New Jersey", "34", "021", "60900"],
  ["West Windsor township, Mercer County, New Jersey", "34", "021", "77840"],
  ["Washington township, Morris County, New Jersey", "34", "027", "76070"],
  ["Washington township, Warren County, New Jersey", "34", "041", "76100"],
  ["County subdivisions not defined, Atlantic County, New Jersey", "34", "001", "00000"],
];

/** A fake Census: answers by level, and (like the real one may) omits county unless asked. */
function fakeCensus(opts: { needCountyParam?: boolean } = {}): { fetch: FetchLike; urls: string[] } {
  const urls: string[] = [];
  return {
    urls,
    fetch: async (url) => {
      urls.push(url);
      if (url.includes("for=place")) return { ok: true, status: 200, text: async () => JSON.stringify(PLACES) };
      if (opts.needCountyParam && !url.includes("county:*")) return { ok: false, status: 400, text: async () => "error: unsupported geography hierarchy" };
      return { ok: true, status: 200, text: async () => JSON.stringify(SUBDIVISIONS) };
    },
  };
}

function memoryStore(): GeographyStore & { rows: Map<string, GeographyRecord>; writes: number } {
  const store = {
    rows: new Map<string, GeographyRecord>(),
    writes: 0,
    loadExisting: async () => new Map(store.rows),
    upsert: async (records: GeographyRecord[]) => {
      store.writes += records.length;
      for (const r of records) store.rows.set(geographyKey(r), r);
    },
  };
  return store;
}

describe("Census response parsing", () => {
  it("builds the documented URLs with the key only in the query string", () => {
    expect(censusUrl("place", "34", KEY)).toBe(`https://api.census.gov/data/2025/geoinfo?get=NAME&for=place:*&in=state:34&key=${KEY}`);
    expect(censusUrl("county_subdivision", "34", KEY)).toBe(
      `https://api.census.gov/data/2025/geoinfo?get=NAME&for=county%20subdivision:*&in=state:34&key=${KEY}`,
    );
    expect(redactKey(`GET ${censusUrl("place", "34", KEY)} failed`, KEY)).not.toContain(KEY);
  });

  it("parses places: 7-digit GEOID, official name kept, friendly display", () => {
    const { records, rejected } = parseCensusResponse(PLACES, "place", NJ);
    const princeton = records.find((r) => r.placeFips === "60900")!;
    expect(princeton).toMatchObject({
      censusGeographyType: "place",
      censusGeographyLevel: "160",
      censusGeoid: "3460900",
      name: "Princeton borough, New Jersey",
      displayName: "Princeton, NJ",
      normalizedName: "princeton",
      countyName: null,
      countyFips: null,
      source: "census",
      sourceVintage: "2025",
    });
    expect(records.find((r) => r.name.startsWith("Atlantic City"))?.displayName).toBe("Atlantic City, NJ");
    expect(rejected).toHaveLength(1);
  });

  it("parses county subdivisions: 10-digit GEOID from state + county + subdivision, with county", () => {
    const { records, rejected } = parseCensusResponse(SUBDIVISIONS, "county_subdivision", NJ);
    const ww = records.find((r) => r.countySubdivisionFips === "77840")!;
    expect(ww).toMatchObject({
      censusGeographyLevel: "060",
      censusGeoid: "3402177840",
      countyFips: "021",
      countyName: "Mercer County",
      displayName: "West Windsor Township, NJ",
      normalizedName: "west windsor township",
    });
    expect(rejected.map((r) => r.reason)).toEqual(["placeholder geography"]);
  });

  it("never rejects or merges same-named townships: each keeps its own GEOID", () => {
    const { records } = parseCensusResponse(SUBDIVISIONS, "county_subdivision", NJ);
    const washingtons = records.filter((r) => r.displayName === "Washington Township, NJ");
    expect(washingtons.map((r) => r.censusGeoid)).toEqual(["3402776070", "3404176100"]);
  });

  it("refuses a county subdivision row that has no county (no guessed GEOID)", () => {
    const noCounty = [["NAME", "state", "county subdivision"], ["Washington township, Morris County, New Jersey", "34", "76070"]];
    const { records, rejected } = parseCensusResponse(noCounty, "county_subdivision", NJ);
    expect(records).toEqual([]);
    expect(rejected[0].reason).toContain("county");
  });

  it("throws on a response that is not the expected table", () => {
    expect(() => parseCensusResponse({ error: "bad" }, "place", NJ)).toThrow(CensusResponseError);
    expect(() => parseCensusResponse([["NAME", "state"]], "place", NJ)).toThrow(/place/);
    expect(() => parseCensusResponse([], "place", NJ)).toThrow(CensusResponseError);
  });

  it("rejects rows for the wrong state", () => {
    const wrong = [["NAME", "state", "place"], ["Albany city, New York", "36", "01000"]];
    expect(parseCensusResponse(wrong, "place", NJ).rejected).toHaveLength(1);
  });

  it("normalizes names without stripping meaningful ones", () => {
    expect(displayBaseName("Princeton borough")).toBe("Princeton");
    expect(displayBaseName("Jersey City city")).toBe("Jersey City");
    expect(displayBaseName("Lawrenceville CDP")).toBe("Lawrenceville");
    expect(displayBaseName("Washington township")).toBe("Washington Township");
    expect(displayBaseName("Ocean City")).toBe("Ocean City");
    expect(normalizeSearchText("St. Mary’s  Township")).toBe("st mary s township");
  });
});

describe("fetching", () => {
  it("retries county subdivisions with county:* when the plain request is refused", async () => {
    const census = fakeCensus({ needCountyParam: true });
    const { records } = await fetchCensusGeographies("county_subdivision", NJ, KEY, census.fetch);
    expect(records).toHaveLength(4);
    expect(census.urls).toHaveLength(2);
    expect(census.urls[1]).toContain("in=state:34%20county:*");
  });

  it("does not leak the API key in errors", async () => {
    const failing: FetchLike = async () => ({ ok: false, status: 400, text: async () => `invalid key ${KEY}` });
    await expect(fetchCensusGeographies("place", NJ, KEY, failing)).rejects.toThrow(/HTTP 400/);
    await fetchCensusGeographies("place", NJ, KEY, failing).catch((e: Error) => expect(e.message).not.toContain(KEY));
  });

  it("requires a key", async () => {
    await expect(fetchCensusGeographies("place", NJ, "", fakeCensus().fetch)).rejects.toThrow(/CENSUS_API_KEY/);
  });
});

describe("syncState", () => {
  it("imports places and county subdivisions, counting inserts and rejects", async () => {
    const store = memoryStore();
    const report = await syncState({ state: NJ, apiKey: KEY, fetchImpl: fakeCensus().fetch, store });
    expect(report.place).toEqual({ fetched: 2, inserted: 2, updated: 0, skipped: 0, rejected: 1 });
    expect(report.county_subdivision).toEqual({ fetched: 4, inserted: 4, updated: 0, skipped: 0, rejected: 1 });
    expect(store.rows.size).toBe(6);
  });

  it("is idempotent: a second run writes nothing and creates no duplicates", async () => {
    const store = memoryStore();
    await syncState({ state: NJ, apiKey: KEY, fetchImpl: fakeCensus().fetch, store });
    const writesAfterFirst = store.writes;
    const second = await syncState({ state: NJ, apiKey: KEY, fetchImpl: fakeCensus().fetch, store });
    expect(second.place).toMatchObject({ inserted: 0, updated: 0, skipped: 2 });
    expect(second.county_subdivision).toMatchObject({ inserted: 0, updated: 0, skipped: 4 });
    expect(store.writes).toBe(writesAfterFirst);
    expect(store.rows.size).toBe(6);
  });

  it("updates only rows whose Census values changed", async () => {
    const store = memoryStore();
    await syncState({ state: NJ, apiKey: KEY, fetchImpl: fakeCensus().fetch, store });
    const key = "160:3460900";
    store.rows.set(key, { ...store.rows.get(key)!, name: "Princeton (old name), New Jersey" });
    const report = await syncState({ state: NJ, apiKey: KEY, fetchImpl: fakeCensus().fetch, store });
    expect(report.place).toMatchObject({ inserted: 0, updated: 1, skipped: 1 });
    expect(store.rows.get(key)!.name).toBe("Princeton borough, New Jersey");
  });

  it("a dry run writes nothing", async () => {
    const store = memoryStore();
    const report = await syncState({ state: NJ, apiKey: KEY, fetchImpl: fakeCensus().fetch, store, dryRun: true });
    expect(report.place.inserted).toBe(2);
    expect(store.rows.size).toBe(0);
  });

  it("works for any state without code changes", async () => {
    const NY = stateByAbbreviation("ny")!;
    expect(NY.fips).toBe("36");
    const fetchNy: FetchLike = async (url) => {
      expect(url).toContain("in=state:36");
      const body = url.includes("for=place")
        ? [["NAME", "state", "place"], ["Albany city, New York", "36", "01000"]]
        : [["NAME", "state", "county", "county subdivision"]];
      return { ok: true, status: 200, text: async () => JSON.stringify(body) };
    };
    const store = memoryStore();
    const report = await syncState({ state: NY, apiKey: KEY, fetchImpl: fetchNy, store });
    expect(report.place.inserted).toBe(1);
    expect(store.rows.get("160:3601000")?.displayName).toBe("Albany, NY");
  });
});

// ---- search ----------------------------------------------------------------

async function seeded(): Promise<GeographyRow[]> {
  const store = memoryStore();
  await syncState({ state: NJ, apiKey: KEY, fetchImpl: fakeCensus().fetch, store });
  return [...store.rows.values()].map((r, i) => ({
    id: `id-${i}`,
    censusGeoid: r.censusGeoid,
    censusGeographyType: r.censusGeographyType,
    normalizedName: r.normalizedName,
    displayName: r.displayName,
    stateName: r.stateName,
    stateAbbreviation: r.stateAbbreviation,
    countyName: r.countyName,
  }));
}

/** Emulates the PostgREST query `searchGeographies` builds, over in-memory rows. */
function fakeDb(rows: GeographyRow[]) {
  const calls: { or?: string; state?: string } = {};
  const builder = {
    select: () => builder,
    or: (filter: string) => ((calls.or = filter), builder),
    order: () => builder,
    limit: () => builder,
    eq: (_col: string, value: string) => ((calls.state = value), builder),
    then: (resolve: (v: { data: GeographyRow[]; error: null }) => void) => {
      const [prefix, word] = calls.or!.split(",").map((p) => p.replace(/^normalizedName\.like\./, "").replace(/\*$/, "").replace(/^\*/, ""));
      const data = rows.filter(
        (r) => (!calls.state || r.stateAbbreviation === calls.state) && (r.normalizedName.startsWith(prefix) || r.normalizedName.includes(word)),
      );
      resolve({ data, error: null });
    },
  };
  return { db: { from: () => builder } as unknown as SupabaseClient, calls };
}

describe("search", () => {
  it("finds Princeton by a two-letter-plus prefix, case-insensitively", async () => {
    const { db } = fakeDb(await seeded());
    const results = await searchGeographies(db, { query: "PRINC", state: "NJ" });
    expect(results.map((r) => r.displayName)).toEqual(["Princeton, NJ", "Princeton, NJ"]);
    expect(results[0]).toMatchObject({ name: "Princeton", state: "NJ", stateName: "New Jersey", geographyType: "place" });
  });

  it("finds West Windsor, including by a later word", async () => {
    const { db } = fakeDb(await seeded());
    expect((await searchGeographies(db, { query: "west wind" }))[0]).toMatchObject({ name: "West Windsor Township", county: "Mercer County" });
    expect((await searchGeographies(db, { query: "windsor" })).map((r) => r.name)).toEqual(["West Windsor Township"]);
  });

  it("disambiguates duplicate names by county, then by type when the county is not enough", async () => {
    const { db } = fakeDb(await seeded());
    const washington = await searchGeographies(db, { query: "washington" });
    expect(washington.map((r) => [r.name, r.detail])).toEqual([
      ["Washington Township", "Morris County, NJ"],
      ["Washington Township", "Warren County, NJ"],
    ]);
    const princeton = await searchGeographies(db, { query: "princeton" });
    expect(princeton.map((r) => r.detail)).toEqual(["New Jersey", "Mercer County, NJ"]);
    expect(princeton.every((r) => r.id.startsWith("id-"))).toBe(true);
  });

  it("adds the geography type when two results share name and county", () => {
    const row = (id: string, type: GeographyRow["censusGeographyType"]): GeographyRow => ({
      id, censusGeoid: id, censusGeographyType: type, normalizedName: "x", displayName: "X, NJ", stateName: "New Jersey", stateAbbreviation: "NJ", countyName: null,
    });
    expect(toResults([row("a", "place"), row("b", "county_subdivision")], "x", 10).map((r) => r.detail)).toEqual([
      "New Jersey · Census place",
      "New Jersey · County subdivision",
    ]);
  });

  it("does nothing under 2 characters and sanitizes the query", async () => {
    const { db, calls } = fakeDb(await seeded());
    expect(await searchGeographies(db, { query: "p" })).toEqual([]);
    expect(calls.or).toBeUndefined();
    await searchGeographies(db, { query: "pr%,(x)*" });
    expect(calls.or).toBe("normalizedName.like.pr x*,normalizedName.like.* pr x*");
  });

  it("reads a trailing state code as a filter", async () => {
    expect(parseQuery("Princeton, NJ")).toEqual({ text: "princeton", state: "NJ" });
    expect(parseQuery("Princeton", "ny")).toEqual({ text: "princeton", state: "NY" });
    expect(parseQuery("Princeton, zz")).toEqual({ text: "princeton zz", state: undefined });
    const { db, calls } = fakeDb(await seeded());
    await searchGeographies(db, { query: "Princeton, PA" });
    expect(calls.state).toBe("PA");
  });

  it("limits results to at most 10", async () => {
    const many: GeographyRow[] = Array.from({ length: 30 }, (_, i) => ({
      id: `m${i}`, censusGeoid: `${i}`, censusGeographyType: "place", normalizedName: `mount ${i}`, displayName: `Mount ${i}, NJ`,
      stateName: "New Jersey", stateAbbreviation: "NJ", countyName: null,
    }));
    const { db } = fakeDb(many);
    expect(await searchGeographies(db, { query: "mount", limit: 50 })).toHaveLength(10);
  });
});
