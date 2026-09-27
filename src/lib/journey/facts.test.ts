import { describe, it, expect } from "vitest";
import { activitySummaries, factsForStage, journeyFacts } from "./facts";
import type { JourneySnapshot } from "./snapshot";

/** Only the fields `journeyFacts` reads. */
function snapshot(overrides: {
  household?: Record<string, unknown>;
  financial?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
  towns?: unknown[];
  stageStates?: unknown[];
}): JourneySnapshot {
  return {
    household: { idealPurchaseStart: "2027-05", idealPurchaseEnd: "2027-06", minOwnershipYears: 0, ...overrides.household },
    financial: { priceComfortableMin: null, priceComfortableMax: null, paymentComfortable: null, ...overrides.financial },
    preferences: {
      primaryTowns: [],
      backupTowns: [],
      minBedrooms: 0,
      minSchoolRating: 0,
      minBathrooms: 0,
      maxCommuteMinutes: 0,
      ...overrides.preferences,
    },
    towns: overrides.towns ?? [],
    stageStates: overrides.stageStates ?? [],
  } as unknown as JourneySnapshot;
}

const byId = (facts: ReturnType<typeof journeyFacts>) => Object.fromEntries(facts.map((f) => [f.id, f.value]));

describe("journeyFacts", () => {
  it("leaves out everything that has not been recorded", () => {
    const facts = journeyFacts(snapshot({ household: { idealPurchaseStart: "", idealPurchaseEnd: "" } }));
    expect(facts).toEqual([]);
  });

  it("formats the timeline as a range, or one month when start equals end", () => {
    expect(byId(journeyFacts(snapshot({})))).toMatchObject({ timeline: "May 2027 – June 2027" });
    const same = snapshot({ household: { idealPurchaseStart: "2027-07", idealPurchaseEnd: "2027-07" } });
    expect(byId(journeyFacts(same)).timeline).toBe("July 2027");
  });

  it("shows the price range compactly and only when a range is recorded", () => {
    const facts = byId(journeyFacts(snapshot({ financial: { priceComfortableMin: 1_000_000, priceComfortableMax: 1_150_000 } })));
    expect(facts.budget).toBe("$1M – $1.15M");
    expect(byId(journeyFacts(snapshot({ financial: { priceComfortableMin: 950_000, priceComfortableMax: 1_500_000 } }))).budget).toBe(
      "$950K – $1.5M",
    );
    expect(byId(journeyFacts(snapshot({ financial: { priceComfortableMin: 900_000 } }))).budget).toBeUndefined();
  });

  it("prefers towns marked Primary in research, falling back to the preference list", () => {
    const researched = snapshot({
      towns: [
        { name: "Princeton", designation: "primary" },
        { name: "Summit", designation: "considering" },
        { name: "West Windsor", designation: "primary" },
      ],
      preferences: { primaryTowns: ["Ignored"] },
    });
    expect(byId(journeyFacts(researched)).towns).toBe("Princeton, West Windsor");
    expect(byId(journeyFacts(snapshot({ preferences: { primaryTowns: ["Montclair"] } }))).towns).toBe("Montclair");
  });

  it("lists backup towns in the household's order, falling back to the preference list", () => {
    const s = snapshot({
      towns: [
        { name: "Hopewell", designation: "backup", priority: 2 },
        { name: "Montgomery", designation: "backup", priority: 1 },
      ],
    });
    expect(byId(journeyFacts(s)).backupTowns).toBe("Montgomery, Hopewell");
    expect(byId(journeyFacts(snapshot({ preferences: { backupTowns: ["Summit"] } }))).backupTowns).toBe("Summit");
    expect(byId(journeyFacts(snapshot({}))).backupTowns).toBeUndefined();
  });

  it("reports preference thresholds only when they are above zero", () => {
    const facts = byId(
      journeyFacts(
        snapshot({
          household: { minOwnershipYears: 10 },
          preferences: { minBedrooms: 4, minSchoolRating: 8, maxCommuteMinutes: 60 },
        }),
      ),
    );
    expect(facts).toMatchObject({ ownership: "10+ years", bedrooms: "4+", schools: "Rating 8+", commute: "60 min" });
    const blank = byId(journeyFacts(snapshot({})));
    expect(blank.bedrooms).toBeUndefined();
    expect(blank.schools).toBeUndefined();
    expect(blank.commute).toBeUndefined();
  });
});

