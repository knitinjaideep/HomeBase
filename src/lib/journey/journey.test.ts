import { describe, it, expect } from "vitest";
import {
  attendingTransitionSchema,
  dealSchema,
  financialProfileSchema,
  homePreferencesSchema,
  householdProfileSchema,
  mortgageApprovalSchema,
  professionalSchema,
  propertySchema,
  townResearchSchema,
  SINGLETON_ID,
} from "@/lib/models";
import {
  GUIDE_STAGES,
  ALL_ACTIONS,
  TOTAL_GUIDE_WEIGHT,
  STAGE_IDS,
  JOURNEY_STAGES,
  getStage,
  getJourneyStage,
  stageForActivity,
} from "@/lib/guide";
import { evaluateCheck, primaryDeal } from "./criteria";
import {
  activityProgress,
  journeyStageProgress,
  overallProgress,
  readinessByArea,
  type ActivityProgress,
} from "./progress";
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
  it("has 21 activities with unique ids, orders, and numbers, matching STAGE_IDS", () => {
    expect(GUIDE_STAGES).toHaveLength(21);
    expect(new Set(GUIDE_STAGES.map((s) => s.id)).size).toBe(21);
    expect(new Set(GUIDE_STAGES.map((s) => s.order)).size).toBe(21);
    expect(new Set(GUIDE_STAGES.map((s) => s.number)).size).toBe(21);
    expect([...GUIDE_STAGES.map((s) => s.id)].sort()).toEqual([...STAGE_IDS].sort());
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

  it("includes the first-time-buyer 'understand the process' prep item in strategy", () => {
    const action = ALL_ACTIONS.find((a) => a.id === "strategy.understand-process");
    expect(action).toBeDefined();
    expect(action!.stageId).toBe("strategy");
    expect(action!.weight).toBe(2);
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

  it("keeps a purchased property's deal as the primary one, so the buying journey stays accurate after conversion", () => {
    const property = propertySchema.parse({
      id: "prop1",
      createdAt: TS,
      updatedAt: TS,
      address: "12 Maple St",
      dateAdded: "2026-01-01",
      schools: {},
      ratings: {},
      finance: {},
      status: "purchased",
    });
    const deal = dealSchema.parse({
      id: "deal1",
      createdAt: TS,
      updatedAt: TS,
      propertyId: "prop1",
      attorneyReview: { attorneyApproved: true },
      postClosing: { closingCompleted: true },
    });
    const s = baseSnapshot({ properties: [property], deals: [deal] });

    expect(primaryDeal(s)?.property.status).toBe("purchased");
    expect(evaluateCheck("dealClosed", s)).toBe(true);
    expect(evaluateCheck("dealAttorneyApproved", s)).toBe(true);
  });
});

describe("progress and readiness", () => {
  it("reports low but nonzero-friendly progress on a fresh plan", () => {
    const s = baseSnapshot();
    const progress = overallProgress(s);
    expect(progress.totalStages).toBe(6);
    expect(progress.activities).toHaveLength(21);
    expect(progress.fraction).toBeGreaterThanOrEqual(0);
    expect(progress.fraction).toBeLessThan(0.5);
    expect(progress.focusStage).toBeDefined();
  });

  it("describes readiness in words, not just a percentage", () => {
    const s = baseSnapshot();
    const areas = readinessByArea(overallProgress(s).activities);
    expect(areas).toHaveLength(5);
    areas.forEach((a) => {
      expect(a.summary.length).toBeGreaterThan(0);
      expect(a.fraction).toBeGreaterThanOrEqual(0);
      expect(a.fraction).toBeLessThanOrEqual(1);
    });
  });

  it("counts criteria met for an activity from stored data", () => {
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
    const financeActivity = overallProgress(s).activities.find((ap) => ap.activity.id === "finances")!;
    expect(financeActivity.criteriaMet).toBeGreaterThanOrEqual(4);
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

// ---- Journey → Stage → Activity -------------------------------------------

/** An action row in a given status, as stored. */
function actionRow(id: string, status: string): never {
  return { id, status, stageId: "x", createdAt: TS, updatedAt: TS } as never;
}

/** Settle every task in an activity so its own status becomes completed/ready. */
function settleActivity(activityId: string, status = "completed"): never[] {
  return getStage(activityId)!.actions.map((a) => actionRow(a.id, status));
}

describe("journey stages", () => {
  it("has the six broad stages in order", () => {
    expect(JOURNEY_STAGES.map((st) => st.title)).toEqual([
      "Get Ready",
      "Buying Power",
      "Team & Search Plan",
      "Find a Home",
      "Make an Offer",
      "Close",
    ]);
    JOURNEY_STAGES.forEach((st, i) => expect(st.order).toBe(i + 1));
  });

  it("places every activity in exactly one stage, and nothing unknown", () => {
    const placed = JOURNEY_STAGES.flatMap((st) => st.activityIds);
    expect(new Set(placed).size).toBe(placed.length);
    expect([...placed].sort()).toEqual([...STAGE_IDS].sort());
    STAGE_IDS.forEach((id) => expect(stageForActivity(id).activityIds).toContain(id));
  });

  it("maps the requested activities into the requested stages", () => {
    const stageOf = (id: (typeof STAGE_IDS)[number]) => stageForActivity(id).id;
    expect(stageOf("strategy")).toBe("get-ready");
    expect(stageOf("attending")).toBe("get-ready"); // Future income
    expect(stageOf("town-research")).toBe("get-ready"); // Towns
    expect(stageOf("home-preferences")).toBe("get-ready");
    expect(stageOf("school-priorities")).toBe("get-ready");
    expect(stageOf("commute")).toBe("get-ready");
    expect(stageOf("preapproval")).toBe("buying-power");
    expect(stageOf("agent-selection")).toBe("team-search-plan");
    expect(stageOf("touring")).toBe("find-a-home");
    expect(stageOf("attorney-review")).toBe("make-an-offer");
    expect(stageOf("inspections")).toBe("close"); // moved out of the offer stage
    expect(stageOf("closing")).toBe("close");
  });

  it("keeps every legacy activity id resolvable and never collides with a stage id", () => {
    STAGE_IDS.forEach((id) => {
      expect(getStage(id)).toBeDefined();
      expect(getJourneyStage(id)).toBeUndefined();
    });
    JOURNEY_STAGES.forEach((st) => {
      expect(getJourneyStage(st.id)).toBe(st);
      expect(getStage(st.id)).toBeUndefined();
    });
    expect(getJourneyStage("nope")).toBeUndefined();
  });

  it("carved home preferences, school, and commute out of strategy without changing any task id", () => {
    const moved: Record<string, string[]> = {
      "home-preferences": [
        "strategy.minimum-requirements",
        "strategy.preferences",
        "strategy.dealbreakers",
        "strategy.renovation-tolerance",
      ],
      "school-priorities": ["strategy.school-requirements"],
      commute: ["strategy.commute-requirements"],
    };
    for (const [activityId, taskIds] of Object.entries(moved)) {
      expect(getStage(activityId)!.actions.map((a) => a.id)).toEqual(taskIds);
    }
    const strategyIds = getStage("strategy")!.actions.map((a) => a.id);
    Object.values(moved).flat().forEach((id) => expect(strategyIds).not.toContain(id));
    // Every task is still defined exactly once, so saved progress still lines up.
    const all = ALL_ACTIONS.map((a) => a.id);
    expect(new Set(all).size).toBe(all.length);
    Object.values(moved).flat().forEach((id) => expect(all).toContain(id));
  });

  it("derives a stage's progress from its activities: 3 of 7 is 43%", () => {
    const stage = JOURNEY_STAGES.find((st) => st.id === "get-ready")!;
    const base = baseSnapshot();
    const activities = stage.activityIds.map((id, i) => ({
      ...activityProgress(getStage(id)!, base),
      status: i < 3 ? "completed" : "not-started",
    })) as ActivityProgress[];
    const sp = journeyStageProgress(stage, activities);
    expect(sp.activitiesTotal).toBe(7);
    expect(sp.activitiesDone).toBe(3);
    expect(sp.fraction).toBeCloseTo(3 / 7, 5);
    expect(Math.round(sp.fraction * 100)).toBe(43);
    expect(sp.status).toBe("in-progress");
  });

  it("completes the carved-out activities from their own tasks and criteria", () => {
    const s = baseSnapshot({
      actions: [
        ...settleActivity("home-preferences"),
        ...settleActivity("school-priorities"),
        ...settleActivity("commute"),
      ],
      preferences: { ...baseSnapshot().preferences, dealbreakerNotes: "No busy road." },
    });
    const getReady = overallProgress(s).stages.find((sp) => sp.stage.id === "get-ready")!;
    const done = getReady.activities.filter((ap) => ap.status === "completed").map((ap) => ap.activity.id);
    expect(done.sort()).toEqual(["commute", "home-preferences", "school-priorities"]);
    expect(getReady.activitiesDone).toBe(3);
  });

  it("computes stage status: not started, in progress, completed", () => {
    const stage = JOURNEY_STAGES.find((st) => st.id === "find-a-home")!;
    const mk = (statuses: Record<string, ActivityProgress["status"]>) => {
      const s = baseSnapshot();
      const activities = stage.activityIds.map((id) => ({
        ...activityProgress(getStage(id)!, s),
        status: statuses[id] ?? "not-started",
      }));
      return journeyStageProgress(stage, activities as ActivityProgress[]);
    };

    expect(mk({}).status).toBe("not-started");
    expect(mk({}).fraction).toBe(0);

    const partial = mk({ touring: "in-progress" });
    expect(partial.status).toBe("in-progress");
    expect(partial.activitiesInProgress).toBe(1);

    expect(mk({ touring: "completed" }).status).toBe("in-progress");
    expect(mk({ touring: "completed" }).fraction).toBe(0.5);

    const all = mk({ "active-search": "completed", touring: "completed" });
    expect(all.status).toBe("completed");
    expect(all.fraction).toBe(1);

    // Not-applicable counts as settled, like tasks do.
    expect(mk({ "active-search": "not-applicable", touring: "completed" }).status).toBe("completed");
  });

  it("does not require activities to be finished in order", () => {
    // Work starts in the very last activity with nothing earlier touched.
    const lastTask = getStage("closing")!.actions[0];
    const p = overallProgress(baseSnapshot({ actions: [actionRow(lastTask.id, "in-progress")] }));
    expect(p.stages.find((sp) => sp.stage.id === "close")!.status).toBe("in-progress");
    expect(p.stages.find((sp) => sp.stage.id === "get-ready")!.activitiesInProgress).toBe(0);

    // Several activities in one stage can be underway at the same time.
    const parallel = baseSnapshot({
      actions: [
        actionRow(getStage("strategy")!.actions[0].id, "in-progress"),
        actionRow(getStage("finances")!.actions[0].id, "in-progress"),
        actionRow(getStage("town-research")!.actions[0].id, "in-progress"),
      ],
    });
    const getReady = overallProgress(parallel).stages.find((sp) => sp.stage.id === "get-ready")!;
    expect(getReady.activitiesInProgress).toBe(3);
    expect(getReady.status).toBe("in-progress");
  });

  it("points the focus hint at an in-progress stage, else the earliest open one", () => {
    expect(overallProgress(baseSnapshot()).focusStage?.id).toBe("get-ready");
    const s = baseSnapshot({ actions: [actionRow(getStage("preapproval")!.actions[0].id, "in-progress")] });
    expect(overallProgress(s).focusStage?.id).toBe("buying-power");
  });
});
