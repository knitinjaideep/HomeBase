import type { SupabaseClient } from "@supabase/supabase-js";
import type { HomeScopeDB } from "./db";
import { backupSchema, CURRENT_SCHEMA_VERSION, type Backup, type BackupData } from "./models";

const SNAPSHOT_KEY = "homescope:pre-import-snapshot";

/**
 * Everything below this point reads/writes the *legacy local Dexie store*.
 * That store is no longer written to by the live app (Supabase is
 * authoritative) — it is kept only so the one-time local-data migration can
 * read whatever a browser already has. See `collectBackupFromSupabase` /
 * `importBackupToCloud` further down for the live, cloud-backed path.
 */

/** Every table in the database, in one place so backup stays exhaustive. */
function allTables(db: HomeScopeDB) {
  return [
    db.householdProfile,
    db.financialProfile,
    db.homePreferences,
    db.appSettings,
    db.properties,
    db.visits,
    db.scenarios,
    db.lenderQuotes,
    db.checklists,
    db.tasks,
    db.towns,
    db.journeyStages,
    db.journeyActions,
    db.journeyDecisions,
    db.attendingTransition,
    db.mortgageApprovals,
    db.professionals,
    db.resources,
    db.documents,
    db.deals,
  ];
}

/** Read the entire database into a validated backup envelope. */
export async function collectBackup(db: HomeScopeDB): Promise<Backup> {
  const [
    householdProfile,
    financialProfile,
    homePreferences,
    appSettings,
    properties,
    visits,
    scenarios,
    lenderQuotes,
    checklists,
    tasks,
    towns,
    journeyStages,
    journeyActions,
    journeyDecisions,
    attendingTransition,
    mortgageApprovals,
    professionals,
    resources,
    documents,
    deals,
  ] = await Promise.all([
    db.householdProfile.toArray(),
    db.financialProfile.toArray(),
    db.homePreferences.toArray(),
    db.appSettings.toArray(),
    db.properties.toArray(),
    db.visits.toArray(),
    db.scenarios.toArray(),
    db.lenderQuotes.toArray(),
    db.checklists.toArray(),
    db.tasks.toArray(),
    db.towns.toArray(),
    db.journeyStages.toArray(),
    db.journeyActions.toArray(),
    db.journeyDecisions.toArray(),
    db.attendingTransition.toArray(),
    db.mortgageApprovals.toArray(),
    db.professionals.toArray(),
    db.resources.toArray(),
    db.documents.toArray(),
    db.deals.toArray(),
  ]);

  return {
    app: "HomeScope",
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      householdProfile,
      financialProfile,
      homePreferences,
      appSettings,
      properties,
      visits,
      scenarios,
      lenderQuotes,
      checklists,
      tasks,
      towns,
      journeyStages,
      journeyActions,
      journeyDecisions,
      attendingTransition,
      mortgageApprovals,
      professionals,
      resources,
      documents,
      deals,
    },
  };
}

