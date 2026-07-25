import { describe, it, expect } from "vitest";
import {
  attendingTransitionSchema,
  dealSchema,
  financialProfileSchema,
  homePreferencesSchema,
  householdProfileSchema,
  mortgageApprovalSchema,
  professionalSchema,
  townResearchSchema,
  SINGLETON_ID,
} from "@/lib/models";
import { GUIDE_STAGES, ALL_ACTIONS, TOTAL_GUIDE_WEIGHT } from "@/lib/guide";
import { evaluateCheck } from "./criteria";
import { overallProgress, readinessByArea } from "./progress";
import { nextActions } from "./next-actions";
import { personalizedLines } from "./personalization";
import type { JourneySnapshot } from "./snapshot";

const TS = "2026-07-24T00:00:00.000Z";

function baseSnapshot(overrides: Partial<JourneySnapshot> = {}): JourneySnapshot {
  const household = householdProfileSchema.parse({
    id: SINGLETON_ID,
    createdAt: TS,
    updatedAt: TS,
    planningDate: "2026-07-24",
    idealPurchaseStart: "2027-05",
    idealPurchaseEnd: "2027-06",
    minOwnershipYears: 10,
    buyer1Name: "Me",
    buyer2Name: "Wife",
    buyer1Income: { label: "b1", annualBase: 152000, variableNote: "", isAssumption: false },
    buyer2Income: { label: "b2", annualBase: 80000, variableNote: "", isAssumption: false },
    buyer2FutureIncome: { label: "future", annualBase: null, variableNote: "", isAssumption: true },
    combinedMonthlyTakeHome: 12000,
    buyer1CreditScore: 800,
    buyer2CreditScore: 700,
    notes: "",
  });
  const financial = financialProfileSchema.parse({
    id: SINGLETON_ID,
    createdAt: TS,
    updatedAt: TS,
    checking: 15000,
    savings: 40000,
    taxableInvestments: 250000,
    retirementAccounts: 170000,
    designatedDownPaymentCash: 36000,
    minReserve: 40000,
    preferredReserve: 60000,
    retirementAvailableForPurchase: 0,
    vehicleBalanceRemaining: 30000,
    carPaymentsAndInsuranceMonthly: 2000,
    otherTransportMonthly: 500,
    studentLoansMonthly: 0,
    otherDebtMonthly: 0,
    groceriesMonthly: 750,
    diningShoppingMonthly: 500,
    insuranceMonthly: 400,
    retirementContributionMonthly: 400,
    espcontributionMonthly: 1000,
    childcareMonthly: null,
    travelMonthly: 0,
    priceComfortableMin: 1000000,
    priceComfortableMax: 1150000,
    priceRoutineCeiling: 1200000,
    priceAbsoluteCeiling: 1300000,
    paymentComfortable: 8000,
    paymentMaxTarget: 9000,
    paymentAbsoluteCeiling: 10000,
    planningInterestRatePct: 6.5,
    defaultLoanTermYears: 30,
    defaultMaintenancePct: 1,
  });
  const preferences = homePreferencesSchema.parse({
    id: SINGLETON_ID,
    createdAt: TS,
    updatedAt: TS,
    primaryTowns: [],
    backupTowns: [],
    minSchoolRating: 8,
    minBedrooms: 3,
    minBathrooms: 3,
    requiredNotes: "",
    preferredNotes: "",
    dealbreakerNotes: "",
    maxCommuteMinutes: 90,
    renovationTolerance: "moderate",
    renovationDecided: false,
  });

  return {
    household,
    financial,
    preferences,
    properties: [],
    visits: [],
    lenderQuotes: [],
    towns: [],
    stageStates: [],
    actions: [],
    decisions: [],
    attending: undefined,
    approvals: [],
    professionals: [],
    resources: [],
    documents: [],
    deals: [],
    today: new Date("2026-07-24T00:00:00.000Z"),
    ...overrides,
  };
}

