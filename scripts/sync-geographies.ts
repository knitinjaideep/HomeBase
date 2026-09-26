/**
 * Import Census geographies (places and county subdivisions) into the
 * `geographies` table. Operator tool — run by hand, never by the app or CI.
 *
 *   npm run sync:geographies -- --state=NJ --dry-run   # fetch and count, write nothing
 *   npm run sync:geographies -- --state=NJ --yes       # write to the Supabase project in .env.local
 *   npm run sync:geographies -- --state=NJ,NY --yes    # several states
 *
 * Needs (server-side only, from .env.local): CENSUS_API_KEY, and for real writes
 * NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY. Idempotent: re-running
 * changes nothing that has not changed at Census. No secret is ever printed.
 */
import { createClient } from "@supabase/supabase-js";
import type { GeographyRecord } from "../src/lib/geography/census";
import { geographyKey, syncState, type GeographyStore } from "../src/lib/geography/sync";
import { stateByAbbreviation } from "../src/lib/geography/states";

const PAGE = 1000;
const BATCH = 500;

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv: string[]) {
  const value = (name: string) => argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
  return {
    states: (value("state") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    dryRun: argv.includes("--dry-run"),
    yes: argv.includes("--yes"),
  };
}

function supabaseStore(url: string, serviceKey: string): GeographyStore {
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return {
    async loadExisting(stateFips) {
      const out = new Map<string, GeographyRecord>();
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await db.from("geographies").select("*").eq("stateFips", stateFips).range(from, from + PAGE - 1);
        if (error) throw new Error(`Reading geographies failed: ${error.message}`);
        for (const row of data as GeographyRecord[]) out.set(geographyKey(row), row);
        if (data.length < PAGE) return out;
      }
    },
    async upsert(records) {
      for (let i = 0; i < records.length; i += BATCH) {
        const { error } = await db
          .from("geographies")
          .upsert(records.slice(i, i + BATCH).map((r) => ({ ...r, updatedAt: new Date().toISOString() })), {
            onConflict: "censusGeographyLevel,censusGeoid",
          });
        if (error) throw new Error(`Writing geographies failed: ${error.message}`);
      }
    },
  };
}

async function main() {
  const { states, dryRun, yes } = parseArgs(process.argv.slice(2));
  if (states.length === 0) fail("Usage: npm run sync:geographies -- --state=NJ [--dry-run | --yes]");
  const resolved = states.map((s) => stateByAbbreviation(s) ?? fail(`Unknown state "${s}". Use a two-letter code such as NJ.`));

  const apiKey = process.env.CENSUS_API_KEY;
  if (!apiKey) fail("CENSUS_API_KEY is not set (put it in .env.local; it is server-side only).");

  let store: GeographyStore;
  if (dryRun) {
    // Nothing stored is consulted, so a dry run reports everything as new.
    store = { loadExisting: async () => new Map(), upsert: async () => {} };
    console.log("Dry run: fetching from Census, writing nothing.");
  } else {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) fail("Writing needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
    if (!yes) fail(`This will write to ${new URL(url).host}. Re-run with --yes to confirm, or --dry-run to preview.`);
    console.log(`Writing to ${new URL(url).host}`);
    store = supabaseStore(url, serviceKey);
  }

  for (const state of resolved) {
    const report = await syncState({
      state,
      apiKey,
      fetchImpl: (u) => fetch(u),
      store,
      dryRun,
    });
    for (const [type, c] of Object.entries(report)) {
      console.log(
        `${state.abbreviation} ${type}: fetched ${c.fetched}, inserted ${c.inserted}, updated ${c.updated}, skipped ${c.skipped}, rejected ${c.rejected}`,
      );
    }
  }
}

main().catch((err) => {
  // Census errors are already redacted; Supabase errors never contain the key.
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
