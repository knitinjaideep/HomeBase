/**
 * Integration test for the legacy local persistence layer, exercising Dexie
 * against an in-memory IndexedDB. The live app no longer reads or writes
 * this database — Supabase is authoritative — but a browser that used
 * HomeScope before the cloud migration may still have real data here, and
 * `lib/migration.ts` reads it for the one-time "Local Home data found" import.
 * `ensureSeeded` is used below purely as a fixture: it's the easiest way to
 * populate a realistic, fully-valid legacy dataset to test that migration
 * read path against.
 */
import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import { getDb } from "./db";
import { ensureSeeded } from "./seed";
import { collectBackup, replaceAllData } from "./backup";
import { hasLegacyLocalData, collectLegacyBackup } from "./migration";

describe("legacy local database (IndexedDB)", () => {
  it("seeds an empty database and is idempotent across reloads", async () => {
    const db = getDb();
    await ensureSeeded(db);

    expect((await db.properties.toArray()).length).toBe(3);
    expect((await db.householdProfile.toArray()).length).toBe(1);
    expect((await db.checklists.toArray()).length).toBeGreaterThan(0);
    expect((await db.tasks.toArray()).length).toBeGreaterThan(0);
    const settings = await db.appSettings.toArray();
    expect(settings[0]?.seeded).toBe(true);

    // v2 journey seed: the curated resources and the attending singleton exist.
    expect((await db.resources.toArray()).length).toBeGreaterThan(0);
    expect((await db.attendingTransition.toArray()).length).toBe(1);
    // Towns seed with the new `designation` field, none Primary until a visit.
    const towns = await db.towns.toArray();
    expect(towns.length).toBeGreaterThan(0);
    expect(towns.every((t) => t.designation === "considering")).toBe(true);

    // Running again (like a page reload) must not duplicate or wipe anything.
    await ensureSeeded(db);
    expect((await db.properties.toArray()).length).toBe(3);
    const resourceCount = (await db.resources.toArray()).length;
    await ensureSeeded(db);
    expect((await db.resources.toArray()).length).toBe(resourceCount);
  });

  it("exports and re-imports a backup without loss", async () => {
    const db = getDb();
    await ensureSeeded(db);

    const backup = await collectBackup(db);
    expect(backup.app).toBe("HomeScope");
    const propCount = backup.data.properties.length;
    const taskCount = backup.data.tasks.length;
    expect(propCount).toBe(3);

    // Simulate a corrupted/empty DB, then restore from the backup.
    await db.properties.clear();
    await db.tasks.clear();
    expect((await db.properties.toArray()).length).toBe(0);

    await replaceAllData(db, backup);
    expect((await db.properties.toArray()).length).toBe(propCount);
    expect((await db.tasks.toArray()).length).toBe(taskCount);
  });
});

describe("migration read path (lib/migration.ts)", () => {
  it("reports no legacy data before the database has been seeded", async () => {
    const db = getDb();
    await db.appSettings.clear();
    expect(await hasLegacyLocalData()).toBe(false);
  });

  it("detects a previously-used browser and reads a validated backup from it", async () => {
    const db = getDb();
    // The previous tests in this file leave data behind (the Dexie instance
    // is a singleton shared across this whole file's fake-indexeddb) — start
    // this scenario from a clean slate so the counts below are exact.
    await Promise.all([
      db.householdProfile.clear(),
      db.financialProfile.clear(),
      db.homePreferences.clear(),
      db.appSettings.clear(),
      db.properties.clear(),
      db.visits.clear(),
      db.checklists.clear(),
      db.tasks.clear(),
      db.towns.clear(),
      db.resources.clear(),
      db.attendingTransition.clear(),
    ]);
    await ensureSeeded(db);

    expect(await hasLegacyLocalData()).toBe(true);

    const backup = await collectLegacyBackup();
    expect(backup.app).toBe("HomeScope");
    expect(backup.data.properties.length).toBe(3);
    expect(backup.data.householdProfile.length).toBe(1);
  });
});
