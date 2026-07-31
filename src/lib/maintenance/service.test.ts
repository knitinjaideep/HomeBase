import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  archiveMaintenanceItemCore,
  completeMaintenanceItemCore,
  createMaintenanceItemCore,
  createRepairProjectCore,
  deleteMaintenanceItemCore,
  loadOwnedHomeCore,
  saveOwnedHomeCore,
  skipMaintenanceItemCore,
} from "./service";

/**
 * A tiny in-memory stand-in for the subset of the Supabase query builder this
 * service uses: `.select().eq().maybeSingle()`, `.update().eq()`,
 * `.insert()`, and `.delete().eq()`. Same pattern as
 * `workspace/service.test.ts`'s local fake (this codebase duplicates one per
 * service test file rather than sharing a helper) — extended here with
 * `.delete()`, which neither existing copy has.
 */
type Row = Record<string, unknown>;

function makeFakeClient(initial: Record<string, Row[]> = {}) {
  const tables: Record<string, Row[]> = {};
  for (const [name, rows] of Object.entries(initial)) tables[name] = rows.map((r) => ({ ...r }));

  const client = {
    tables,
    from(table: string) {
      tables[table] ??= [];
      const rows = tables[table];
      const filters: Array<[string, unknown]> = [];
      let pending: { kind: "update"; patch: Row } | { kind: "delete" } | null = null;

      const matches = (r: Row) => filters.every(([col, val]) => r[col] === val);

      const builder = {
        select() {
          return builder;
        },
        eq(col: string, val: unknown) {
          filters.push([col, val]);
          return builder;
        },
        maybeSingle() {
          return Promise.resolve({ data: rows.find(matches) ?? null, error: null });
        },
        update(patch: Row) {
          pending = { kind: "update", patch };
          return builder;
        },
        delete() {
          pending = { kind: "delete" };
          return builder;
        },
        insert(payload: Row | Row[]) {
          const incoming = Array.isArray(payload) ? payload : [payload];
          for (const r of incoming) rows.push({ ...r });
          return Promise.resolve({ data: null, error: null });
        },
        // Makes `await from().update().eq()` / `await from().delete().eq()` apply the pending mutation.
        then(resolve: (value: { data: null; error: null }) => void) {
          if (pending?.kind === "update") {
            for (const r of rows) if (matches(r)) Object.assign(r, pending.patch);
          } else if (pending?.kind === "delete") {
            for (let i = rows.length - 1; i >= 0; i--) if (matches(rows[i])) rows.splice(i, 1);
          }
          resolve({ data: null, error: null });
        },
      };
      return builder;
    },
  };

  return client as unknown as SupabaseClient & { tables: Record<string, Row[]> };
}

const HID = "hh1";

describe("owned home singleton", () => {
  it("inserts on first save, then patches the same row", async () => {
    const client = makeFakeClient();
    expect(await loadOwnedHomeCore(client, HID)).toBeNull();

    await saveOwnedHomeCore(client, HID, { name: "Our Home", address: "12 Maple St" });
    const first = await loadOwnedHomeCore(client, HID);
    expect(first?.name).toBe("Our Home");
    expect(first?.address).toBe("12 Maple St");
    expect(client.tables.ownedHome).toHaveLength(1);

    await saveOwnedHomeCore(client, HID, { yearBuilt: 1998 });
    const second = await loadOwnedHomeCore(client, HID);
    expect(second?.yearBuilt).toBe(1998);
    expect(second?.name).toBe("Our Home"); // untouched by the patch
    expect(client.tables.ownedHome).toHaveLength(1);
  });

  it("is usable with just a name, no address", async () => {
    const client = makeFakeClient();
    await saveOwnedHomeCore(client, HID, { name: "The Lake House" });
    const home = await loadOwnedHomeCore(client, HID);
    expect(home?.name).toBe("The Lake House");
    expect(home?.address).toBe("");
  });
});

describe("createMaintenanceItemCore", () => {
  it("creates a one-time item (no recurrence)", async () => {
    const client = makeFakeClient();
    const item = await createMaintenanceItemCore(client, HID, { title: "Replace furnace filter" });
    expect(item.status).toBe("active");
    expect(item.recurrenceMonths).toBeNull();
    expect(item.completionHistory).toEqual([]);
    expect(client.tables.maintenanceItems).toHaveLength(1);
  });

  it("creates a recurring item", async () => {
    const client = makeFakeClient();
    const item = await createMaintenanceItemCore(client, HID, {
      title: "HVAC filter",
      recurrenceMonths: 3,
      dueDate: "2026-08-01",
    });
    expect(item.recurrenceMonths).toBe(3);
    expect(item.dueDate).toBe("2026-08-01");
  });
});

