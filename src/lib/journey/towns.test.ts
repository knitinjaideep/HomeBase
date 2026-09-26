import { describe, expect, it } from "vitest";
import { townResearchSchema, type TownResearch } from "@/lib/models";
import {
  choiceFromLegacyName,
  choiceFromReference,
  customChoice,
  formatTown,
  planTownSave,
  sameTown,
  searchTowns,
  selectionFrom,
  townNames,
} from "./towns";
import { REFERENCE_TOWNS, townRefId } from "./town-reference";

let n = 0;
const row = (over: Partial<TownResearch> & { name: string }): TownResearch =>
  townResearchSchema.parse({ id: `t${++n}`, createdAt: "2026-01-01", updatedAt: "2026-01-01", ...over });
const ref = (name: string) => choiceFromReference(REFERENCE_TOWNS.find((t) => t.name === name)!);

describe("reference data", () => {
  it("has unique canonical ids", () => {
    expect(new Set(REFERENCE_TOWNS.map((t) => t.id)).size).toBe(REFERENCE_TOWNS.length);
    expect(townRefId("West Windsor", "NJ")).toBe("nj-west-windsor");
  });
});

describe("searchTowns", () => {
  it("matches by name, name plus state, and state", () => {
    expect(searchTowns("princ").map((t) => t.name)).toContain("Princeton");
    expect(searchTowns("Princeton, NJ")[0].name).toBe("Princeton");
    expect(searchTowns("west windsor nj").map((t) => t.name)).toEqual(["West Windsor"]);
    expect(searchTowns("new jersey").length).toBeGreaterThan(0);
    expect(searchTowns("princeton, PA")).toEqual([]);
    expect(searchTowns("  ")).toEqual([]);
  });
  it("ranks names that start with the query first", () => {
    const names = searchTowns("Prin").map((t) => t.name);
    expect(names[0]).toBe("Princeton");
  });
});

describe("choices", () => {
  it("formats with the state", () => {
    expect(formatTown(ref("Princeton"))).toBe("Princeton, NJ");
    expect(formatTown({ name: "Somewhere", state: "" })).toBe("Somewhere");
  });
  it("marks unlisted locations as custom and rejects bad input", () => {
    expect(customChoice("  Hidden   Valley ", "pa")).toEqual({ name: "Hidden Valley", state: "PA", refId: null, isCustom: true });
    expect(customChoice("", "NJ")).toBeNull();
    expect(customChoice("X", "ZZ")).toBeNull();
  });
  it("uses the canonical entry when a custom name is really in the list", () => {
    expect(customChoice("princeton", "NJ")).toEqual(ref("Princeton"));
  });
  it("compares by id, else name, tolerating an unknown state", () => {
    expect(sameTown(ref("Princeton"), ref("Princeton"))).toBe(true);
    expect(sameTown({ name: "princeton", state: "", refId: null }, ref("Princeton"))).toBe(true);
    expect(sameTown({ name: "Princeton", state: "PA", refId: null }, ref("Princeton"))).toBe(false);
  });
  it("resolves older free-text names", () => {
    expect(choiceFromLegacyName("Princeton")).toEqual(ref("Princeton"));
    expect(choiceFromLegacyName("Princeton, NJ")).toEqual(ref("Princeton"));
    expect(choiceFromLegacyName("Nowhere Heights")).toEqual({ name: "Nowhere Heights", state: "", refId: null, isCustom: true });
  });
});

describe("selectionFrom", () => {
  it("reads primary and backup rows in priority order", () => {
    const towns = [
      row({ name: "Plainsboro", designation: "primary", priority: 2 }),
      row({ name: "Princeton", designation: "primary", priority: 1 }),
      row({ name: "Hopewell", designation: "backup" }),
      row({ name: "Summit", designation: "considering" }),
    ];
    const s = selectionFrom(towns, { primaryTowns: [], backupTowns: [] });
    expect(s.primary.map((t) => t.name)).toEqual(["Princeton", "Plainsboro"]);
    expect(s.backup.map((t) => t.name)).toEqual(["Hopewell"]);
  });
  it("adopts names from the older preference lists without duplicating rows", () => {
    const towns = [row({ name: "Princeton", designation: "primary" })];
    const s = selectionFrom(towns, { primaryTowns: ["Princeton", "Montgomery"], backupTowns: ["Montgomery", "Odd Place"] });
    expect(s.primary.map((t) => t.name)).toEqual(["Princeton", "Montgomery"]);
    expect(s.backup.map(formatTown)).toEqual(["Odd Place"]);
  });
});

describe("planTownSave", () => {
  it("creates rows for new towns with role, state, id and order", () => {
    const plan = planTownSave([], { primary: [ref("Princeton"), ref("Plainsboro")], backup: [customChoice("Hidden Valley", "PA")!] });
    expect(plan.update).toEqual([]);
    expect(plan.create).toEqual([
      { name: "Princeton", state: "NJ", refId: "nj-princeton", isCustom: false, designation: "primary", priority: 1 },
      { name: "Plainsboro", state: "NJ", refId: "nj-plainsboro", isCustom: false, designation: "primary", priority: 2 },
      { name: "Hidden Valley", state: "PA", refId: null, isCustom: true, designation: "backup", priority: 1 },
    ]);
  });
  it("updates a matching research row in place, keeping its notes", () => {
    const existing = row({ name: "Princeton", designation: "considering", generalNotes: "Loved the downtown" });
    const plan = planTownSave([existing], { primary: [ref("Princeton")], backup: [] });
    expect(plan.create).toEqual([]);
    expect(plan.update).toHaveLength(1);
    expect(plan.update[0]).toMatchObject({ id: existing.id, designation: "primary", priority: 1, state: "NJ", refId: "nj-princeton", generalNotes: "Loved the downtown" });
  });
  it("never deletes: removed primary/backup towns fall back to considering", () => {
    const gone = row({ name: "Summit", designation: "primary", priority: 1 });
    const kept = row({ name: "Ruled", designation: "ruled-out" });
    const plan = planTownSave([gone, kept], { primary: [], backup: [] });
    expect(plan.create).toEqual([]);
    expect(plan.update).toEqual([{ ...gone, designation: "considering", priority: null }]);
  });
  it("keeps a town in only one list and makes no change when nothing changed", () => {
    const p = row({ name: "Princeton", designation: "primary", priority: 1, state: "NJ", refId: "nj-princeton" });
    const plan = planTownSave([p], { primary: [ref("Princeton")], backup: [ref("Princeton")] });
    expect(plan).toEqual({ create: [], update: [] });
  });
});

describe("townNames", () => {
  it("lists a role's towns in order", () => {
    const towns = [row({ name: "B", designation: "backup" }), row({ name: "A", designation: "backup" }), row({ name: "P", designation: "primary" })];
    expect(townNames(towns, "backup")).toEqual(["A", "B"]);
  });
});
