import { describe, it, expect } from "vitest";
import { evaluateCheck } from "./criteria";
import { parseActivityResponses, readActivityResponses } from "./activity-responses";
import { answersFrom, cleanList, describeHome, homePreferencesDefined, type HomePreferenceAnswers } from "./home-preferences";
import { journeyFacts, activitySummaries } from "./facts";
import type { JourneySnapshot } from "./snapshot";

const empty = (over: Partial<HomePreferenceAnswers> = {}): HomePreferenceAnswers => ({
  ...answersFrom({ primaryTowns: [], minBedrooms: 0, minBathrooms: 0 }, {}),
  ...over,
});

function snapshot(over: { preferences?: object; responses?: object; dealbreakerNotes?: string } = {}): JourneySnapshot {
  return {
    household: { idealPurchaseStart: "", idealPurchaseEnd: "", minOwnershipYears: 0 },
    financial: { priceComfortableMin: null, priceComfortableMax: null },
    preferences: {
      primaryTowns: [],
      minBedrooms: 0,
      minBathrooms: 0,
      minSchoolRating: 0,
      maxCommuteMinutes: 0,
      dealbreakerNotes: over.dealbreakerNotes ?? "",
      ...over.preferences,
    },
    towns: [],
    stageStates: over.responses ? [{ id: "home-preferences", responses: over.responses }] : [],
    actions: [],
    decisions: [],
  } as unknown as JourneySnapshot;
}

describe("describeHome", () => {
  it("says nothing until something is chosen", () => {
    expect(describeHome(empty()).sentence).toBeNull();
  });

  it("builds a deterministic sentence from structured answers", () => {
    const p = describeHome(
      empty({
        homeTypes: ["single-family"],
        towns: ["Princeton", "West Windsor"],
        minBedrooms: 4,
        minBathrooms: 2.5,
        mustHave: ["garage", "backyard", "central-ac"],
        mustHaveCustom: ["first-floor bedroom"],
      }),
    );
    expect(p.sentence).toBe(
      "A single-family home in Princeton and West Windsor with 4+ bedrooms, 2.5+ bathrooms, a garage, a backyard, central AC, and first-floor bedroom.",
    );
  });

  it("handles other home types, multiple types, and article choice", () => {
    expect(describeHome(empty({ homeTypes: ["other"], homeTypeOther: "Farmhouse" })).sentence).toBe("A farmhouse.");
    expect(describeHome(empty({ homeTypes: ["other"] })).sentence).toBe("A home.");
    expect(describeHome(empty({ homeTypes: ["townhouse", "condo"] })).sentence).toBe("A townhouse or condo.");
    expect(describeHome(empty({ homeTypes: ["other"], homeTypeOther: "apartment" })).sentence).toBe("An apartment.");
  });

  it("lists would-love and avoid separately and skips them in the sentence", () => {
    const p = describeHome(empty({ homeTypes: ["condo"], wouldLove: ["quiet-street"], avoid: ["hoa"], avoidCustom: ["flood zone"] }));
    expect(p.wouldLove).toEqual(["a quiet street"]);
    expect(p.avoid).toEqual(["an HOA", "flood zone"]);
    expect(p.sentence).toBe("A condo.");
  });
});

describe("cleanList", () => {
  it("trims, drops blanks, and de-duplicates case-insensitively", () => {
    expect(cleanList([" Garage ", "garage", "", "Sunroom"])).toEqual(["Garage", "Sunroom"]);
  });
});

describe("homePreferencesDefined", () => {
  it("needs a home type and at least one must-have", () => {
    expect(homePreferencesDefined(empty())).toBe(false);
    expect(homePreferencesDefined(empty({ homeTypes: ["condo"] }))).toBe(false);
    expect(homePreferencesDefined(empty({ mustHave: ["garage"] }))).toBe(false);
  });

  it("counts a bedroom or bathroom minimum, a preset, or a custom item as a must-have", () => {
    expect(homePreferencesDefined(empty({ homeTypes: ["condo"], minBedrooms: 3 }))).toBe(true);
    expect(homePreferencesDefined(empty({ homeTypes: ["condo"], minBathrooms: 2 }))).toBe(true);
    expect(homePreferencesDefined(empty({ homeTypes: ["condo"], mustHave: ["garage"] }))).toBe(true);
    expect(homePreferencesDefined(empty({ homeTypes: ["condo"], mustHaveCustom: ["elevator"] }))).toBe(true);
  });
});

describe("home preferences criterion", () => {
  it("is met by structured answers", () => {
    const s = snapshot({ preferences: { minBedrooms: 3 }, responses: { homeTypes: ["single-family"] } });
    expect(evaluateCheck("homePreferencesDefined", s)).toBe(true);
  });

  it("is not met by an empty activity", () => {
    expect(evaluateCheck("homePreferencesDefined", snapshot())).toBe(false);
  });

  it("stays met for households who only wrote deal-breakers before the form existed", () => {
    expect(evaluateCheck("homePreferencesDefined", snapshot({ dealbreakerNotes: "No busy roads" }))).toBe(true);
  });
});

describe("responses validation and persistence shape", () => {
  it("round-trips valid answers and rejects unknown home types", () => {
    const saved = parseActivityResponses("home-preferences", { homeTypes: ["condo"], mustHaveCustom: ["  elevator "] });
    expect(readActivityResponses("home-preferences", saved)).toEqual({ homeTypes: ["condo"], mustHaveCustom: ["elevator"] });
    expect(() => parseActivityResponses("home-preferences", { homeTypes: ["castle"] })).toThrow();
    expect(() => parseActivityResponses("home-preferences", { mustHaveCustom: ["x".repeat(61)] })).toThrow();
  });

  it("treats existing rows with no responses as empty", () => {
    expect(readActivityResponses("home-preferences", undefined)).toEqual({});
  });
});

describe("feeds What we know so far and the activity summary", () => {
  it("surfaces home type, must-haves, and a card summary", () => {
    const s = snapshot({
      preferences: { minBedrooms: 4 },
      responses: { homeTypes: ["single-family"], mustHave: ["garage", "backyard", "basement", "central-ac"], mustHaveCustom: ["office"] },
    });
    const facts = Object.fromEntries(journeyFacts(s).map((f) => [f.id, f.value]));
    expect(facts.homeType).toBe("Single family");
    expect(facts.mustHaves).toBe("Garage, Backyard, Central AC +2");
    expect(activitySummaries(s)["home-preferences"]).toBe("Single family · 4+ beds");
  });
});
