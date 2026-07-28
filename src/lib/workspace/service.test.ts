import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  loadActiveWorkspace,
  loadBuyerModeProfile,
  loadOwnerModeProfile,
  loadWorkspaceView,
  saveBuyerModeProfile,
  saveOwnerModeProfile,
  setWorkspaceMode,
} from "./service";

/**
 * A tiny in-memory stand-in for the subset of the Supabase query builder the
 * workspace service uses: `.select().eq().maybeSingle()`, `.update().eq()`,
 * and `.insert()`. Mirrors how `seed/cloud.ts` accepts a real SupabaseClient,
 * so the service is exercised end-to-end with no network. Row filtering is a
 * simple AND over the recorded `.eq()` calls, which is all this service needs.
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
      let pending: { kind: "update"; patch: Row } | null = null;

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
        insert(payload: Row | Row[]) {
          const incoming = Array.isArray(payload) ? payload : [payload];
          for (const r of incoming) rows.push({ ...r });
          return Promise.resolve({ data: null, error: null });
        },
        // Makes `await from().update().eq()` apply the pending mutation.
        then(resolve: (value: { data: null; error: null }) => void) {
          if (pending?.kind === "update") {
            for (const r of rows) if (matches(r)) Object.assign(r, pending.patch);
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

function withHousehold(activeMode: string | null = null) {
  return makeFakeClient({
    households: [
      {
        id: HID,
        name: "Our Household",
        activeMode,
        createdAt: "2026-07-28T00:00:00.000Z",
        updatedAt: "2026-07-28T00:00:00.000Z",
      },
    ],
  });
}

describe("loadActiveWorkspace / loadWorkspaceView", () => {
  it("loads the active (default) workspace through the application service", async () => {
    const client = withHousehold(null);
    const workspace = await loadActiveWorkspace(client, HID);
    expect(workspace.id).toBe(HID);
    expect(workspace.name).toBe("Our Household");
    expect(workspace.activeMode).toBeNull();
  });

  it("a freshly created default workspace resolves as unselected", async () => {
    const view = await loadWorkspaceView(withHousehold(null), HID);
    expect(view.mode).toBe("unselected");
    expect(view.needsPathSelection).toBe(true);
  });

  it("throws when the household has no workspace row", async () => {
    await expect(loadActiveWorkspace(makeFakeClient(), HID)).rejects.toThrow(/not found/i);
  });
});

describe("setWorkspaceMode", () => {
  it("persists BUYING mode", async () => {
    const client = withHousehold(null);
    await setWorkspaceMode(client, HID, "buying");
    expect((await loadActiveWorkspace(client, HID)).activeMode).toBe("buying");
    expect((await loadWorkspaceView(client, HID)).mode).toBe("buying");
  });

  it("persists OWNING mode", async () => {
    const client = withHousehold(null);
    await setWorkspaceMode(client, HID, "owning");
    expect((await loadActiveWorkspace(client, HID)).activeMode).toBe("owning");
    expect((await loadWorkspaceView(client, HID)).mode).toBe("owning");
  });

  it("rejects an invalid mode before writing, leaving the workspace unchanged", async () => {
    const client = withHousehold(null);
    // @ts-expect-error — deliberately invalid mode value
    await expect(setWorkspaceMode(client, HID, "renting")).rejects.toThrow();
    expect((await loadActiveWorkspace(client, HID)).activeMode).toBeNull();
  });
});

describe("buyer mode profile persistence", () => {
  it("inserts on first save, then patches the same row", async () => {
    const client = withHousehold(null);
    expect(await loadBuyerModeProfile(client, HID)).toBeNull();

    await saveBuyerModeProfile(client, HID, { experience: "repeat", arrangement: "partner" });
    const first = await loadBuyerModeProfile(client, HID);
    expect(first?.experience).toBe("repeat");
    expect(first?.arrangement).toBe("partner");
    expect(first?.targetPurchaseDate).toBeNull();
    expect(client.tables.buyerModeProfile).toHaveLength(1);

    await saveBuyerModeProfile(client, HID, { targetPurchaseDate: "2027-06" });
    const second = await loadBuyerModeProfile(client, HID);
    expect(second?.targetPurchaseDate).toBe("2027-06");
    expect(second?.experience).toBe("repeat"); // untouched by the patch
    expect(client.tables.buyerModeProfile).toHaveLength(1); // still one row per household
  });
});

describe("owner mode profile persistence", () => {
  it("inserts on first save, then patches the same row", async () => {
    const client = withHousehold(null);
    expect(await loadOwnerModeProfile(client, HID)).toBeNull();

    await saveOwnerModeProfile(client, HID, {
      propertyType: "condo-townhouse",
      ownershipStage: "established-owner",
    });
    const first = await loadOwnerModeProfile(client, HID);
    expect(first?.propertyType).toBe("condo-townhouse");
    expect(first?.ownershipStage).toBe("established-owner");
    expect(client.tables.ownerModeProfile).toHaveLength(1);

    await saveOwnerModeProfile(client, HID, { moveInDate: "2024-09-01" });
    const second = await loadOwnerModeProfile(client, HID);
    expect(second?.moveInDate).toBe("2024-09-01");
    expect(second?.propertyType).toBe("condo-townhouse");
    expect(client.tables.ownerModeProfile).toHaveLength(1);
  });
});
