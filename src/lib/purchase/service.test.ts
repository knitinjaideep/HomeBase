import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { convertPropertyToOwnedHomeCore } from "./service";

/**
 * A tiny in-memory stand-in for the subset of the Supabase query builder this
 * flow uses: `.select().eq().eq().maybeSingle()`, `.update().eq().eq()`, and
 * `.insert()`. Same pattern as `maintenance/service.test.ts` /
 * `workspace/service.test.ts`'s local fakes (this codebase duplicates one per
 * service test file rather than sharing a helper) — extended here with
 * `failNextUpdate(table)`, a one-shot hook to simulate a write failing
 * partway through the conversion, for the rollback test below.
 */
type Row = Record<string, unknown>;

function makeFakeClient(initial: Record<string, Row[]> = {}) {
  const tables: Record<string, Row[]> = {};
  for (const [name, rows] of Object.entries(initial)) tables[name] = rows.map((r) => ({ ...r }));
  let failNextUpdateOn: string | null = null;

  const client = {
    tables,
    failNextUpdate(table: string) {
      failNextUpdateOn = table;
    },
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
        then(resolve: (value: { data: null; error: { message: string } | null }) => void) {
          if (pending?.kind === "update") {
            if (failNextUpdateOn === table) {
              failNextUpdateOn = null;
              resolve({ data: null, error: { message: `simulated failure updating ${table}` } });
              return;
            }
            for (const r of rows) if (matches(r)) Object.assign(r, pending.patch);
          }
          resolve({ data: null, error: null });
        },
      };
      return builder;
    },
  };

  return client as unknown as SupabaseClient & {
    tables: Record<string, Row[]>;
    failNextUpdate: (table: string) => void;
  };
}

const HID = "hh1";

function makeProperty(overrides: Row = {}): Row {
  return {
    id: "prop1",
    householdId: HID,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    address: "12 Maple St",
    town: "Millburn",
    zip: "07041",
    listingUrl: "",
    mlsNumber: "",
    listingStatus: "unknown",
    dateAdded: "2026-01-01",
    showingDate: null,
    askingPrice: 650000,
    offerPrice: 640000,
    finalSalePrice: 645000,
    annualPropertyTaxes: null,
    bedrooms: 4,
    bathrooms: 2,
    squareFootage: 2200,
    lotSize: "",
    yearBuilt: 1998,
    hoaMonthly: null,
    propertyType: "single-family",
    daysOnMarket: null,
    schools: {},
    distanceToStation: "",
    stationName: "",
    parking: "unknown",
    driveToStationMinutes: null,
    doorToDoorCommuteMinutes: null,
    neighborhoodNotes: "",
    floodZoneNotes: "",
    roadNoise: "",
    trafficLevel: "unknown",
    ratings: {},
    notes: "",
    finance: {},
    status: "under-contract",
    isSample: false,
    isArchived: false,
    archivedAt: null,
    ...overrides,
  };
}

