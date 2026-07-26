import type { SupabaseClient } from "@supabase/supabase-js";
import { getDb } from "./db";
import { backupFileName, collectBackup, downloadJson, importBackupToCloud, summarizeBackup } from "./backup";
import { backupSchema, type Backup } from "./models";

/**
 * The one-time "Local Home data found" migration (section 7 of the
 * deployment plan): detect a browser that has real pre-existing local data,
 * offer to import it into the household's cloud database, verify counts,
 * and never ask again for that household — all without ever writing to or
 * deleting the local copy.
 */

/** True if this browser's legacy local database has real, previously-used data. */
export async function hasLegacyLocalData(): Promise<boolean> {
  try {
    const db = getDb();
    const settings = await db.appSettings.toArray();
    return settings.length > 0 && settings[0].seeded === true;
  } catch {
    // No IndexedDB, blocked storage, or a fresh browser with no local DB at all.
    return false;
  }
}

/** Whether this household has already migrated (or intentionally skipped) local data. */
export async function hasMigrationDecision(
  supabase: SupabaseClient,
  householdId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("households")
    .select("localMigrationCompletedAt")
    .eq("id", householdId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data?.localMigrationCompletedAt);
}

/** Read and validate everything currently in this browser's legacy database. */
export async function collectLegacyBackup(): Promise<Backup> {
  const raw = await collectBackup(getDb());
  return backupSchema.parse(raw);
}

export interface MigrationResult {
  localCounts: { label: string; count: number }[];
  cloudCounts: Record<string, number>;
}

/**
 * The full one-time migration: read local data, download a safety backup,
 * import into the cloud (replacing this household's starter content), then
 * mark the household as migrated. Local data is left untouched — nothing is
 * deleted from this browser, so it remains its own independent backup.
 */
export async function migrateLocalDataToCloud(
  supabase: SupabaseClient,
  householdId: string,
): Promise<MigrationResult> {
  const backup = await collectLegacyBackup();
  downloadJson(backupFileName(), backup);
  const cloudCounts = await importBackupToCloud(supabase, householdId, backup);

  const { error } = await supabase
    .from("households")
    .update({ localMigrationCompletedAt: new Date().toISOString() })
    .eq("id", householdId);
  if (error) throw new Error(error.message);

  return { localCounts: summarizeBackup(backup.data), cloudCounts };
}

/** Record counts for the local data, for the "here's what will be imported" preview. */
export async function previewLegacyBackup(): Promise<{
  backup: Backup;
  counts: { label: string; count: number }[];
}> {
  const backup = await collectLegacyBackup();
  return { backup, counts: summarizeBackup(backup.data) };
}

/** Dismiss the migration prompt for good without importing anything. */
export async function skipMigration(supabase: SupabaseClient, householdId: string): Promise<void> {
  const { error } = await supabase
    .from("households")
    .update({ localMigrationCompletedAt: new Date().toISOString() })
    .eq("id", householdId);
  if (error) throw new Error(error.message);
}
