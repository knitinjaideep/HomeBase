import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  completeBuyerOnboarding,
  completeOwnerOnboarding,
  loadBuyerModeProfile,
  loadOwnerModeProfile,
  loadWorkspaceView,
} from "./service";

/**
 * Same in-memory Supabase stand-in as service.test.ts, kept local so the two
 * suites stay independent. Supports `.select().eq().maybeSingle()`,
 * `.update().eq()`, and `.insert()` — the whole surface the service uses.
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

describe("completeBuyerOnboarding", () => {
  it("selects buying and persists the buyer profile (survives a reload)", async () => {
    const client = withHousehold(null);
    await completeBuyerOnboarding(client, HID, {
      experience: "repeat",
      arrangement: "partner",
      participantNames: ["Sam", "Alex"],
    });

    // Re-reading through the service = the "survives refresh/login" guarantee.
    expect((await loadWorkspaceView(client, HID)).mode).toBe("buying");

    const profile = await loadBuyerModeProfile(client, HID);
    expect(profile?.experience).toBe("repeat");
    expect(profile?.arrangement).toBe("partner");
    expect(profile?.participantNames).toEqual(["Sam", "Alex"]);
    expect(profile?.onboardingCompletedAt).not.toBeNull();
  });
});

describe("completeOwnerOnboarding", () => {
  it("selects owning and persists the owner profile (survives a reload)", async () => {
    const client = withHousehold(null);
    await completeOwnerOnboarding(client, HID, {
      propertyType: "condo-townhouse",
      ownershipStage: "established-owner",
      moveInDate: "2021-05-01",
    });

    expect((await loadWorkspaceView(client, HID)).mode).toBe("owning");

    const profile = await loadOwnerModeProfile(client, HID);
    expect(profile?.propertyType).toBe("condo-townhouse");
    expect(profile?.ownershipStage).toBe("established-owner");
    expect(profile?.moveInDate).toBe("2021-05-01");
    expect(profile?.onboardingCompletedAt).not.toBeNull();
  });
});

describe("changing the active path", () => {
  it("switches mode without deleting the other path's data", async () => {
    const client = withHousehold(null);
    await completeBuyerOnboarding(client, HID, { experience: "first-time", arrangement: "solo" });
    await completeOwnerOnboarding(client, HID, { propertyType: "single-family", ownershipStage: "new-owner" });

    // Mode flipped…
    expect((await loadWorkspaceView(client, HID)).mode).toBe("owning");
    // …but the buyer profile is still there, untouched.
    const buyer = await loadBuyerModeProfile(client, HID);
    expect(buyer?.experience).toBe("first-time");
    expect(client.tables.buyerModeProfile).toHaveLength(1);
    expect(client.tables.ownerModeProfile).toHaveLength(1);
  });

  it("re-completing the same path keeps a single profile row", async () => {
    const client = withHousehold(null);
    await completeBuyerOnboarding(client, HID, { experience: "first-time", arrangement: "solo" });
    await completeBuyerOnboarding(client, HID, { experience: "repeat", arrangement: "group" });

    const buyer = await loadBuyerModeProfile(client, HID);
    expect(buyer?.experience).toBe("repeat");
    expect(buyer?.arrangement).toBe("group");
    expect(client.tables.buyerModeProfile).toHaveLength(1);
  });
});