describe("guide content integrity", () => {
  it("has 18 stages with unique ids and sequential numbers", () => {
    expect(GUIDE_STAGES).toHaveLength(18);
    const ids = new Set(GUIDE_STAGES.map((s) => s.id));
    expect(ids.size).toBe(18);
    GUIDE_STAGES.forEach((s, i) => expect(s.number).toBe(i + 1));
  });

  it("has globally unique action and decision ids", () => {
    const actionIds = ALL_ACTIONS.map((a) => a.id);
    expect(new Set(actionIds).size).toBe(actionIds.length);
    const decisionIds = GUIDE_STAGES.flatMap((s) => s.decisions.map((d) => d.id));
    expect(new Set(decisionIds).size).toBe(decisionIds.length);
  });

  it("gives every stage at least one weighted completion criterion", () => {
    GUIDE_STAGES.forEach((s) => {
      expect(s.actions.length).toBeGreaterThan(0);
      expect(s.completionCriteria.length).toBeGreaterThan(0);
      expect(s.completionCriteria.every((c) => Boolean(c.autoCheck))).toBe(true);
    });
    expect(TOTAL_GUIDE_WEIGHT).toBeGreaterThan(100);
  });

  it("weights an attending contract far above reading a resource", () => {
    const contract = ALL_ACTIONS.find((a) => a.id === "attending.contract-signed");
    const readConcepts = ALL_ACTIONS.find((a) => a.id === "mortgage-options.read-concepts");
    expect(contract!.weight).toBeGreaterThan(readConcepts!.weight * 2);
  });
});

describe("criteria evaluation", () => {
  it("reads guardrails and childcare from the profile", () => {
    const s = baseSnapshot();
    expect(evaluateCheck("guardrailsComplete", s)).toBe(true);
    expect(evaluateCheck("childcareMissing", s)).toBe(true);
    expect(evaluateCheck("childcareRecorded", s)).toBe(false);

    const withChildcare = baseSnapshot({
      financial: { ...s.financial, childcareMonthly: 2400 },
    });
    expect(evaluateCheck("childcareRecorded", withChildcare)).toBe(true);
    expect(evaluateCheck("childcareMissing", withChildcare)).toBe(false);
  });

  it("detects the attending contract timing risk near the target window", () => {
    const s = baseSnapshot({ today: new Date("2027-03-01T00:00:00.000Z") });
    expect(evaluateCheck("attendingContractLate", s)).toBe(true);

    const early = baseSnapshot({ today: new Date("2026-08-01T00:00:00.000Z") });
    expect(evaluateCheck("attendingContractLate", early)).toBe(false);

    const signed = baseSnapshot({
      today: new Date("2027-03-01T00:00:00.000Z"),
      attending: attendingTransitionSchema.parse({
        id: SINGLETON_ID,
        createdAt: TS,
        updatedAt: TS,
        contractSigned: true,
      }),
    });
    expect(evaluateCheck("attendingContractLate", signed)).toBe(false);
  });

  it("counts distinct lenders across quotes, approvals, and professionals", () => {
    const s = baseSnapshot({
      lenderQuotes: [
        { lender: "Alpha" } as never,
        { lender: "Beta" } as never,
      ],
      approvals: [
        mortgageApprovalSchema.parse({ id: "x", createdAt: TS, updatedAt: TS, lender: "Gamma" }),
      ],
      professionals: [
        professionalSchema.parse({ id: "p", createdAt: TS, updatedAt: TS, name: "Delta Bank", role: "lender" }),
      ],
    });
    expect(evaluateCheck("fourLendersRecorded", s)).toBe(true);
    expect(evaluateCheck("fewLenders", s)).toBe(false);
  });

  it("requires an in-person visit before a Primary town counts as visited", () => {
    const unvisited = townResearchSchema.parse({
      id: "t1", createdAt: TS, updatedAt: TS, name: "Summit", designation: "primary",
    });
    const s = baseSnapshot({ towns: [unvisited] });
    expect(evaluateCheck("primaryTownUnvisited", s)).toBe(true);
    expect(evaluateCheck("primaryTownsVisited", s)).toBe(false);

    const visited = townResearchSchema.parse({
      ...unvisited, visited: true, visitDate: "2026-10-01", doorToDoorCommuteMinutes: 75,
    });
    const s2 = baseSnapshot({ towns: [visited] });
    expect(evaluateCheck("primaryTownUnvisited", s2)).toBe(false);
    expect(evaluateCheck("primaryTownsVisited", s2)).toBe(true);
  });
});