describe("stage workspace helpers", () => {
  it("scopes facts to the activities in a stage", () => {
    const s = snapshot({ preferences: { primaryTowns: ["Princeton"], minBedrooms: 4 } });
    const ids = factsForStage(journeyFacts(s), ["town-research"]).map((f) => f.id);
    expect(ids).toEqual(["towns"]);
    expect(factsForStage(journeyFacts(s), ["preapproval"])).toEqual([]);
  });

  it("summarises only what an activity has recorded", () => {
    const s = snapshot({
      preferences: { primaryTowns: ["Princeton", "Plainsboro"], minBedrooms: 4, minBathrooms: 0, maxCommuteMinutes: 60 },
    });
    const out = activitySummaries(s);
    expect(out["town-research"]).toBe("Princeton, Plainsboro");
    expect(out["home-preferences"]).toBe("4+ beds");
    expect(out["commute"]).toBe("≤ 60 min");
    expect(out["school-priorities"]).toBeUndefined();
    expect(out["finances"]).toBeUndefined();
  });
});

describe("journey fact layer", () => {
  const full = () =>
    snapshot({
      household: { minOwnershipYears: 10 },
      financial: { priceComfortableMin: 900_000, priceComfortableMax: 1_200_000, paymentComfortable: 6500 },
      preferences: {
        primaryTowns: ["Princeton"],
        backupTowns: ["Summit"],
        minBedrooms: 4,
        minBathrooms: 2.5,
        minSchoolRating: 8,
        maxCommuteMinutes: 45,
      },
      stageStates: [
        {
          id: "home-preferences",
          responses: { homeTypes: ["single-family"], mustHave: ["garage", "good-schools"] },
        },
      ],
    });

  it("returns nothing for an empty plan, so the UI can show its calm empty state", () => {
    expect(journeyFacts(snapshot({ household: { idealPurchaseStart: "", idealPurchaseEnd: "" } }))).toEqual([]);
  });

  it("returns only what is recorded for a partial plan", () => {
    const ids = journeyFacts(snapshot({ preferences: { minBedrooms: 3 } })).map((f) => f.id);
    expect(ids).toEqual(["timeline", "bedrooms"]);
  });

  it("returns every fact for a full plan, in priority order, each owned by an activity route", () => {
    const facts = journeyFacts(full());
    expect(facts.map((f) => f.id)).toEqual([
      "timeline", "budget", "payment", "ownership", "towns", "backupTowns",
      "homeType", "bedrooms", "bathrooms", "mustHaves", "schools", "commute",
    ]);
    expect(facts.every((f) => f.href === `/journey/${f.activityId}` && f.source.length > 0)).toBe(true);
    expect(facts.find((f) => f.id === "payment")).toMatchObject({ value: "$6,500/mo", activityId: "finances" });
    expect(facts.find((f) => f.id === "bedrooms")).toMatchObject({ activityId: "home-preferences", value: "4+" });
    expect(facts.find((f) => f.id === "bathrooms")?.value).toBe("2.5+");
    expect(facts.find((f) => f.id === "towns")?.href).toBe("/journey/town-research");
  });

  it("does not repeat the school priority as a must-have", () => {
    const mustHaves = journeyFacts(full()).find((f) => f.id === "mustHaves");
    expect(mustHaves?.value).toBe("Garage");
    const noThreshold = snapshot({ stageStates: [{ id: "home-preferences", responses: { mustHave: ["good-schools"] } }] });
    expect(journeyFacts(noThreshold).find((f) => f.id === "mustHaves")?.value).toBe("Good schools");
  });

  it("follows edits and removals", () => {
    const before = byId(journeyFacts(snapshot({ preferences: { minBedrooms: 3, maxCommuteMinutes: 30 } })));
    expect(before).toMatchObject({ bedrooms: "3+", commute: "30 min" });
    const after = byId(journeyFacts(snapshot({ preferences: { minBedrooms: 4, maxCommuteMinutes: 0 } })));
    expect(after.bedrooms).toBe("4+");
    expect(after.commute).toBeUndefined();
  });
});