describe("completeMaintenanceItemCore", () => {
  it("computes the next due date and keeps a recurring item active", async () => {
    const client = makeFakeClient();
    const item = await createMaintenanceItemCore(client, HID, {
      title: "HVAC filter",
      recurrenceMonths: 3,
      dueDate: "2026-08-01",
    });

    const updated = await completeMaintenanceItemCore(client, HID, item.id, {
      completedDate: "2026-08-01",
      whatWasDone: "Replaced filter",
      cost: 25,
      performedBy: "Me",
    });

    expect(updated.status).toBe("active");
    expect(updated.lastCompletedDate).toBe("2026-08-01");
    expect(updated.dueDate).toBe("2026-11-01");
    expect(updated.completionHistory).toHaveLength(1);
    expect(updated.completionHistory[0].whatWasDone).toBe("Replaced filter");
    expect(updated.completionHistory[0].cost).toBe(25);
    expect(updated.completionHistory[0].noteId).toBeNull();
  });

  it("marks a one-time item completed, with no next due date", async () => {
    const client = makeFakeClient();
    const item = await createMaintenanceItemCore(client, HID, { title: "Fix leaky faucet" });

    const updated = await completeMaintenanceItemCore(client, HID, item.id, { completedDate: "2026-07-01" });

    expect(updated.status).toBe("completed");
    expect(updated.dueDate).toBeNull();
  });

  it("creates a linked note when a completion note is given, reusing the shared notes system", async () => {
    const client = makeFakeClient();
    const item = await createMaintenanceItemCore(client, HID, { title: "Water heater flush" });

    const updated = await completeMaintenanceItemCore(client, HID, item.id, {
      completedDate: "2026-07-01",
      note: "Sediment was heavier than expected — check again in 6 months.",
    });

    expect(updated.completionHistory[0].noteId).not.toBeNull();
    expect(client.tables.notes).toHaveLength(1);
    expect(client.tables.notes[0].contextType).toBe("maintenanceItem");
    expect(client.tables.notes[0].contextId).toBe(item.id);
    expect(client.tables.notes[0].id).toBe(updated.completionHistory[0].noteId);
  });

  it("throws for an unknown item id", async () => {
    const client = makeFakeClient();
    await expect(
      completeMaintenanceItemCore(client, HID, "missing", { completedDate: "2026-07-01" }),
    ).rejects.toThrow(/not found/i);
  });
});

describe("skipMaintenanceItemCore / archiveMaintenanceItemCore", () => {
  it("skips a task without recording a completion", async () => {
    const client = makeFakeClient();
    const item = await createMaintenanceItemCore(client, HID, { title: "Gutter cleaning" });
    await skipMaintenanceItemCore(client, HID, item.id);
    expect(client.tables.maintenanceItems[0].status).toBe("skipped");
    expect(client.tables.maintenanceItems[0].completionHistory).toEqual([]);
  });

  it("archives an item", async () => {
    const client = makeFakeClient();
    const item = await createMaintenanceItemCore(client, HID, { title: "Old sump pump check" });
    await archiveMaintenanceItemCore(client, HID, item.id);
    expect(client.tables.maintenanceItems[0].status).toBe("archived");
  });
});

describe("deleteMaintenanceItemCore", () => {
  it("removes the row", async () => {
    const client = makeFakeClient();
    const item = await createMaintenanceItemCore(client, HID, { title: "Temporary item" });
    expect(client.tables.maintenanceItems).toHaveLength(1);
    await deleteMaintenanceItemCore(client, HID, item.id);
    expect(client.tables.maintenanceItems).toHaveLength(0);
  });
});

describe("createRepairProjectCore", () => {
  it("creates a repair/project record with defaults", async () => {
    const client = makeFakeClient();
    const project = await createRepairProjectCore(client, HID, { title: "Repaint exterior trim" });
    expect(project.status).toBe("planned");
    expect(project.priority).toBe("medium");
    expect(client.tables.repairProjects).toHaveLength(1);
  });
});