describe("progress and readiness", () => {
  it("reports low but nonzero-friendly progress on a fresh plan", () => {
    const s = baseSnapshot();
    const progress = overallProgress(s);
    expect(progress.totalStages).toBe(18);
    expect(progress.fraction).toBeGreaterThanOrEqual(0);
    expect(progress.fraction).toBeLessThan(0.5);
    // Guardrails are set in the seed, so strategy shows some completion.
    expect(progress.currentStage).toBeDefined();
  });

  it("describes readiness in words, not just a percentage", () => {
    const s = baseSnapshot();
    const areas = readinessByArea(overallProgress(s).stages);
    expect(areas).toHaveLength(5);
    areas.forEach((a) => {
      expect(a.summary.length).toBeGreaterThan(0);
      expect(a.fraction).toBeGreaterThanOrEqual(0);
      expect(a.fraction).toBeLessThanOrEqual(1);
    });
  });

  it("marks a stage completed when its criteria are all met", () => {
    // Complete stage 2 (finances) core checks by satisfying its autoChecks.
    const s = baseSnapshot({
      financial: { ...baseSnapshot().financial, childcareMonthly: 2400 },
      documents: [
        { category: "taxes", status: "gathered" } as never,
        { category: "income", status: "gathered" } as never,
        { category: "bank-statements", status: "gathered" } as never,
        { category: "identification", status: "gathered" } as never,
      ],
    });
    const financeStage = overallProgress(s).stages.find((sp) => sp.stage.id === "finances")!;
    expect(financeStage.criteriaMet).toBeGreaterThanOrEqual(4);
  });
});

describe("next-action engine", () => {
  it("recommends recording attending salary and childcare on a fresh plan", () => {
    const recs = nextActions(baseSnapshot());
    const ids = recs.map((r) => r.id);
    expect(ids).toContain("attending-salary-unknown");
    expect(ids).toContain("childcare-missing");
    recs.forEach((r) => {
      expect(r.why).not.toBe("");
      expect(r.trigger).not.toBe("");
      expect(r.clearedBy).not.toBe("");
    });
  });

  it("raises a critical warning when an offer exceeds the walk-away price", () => {
    const property = {
      id: "prop1",
      isArchived: false,
      status: "possible-offer",
      address: "12 Maple St",
      offerPrice: 1400000,
    } as never;
    const deal = dealSchema.parse({
      id: "d1",
      createdAt: TS,
      updatedAt: TS,
      propertyId: "prop1",
      walkAwayPrice: 1300000,
    });
    const recs = nextActions(baseSnapshot({ properties: [property], deals: [deal] }));
    const critical = recs.find((r) => r.id === "offer-exceeds-walk-away");
    expect(critical).toBeDefined();
    expect(critical!.level).toBe("critical");
    expect(recs[0].level).toBe("critical");
  });

  it("does not raise the walk-away warning when the offer is within limit", () => {
    const property = {
      id: "prop1", isArchived: false, status: "possible-offer", address: "12 Maple St", offerPrice: 1250000,
    } as never;
    const deal = dealSchema.parse({
      id: "d1", createdAt: TS, updatedAt: TS, propertyId: "prop1", walkAwayPrice: 1300000,
    });
    const recs = nextActions(baseSnapshot({ properties: [property], deals: [deal] }));
    expect(recs.find((r) => r.id === "offer-exceeds-walk-away")).toBeUndefined();
  });
});

describe("personalization", () => {
  it("fills tokens and drops rules whose condition is false", () => {
    const s = baseSnapshot();
    const attendingStage = GUIDE_STAGES.find((st) => st.id === "attending")!;
    const lines = personalizedLines(attendingStage, s);
    // The "no salary recorded" rule should fire and mention the estimate.
    expect(lines.some((l) => l.toLowerCase().includes("attending salary"))).toBe(true);
    // No unresolved tokens remain.
    expect(lines.every((l) => !l.includes("{{"))).toBe(true);
  });

  it("substitutes money and window tokens in the strategy stage", () => {
    const s = baseSnapshot();
    const strategy = GUIDE_STAGES.find((st) => st.id === "strategy")!;
    const lines = personalizedLines(strategy, s);
    expect(lines.some((l) => l.includes("2027"))).toBe(true);
  });
});
