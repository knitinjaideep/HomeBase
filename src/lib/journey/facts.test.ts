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
    financial: { priceComfortableMin: null, priceComfortableMax: null, ...overrides.financial },
    preferences: {
      primaryTowns: [],
      minBedrooms: 0,
      minSchoolRating: 0,
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

  it("reports preference thresholds only when they are above zero", () => {
    const facts = byId(
      journeyFacts(
        snapshot({
          household: { minOwnershipYears: 10 },
          preferences: { minBedrooms: 4, minSchoolRating: 8, maxCommuteMinutes: 60 },
        }),
      ),
    );
    expect(facts).toMatchObject({ ownership: "10+ years", bedrooms: "4+ beds", schools: "Rating 8+", commute: "60 min" });
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