function makeHousehold(activeMode: string | null = "buying"): Row {
  return {
    id: HID,
    name: "Our Household",
    activeMode,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

const INPUT = { closingDate: "2026-07-15", switchMode: false };

describe("convertPropertyToOwnedHomeCore", () => {
  it("promotes the property into ownedHome and marks it purchased", async () => {
    const client = makeFakeClient({ properties: [makeProperty()], households: [makeHousehold()] });

    const result = await convertPropertyToOwnedHomeCore(client, HID, "prop1", INPUT);

    expect(client.tables.properties[0].status).toBe("purchased");
    expect(client.tables.ownedHome).toHaveLength(1);
    const home = client.tables.ownedHome[0];
    expect(home.sourcePropertyId).toBe("prop1");
    expect(home.address).toBe("12 Maple St");
    expect(home.purchaseDate).toBe("2026-07-15");
    expect(home.purchasePrice).toBe(645000); // falls back to finalSalePrice
    expect(result.ownedHomeId).toBe(home.id);
  });

  it("prefers an explicit final purchase price over the property's recorded sale price", async () => {
    const client = makeFakeClient({ properties: [makeProperty()], households: [makeHousehold()] });
    await convertPropertyToOwnedHomeCore(client, HID, "prop1", { ...INPUT, finalPurchasePrice: 660000 });
    expect(client.tables.ownedHome[0].purchasePrice).toBe(660000);
  });

  it("leaves notes, documents, visits, and the deal untouched", async () => {
    const seed = {
      properties: [makeProperty()],
      households: [makeHousehold()],
      notes: [{ id: "n1", householdId: HID, contextType: "property", contextId: "prop1", body: "Loved the yard" }],
      documents: [{ id: "d1", householdId: HID, relatedPropertyId: "prop1", category: "closing-documents" }],
      propertyVisits: [{ id: "v1", householdId: HID, propertyId: "prop1", visitDate: "2026-05-01" }],
      deals: [{ id: "deal1", householdId: HID, propertyId: "prop1", walkAwayPrice: 700000 }],
    };
    const client = makeFakeClient(seed);
    await convertPropertyToOwnedHomeCore(client, HID, "prop1", INPUT);

    expect(client.tables.notes).toEqual(seed.notes);
    expect(client.tables.documents).toEqual(seed.documents);
    expect(client.tables.propertyVisits).toEqual(seed.propertyVisits);
    expect(client.tables.deals).toEqual(seed.deals);
  });

  it("switches the workspace to homeowner mode when requested", async () => {
    const client = makeFakeClient({ properties: [makeProperty()], households: [makeHousehold("buying")] });

    const result = await convertPropertyToOwnedHomeCore(client, HID, "prop1", {
      ...INPUT,
      switchMode: true,
      moveInDate: "2026-08-01",
    });

    expect(result.modeChanged).toBe(true);
    expect(client.tables.households[0].activeMode).toBe("owning");
    expect(client.tables.ownerModeProfile).toHaveLength(1);
    expect(client.tables.ownerModeProfile[0].moveInDate).toBe("2026-08-01");
    expect(client.tables.ownerModeProfile[0].propertyType).toBe("single-family");
  });

  it("declining the mode switch still marks the home purchased but leaves the workspace in buying mode", async () => {
    const client = makeFakeClient({ properties: [makeProperty()], households: [makeHousehold("buying")] });

    const result = await convertPropertyToOwnedHomeCore(client, HID, "prop1", { ...INPUT, switchMode: false });

    expect(result.modeChanged).toBe(false);
    expect(client.tables.properties[0].status).toBe("purchased");
    expect(client.tables.ownedHome).toHaveLength(1);
    expect(client.tables.households[0].activeMode).toBe("buying");
    expect(client.tables.ownerModeProfile ?? []).toHaveLength(0);
  });

  it("is safe to submit twice — no duplicate ownedHome row, same end state", async () => {
    const client = makeFakeClient({ properties: [makeProperty()], households: [makeHousehold()] });

    await convertPropertyToOwnedHomeCore(client, HID, "prop1", INPUT);
    await convertPropertyToOwnedHomeCore(client, HID, "prop1", INPUT);

    expect(client.tables.ownedHome).toHaveLength(1);
    expect(client.tables.properties).toHaveLength(1);
    expect(client.tables.properties[0].status).toBe("purchased");
  });

  it("leaves other candidate homes untouched", async () => {
    const other = makeProperty({ id: "prop2", address: "9 Oak Ave", status: "shortlisted" });
    const client = makeFakeClient({ properties: [makeProperty(), other], households: [makeHousehold()] });

    await convertPropertyToOwnedHomeCore(client, HID, "prop1", INPUT);

    const untouched = client.tables.properties.find((p) => p.id === "prop2");
    expect(untouched?.status).toBe("shortlisted");
    expect(untouched?.address).toBe("9 Oak Ave");
  });

  it("re-converting a different property replaces the singleton ownedHome's source and details", async () => {
    const first = makeProperty({ id: "prop1", address: "12 Maple St" });
    const second = makeProperty({ id: "prop2", address: "9 Oak Ave", status: "under-contract" });
    const client = makeFakeClient({ properties: [first, second], households: [makeHousehold()] });

    await convertPropertyToOwnedHomeCore(client, HID, "prop1", INPUT);
    expect(client.tables.ownedHome[0].sourcePropertyId).toBe("prop1");

    await convertPropertyToOwnedHomeCore(client, HID, "prop2", INPUT);
    expect(client.tables.ownedHome).toHaveLength(1); // still a singleton
    expect(client.tables.ownedHome[0].sourcePropertyId).toBe("prop2");
    expect(client.tables.ownedHome[0].address).toBe("9 Oak Ave");
  });

  it("rolls back safely when the final status write fails, and a retry converges", async () => {
    const client = makeFakeClient({ properties: [makeProperty()], households: [makeHousehold()] });
    client.failNextUpdate("properties");

    await expect(convertPropertyToOwnedHomeCore(client, HID, "prop1", INPUT)).rejects.toThrow(/simulated failure/i);

    // Not corrupted: the home was already promoted, but the property still shows its prior status.
    expect(client.tables.ownedHome).toHaveLength(1);
    expect(client.tables.ownedHome[0].sourcePropertyId).toBe("prop1");
    expect(client.tables.properties[0].status).toBe("under-contract");

    // Retrying converges without creating a duplicate ownedHome row.
    await convertPropertyToOwnedHomeCore(client, HID, "prop1", INPUT);
    expect(client.tables.ownedHome).toHaveLength(1);
    expect(client.tables.properties[0].status).toBe("purchased");
  });

  it("throws for a property that doesn't belong to the household", async () => {
    const client = makeFakeClient({
      properties: [makeProperty({ householdId: "other-household" })],
      households: [makeHousehold()],
    });
    await expect(convertPropertyToOwnedHomeCore(client, HID, "prop1", INPUT)).rejects.toThrow(/not found/i);
  });
});