/** A timestamped filename such as homescope-backup-2026-07-23-2014.json. */
export function backupFileName(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(
    date.getHours(),
  )}${pad(date.getMinutes())}`;
  return `homescope-backup-${stamp}.json`;
}

/** Trigger a browser download of a JSON blob. */
export function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Export everything and mark the backup timestamp on AppSettings. */
export async function exportAll(db: HomeScopeDB): Promise<void> {
  const backup = await collectBackup(db);
  downloadJson(backupFileName(), backup);
  const settings = await db.appSettings.toArray();
  if (settings[0]) {
    await db.appSettings.update(settings[0].id, {
      lastBackupAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

export type ParseResult =
  | { ok: true; backup: Backup }
  | { ok: false; error: string };

/** Validate a candidate import file with Zod. Never trusts the file blindly. */
export function parseBackup(text: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "The file is not valid JSON." };
  }
  const result = backupSchema.safeParse(json);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first?.path.join(".") || "(root)";
    return {
      ok: false,
      error: `This does not look like a HomeScope backup. First problem at "${path}": ${
        first?.message ?? "unknown"
      }.`,
    };
  }
  return { ok: true, backup: result.data };
}

/** Human-readable counts for the import preview. */
export function summarizeBackup(data: BackupData): { label: string; count: number }[] {
  return [
    { label: "Properties", count: data.properties.length },
    { label: "Visits", count: data.visits.length },
    { label: "Saved scenarios", count: data.scenarios.length },
    { label: "Lender quotes", count: data.lenderQuotes.length },
    { label: "Checklists", count: data.checklists.length },
    { label: "Tasks", count: data.tasks.length },
    { label: "Towns", count: data.towns.length },
    { label: "Journey steps touched", count: data.journeyActions.length },
    { label: "Journey decisions", count: data.journeyDecisions.length },
    { label: "Mortgage approvals", count: data.mortgageApprovals.length },
    { label: "Professionals", count: data.professionals.length },
    { label: "Resources", count: data.resources.length },
    { label: "Documents indexed", count: data.documents.length },
    { label: "Property deals", count: data.deals.length },
  ];
}

/** Save the current database to localStorage as an automatic pre-import snapshot. */
export async function snapshotBeforeImport(db: HomeScopeDB): Promise<void> {
  const backup = await collectBackup(db);
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(backup));
  } catch {
    // localStorage may be unavailable or full; the import UI still warns the user.
  }
}

/** Whether a pre-import snapshot is available to roll back to. */
export function hasSnapshot(): boolean {
  try {
    return localStorage.getItem(SNAPSHOT_KEY) !== null;
  } catch {
    return false;
  }
}

/** Read the stored snapshot, if any. */
export function readSnapshot(): Backup | null {
  try {
    const text = localStorage.getItem(SNAPSHOT_KEY);
    if (!text) return null;
    const parsed = parseBackup(text);
    return parsed.ok ? parsed.backup : null;
  } catch {
    return null;
  }
}

/** Replace all data in the legacy local database with the contents of a validated backup. */
export async function replaceAllData(db: HomeScopeDB, backup: Backup): Promise<void> {
  const d = backup.data;
  await db.transaction("rw", allTables(db), async () => {
    await Promise.all(allTables(db).map((table) => table.clear()));
    await Promise.all([
      db.householdProfile.bulkPut(d.householdProfile),
      db.financialProfile.bulkPut(d.financialProfile),
      db.homePreferences.bulkPut(d.homePreferences),
      db.appSettings.bulkPut(d.appSettings),
      db.properties.bulkPut(d.properties),
      db.visits.bulkPut(d.visits),
      db.scenarios.bulkPut(d.scenarios),
      db.lenderQuotes.bulkPut(d.lenderQuotes),
      db.checklists.bulkPut(d.checklists),
      db.tasks.bulkPut(d.tasks),
      db.towns.bulkPut(d.towns),
      db.journeyStages.bulkPut(d.journeyStages),
      db.journeyActions.bulkPut(d.journeyActions),
      db.journeyDecisions.bulkPut(d.journeyDecisions),
      db.attendingTransition.bulkPut(d.attendingTransition),
      db.mortgageApprovals.bulkPut(d.mortgageApprovals),
      db.professionals.bulkPut(d.professionals),
      db.resources.bulkPut(d.resources),
      db.documents.bulkPut(d.documents),
      db.deals.bulkPut(d.deals),
    ]);
  });
}

// ---------------------------------------------------------------------------
// Cloud (Supabase) — the live backup path. Settings → Data → Export backup
// and the one-time local-data migration both go through these.
// ---------------------------------------------------------------------------

/** Maps each backup envelope key to its Postgres table name. */
const CLOUD_TABLES: Record<keyof BackupData, string> = {
  householdProfile: "buyerProfile",
  financialProfile: "financialProfile",
  homePreferences: "homePreferences",
  appSettings: "appSettings",
  properties: "properties",
  visits: "propertyVisits",
  scenarios: "mortgageScenarios",
  lenderQuotes: "lenderQuotes",
  checklists: "checklists",
  tasks: "checklistTasks",
  towns: "towns",
  journeyStages: "journeyStages",
  journeyActions: "journeyActions",
  journeyDecisions: "journeyDecisions",
  attendingTransition: "attendingTransition",
  mortgageApprovals: "mortgageApprovals",
  professionals: "professionals",
  resources: "resources",
  documents: "documents",
  deals: "deals",
};

/** Read the household's entire Supabase database into a validated backup envelope. */
export async function collectBackupFromSupabase(
  supabase: SupabaseClient,
  householdId: string,
): Promise<Backup> {
  const entries = Object.entries(CLOUD_TABLES) as [keyof BackupData, string][];
  const results = await Promise.all(
    entries.map(([, table]) => supabase.from(table).select("*").eq("householdId", householdId)),
  );

  const data = {} as BackupData;
  entries.forEach(([key], i) => {
    const { data: rows, error } = results[i];
    if (error) throw new Error(`Could not read ${key}: ${error.message}`);
    (data as Record<string, unknown>)[key] = rows ?? [];
  });

  return backupSchema.parse({
    app: "HomeScope",
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  });
}

/** Export the household's cloud data and mark the backup timestamp. */
export async function exportAllFromCloud(supabase: SupabaseClient, householdId: string): Promise<void> {
  const backup = await collectBackupFromSupabase(supabase, householdId);
  downloadJson(backupFileName(), backup);
  const { updateSettings } = await import("./repo");
  await updateSettings({ lastBackupAt: new Date().toISOString() });
}

/** Save the current cloud state to localStorage as an automatic pre-import snapshot. */
export async function snapshotCloudBeforeImport(
  supabase: SupabaseClient,
  householdId: string,
): Promise<void> {
  const backup = await collectBackupFromSupabase(supabase, householdId);
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(backup));
  } catch {
    // localStorage may be unavailable or full; the import UI still warns the user.
  }
}

/**
 * Import a validated backup into the household's cloud database via the
 * `import_household_backup` Postgres function — one transaction, replaces
 * whatever the household currently has, returns per-table inserted counts so
 * the caller can verify against the source counts. Used by both the one-time
 * local-data migration and Settings → Data → Import a backup file.
 */
export async function importBackupToCloud(
  supabase: SupabaseClient,
  householdId: string,
  backup: Backup,
): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc("import_household_backup", {
    p_household_id: householdId,
    p_data: backup.data,
  });
  if (error) throw new Error(error.message);
  return data as Record<string, number>;
}
