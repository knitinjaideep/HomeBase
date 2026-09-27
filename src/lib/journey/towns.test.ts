import { describe, expect, it } from "vitest";
import { townResearchSchema, type TownResearch } from "@/lib/models";
import type { GeographyResult } from "@/lib/geography/search";
import {
  choiceFromGeography,
  choiceFromLegacyName,
  customChoice,
  formatTown,
  linkLegacyChoices,
  planTownSave,
  sameTown,
  selectionFrom,
  townNames,
} from "./towns";

let n = 0;
const uuid = (i: number) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const row = (over: Partial<TownResearch> & { name: string }): TownResearch =>
  townResearchSchema.parse({ id: uuid(++n), createdAt: "2026-01-01", updatedAt: "2026-01-01", ...over });

const geo = (i: number, name: string, over: Partial<GeographyResult> = {}): GeographyResult => ({
  id: uuid(1000 + i),
  censusGeoid: `34${String(i).padStart(5, "0")}`,
  name,
  displayName: `${name}, NJ`,
  state: "NJ",
  stateName: "New Jersey",
  geographyType: "place",
  detail: "New Jersey",
  ...over,
});
const princeton = choiceFromGeography(geo(1, "Princeton"));
const plainsboro = choiceFromGeography(geo(2, "Plainsboro"));
const washingtonMorris = choiceFromGeography(geo(3, "Washington Township", { county: "Morris County", geographyType: "county_subdivision" }));
const washingtonWarren = choiceFromGeography(geo(4, "Washington Township", { county: "Warren County", geographyType: "county_subdivision" }));

describe("choices", () => {
  it("formats with the state and keeps the geography id", () => {
    expect(formatTown(princeton)).toBe("Princeton, NJ");
    expect(princeton.geographyId).toBe(uuid(1001));
    expect(formatTown({ name: "Somewhere", state: "" })).toBe("Somewhere");
  });
  it("custom locations have no geography and are flagged custom", () => {
    expect(customChoice("  Hidden   Valley ", "pa")).toEqual({ name: "Hidden Valley", state: "PA", county: "", geographyId: null, isCustom: true });
    expect(customChoice("", "NJ")).toBeNull();
    expect(customChoice("X", "ZZ")).toBeNull();
  });
  it("tells same-named townships apart by geography, and never merges them", () => {
    expect(sameTown(washingtonMorris, washingtonWarren)).toBe(false);
    expect(sameTown(washingtonMorris, { ...washingtonMorris })).toBe(true);
    // Unlinked older names fall back to name (+ state/county when both know them).
    expect(sameTown({ name: "Washington Township", state: "", county: "", geographyId: null, isCustom: false }, washingtonMorris)).toBe(true);
    expect(sameTown({ name: "princeton", state: "PA", county: "", geographyId: null, isCustom: false }, princeton)).toBe(false);
  });
  it("reads older free-text names, with or without a state", () => {
    expect(choiceFromLegacyName("Princeton")).toMatchObject({ name: "Princeton", state: "", geographyId: null, isCustom: false });
    expect(choiceFromLegacyName("Princeton, NJ")).toMatchObject({ name: "Princeton", state: "NJ" });
  });
});

describe("linkLegacyChoices", () => {
  it("links a name only when exactly one result matches, preferring the Census place", () => {
    const place = geo(1, "Princeton");
    const subdivision = geo(5, "Princeton", { geographyType: "county_subdivision", county: "Mercer County" });
    const search = async (q: string) => (q === "Princeton" ? [place, subdivision] : q === "Ambiguous" ? [geo(6, "Ambiguous"), geo(7, "Ambiguous")] : []);
    const linked = choiceFromLegacyName("Princeton");
    return Promise.all([
      linkLegacyChoices([linked, choiceFromLegacyName("Ambiguous"), choiceFromLegacyName("Nowhere"), princeton], search),
    ]).then(([out]) => {
      expect(out[0].geographyId).toBe(place.id);
      expect(out[1].geographyId).toBeNull();
      expect(out[2].geographyId).toBeNull();
      expect(out[3]).toBe(princeton);
    });
  });
  it("leaves a choice alone when the search fails", async () => {
    const c = choiceFromLegacyName("Princeton");
    const out = await linkLegacyChoices([c], async () => {
      throw new Error("offline");
    });
    expect(out[0]).toBe(c);
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
  it("creates rows with role, state, county, geography id and order; custom rows get no geography", () => {
    const custom = customChoice("Hidden Valley", "PA")!;
    const plan = planTownSave([], { primary: [princeton, plainsboro], backup: [washingtonMorris, custom] });
    expect(plan.update).toEqual([]);
    expect(plan.create).toEqual([
      { name: "Princeton", state: "NJ", county: "", geographyId: princeton.geographyId, isCustom: false, designation: "primary", priority: 1 },
      { name: "Plainsboro", state: "NJ", county: "", geographyId: plainsboro.geographyId, isCustom: false, designation: "primary", priority: 2 },
      { name: "Washington Township", state: "NJ", county: "Morris County", geographyId: washingtonMorris.geographyId, isCustom: false, designation: "backup", priority: 1 },
      { name: "Hidden Valley", state: "PA", county: "", geographyId: null, isCustom: true, designation: "backup", priority: 2 },
    ]);
  });
  it("keeps two same-named townships as two rows", () => {
    const plan = planTownSave([], { primary: [washingtonMorris, washingtonWarren], backup: [] });
    expect(plan.create.map((c) => c.county)).toEqual(["Morris County", "Warren County"]);
  });
  it("updates a matching research row in place, keeping its notes and linking it to the geography", () => {
    const existing = row({ name: "Princeton", designation: "considering", generalNotes: "Loved the downtown" });
    const plan = planTownSave([existing], { primary: [princeton], backup: [] });
    expect(plan.create).toEqual([]);
    expect(plan.update[0]).toMatchObject({ id: existing.id, designation: "primary", priority: 1, state: "NJ", geographyId: princeton.geographyId, generalNotes: "Loved the downtown" });
  });
  it("never deletes: removed primary/backup towns fall back to considering", () => {
    const gone = row({ name: "Summit", designation: "primary", priority: 1 });
    const kept = row({ name: "Ruled", designation: "ruled-out" });
    const plan = planTownSave([gone, kept], { primary: [], backup: [] });
    expect(plan.create).toEqual([]);
    expect(plan.update).toEqual([{ ...gone, designation: "considering", priority: null }]);
  });
  it("is stable: saving the same selection twice changes nothing (persistence after reload)", () => {
    const first = planTownSave([], { primary: [princeton], backup: [plainsboro] });
    const saved = first.create.map((c) => row(c));
    const reloaded = selectionFrom(saved, { primaryTowns: [], backupTowns: [] });
    expect(reloaded).toEqual({ primary: [princeton], backup: [plainsboro] });
    expect(planTownSave(saved, reloaded)).toEqual({ create: [], update: [] });
  });
  it("keeps a town in only one list", () => {
    expect(planTownSave([], { primary: [princeton], backup: [princeton] }).create).toHaveLength(1);
  });
});

describe("townNames", () => {
  it("lists a role's towns in order", () => {
    const towns = [row({ name: "B", designation: "backup" }), row({ name: "A", designation: "backup" }), row({ name: "P", designation: "primary" })];
    expect(townNames(towns, "backup")).toEqual(["A", "B"]);
  });
});
