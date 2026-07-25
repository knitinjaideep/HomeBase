/**
 * Integration test for the real persistence layer, exercising Dexie against an
 * in-memory IndexedDB. Validates that seeding persists, is idempotent (a
 * "refresh" keeps data), and that export → wipe → import round-trips losslessly.
 */
import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import { getDb } from "./db";
import { ensureSeeded } from "./seed";
import { collectBackup, replaceAllData } from "./backup";

describe("persistence layer (IndexedDB)", () => {
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
