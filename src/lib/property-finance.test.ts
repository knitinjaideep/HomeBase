import { describe, it, expect } from "vitest";
import {
  evaluateProperty,
  resolvePlanInputs,
  availablePurchaseFunds,
  grossMonthlyIncome,
  monthlyDebts,
  effectivePrice,
} from "./property-finance";
import { financialProfileSchema, householdProfileSchema, SINGLETON_ID } from "./models";
import { seedProperties } from "./seed";

/**
 * Local fixture numbers for these calculation tests — deliberately not
 * sourced from `seed/profile.ts` (which ships neutral/blank defaults; see
 * its privacy note) so this suite stays independent of that seed content.
 */
const ts = "2026-07-23T00:00:00.000Z";
const fin = financialProfileSchema.parse({
  id: SINGLETON_ID,
  createdAt: ts,
  updatedAt: ts,
  checking: 15_000,
  savings: 40_000,
  taxableInvestments: 250_000,
  retirementAccounts: 170_000,
  designatedDownPaymentCash: 36_000,
  minReserve: 40_000,
  preferredReserve: 60_000,
  retirementAvailableForPurchase: 0,
  vehicleBalanceRemaining: 30_000,
  carPaymentsAndInsuranceMonthly: 2_000,
  otherTransportMonthly: 500,
  studentLoansMonthly: 0,
  otherDebtMonthly: 0,
  groceriesMonthly: 750,
  diningShoppingMonthly: 500,
  insuranceMonthly: 400,
  retirementContributionMonthly: 400,
  espcontributionMonthly: 1_000,
  childcareMonthly: null,
  travelMonthly: 0,
  priceComfortableMin: 1_000_000,
  priceComfortableMax: 1_150_000,
  priceRoutineCeiling: 1_200_000,
  priceAbsoluteCeiling: 1_300_000,
  paymentComfortable: 8_000,
  paymentMaxTarget: 9_000,
  paymentAbsoluteCeiling: 10_000,
  planningInterestRatePct: 6.5,
  defaultLoanTermYears: 30,
  defaultMaintenancePct: 1,
});
const household = householdProfileSchema.parse({
  id: SINGLETON_ID,
  createdAt: ts,
  updatedAt: ts,
  planningDate: ts.slice(0, 10),
  idealPurchaseStart: "2027-05",
  idealPurchaseEnd: "2027-06",
  minOwnershipYears: 10,
  buyer1Name: "Buyer 1",
  buyer2Name: "Buyer 2",
  buyer1Income: { label: "Buyer 1 income", annualBase: 152_000, variableNote: "", isAssumption: false },
  buyer2Income: { label: "Buyer 2 income", annualBase: 80_000, variableNote: "", isAssumption: false },
  buyer2FutureIncome: { label: "Future income", annualBase: null, variableNote: "", isAssumption: true },
  combinedMonthlyTakeHome: 12_000,
  buyer1CreditScore: 800,
  buyer2CreditScore: 700,
  notes: "",
});
const [princeton, summit, ridgewood] = seedProperties();

describe("household finance helpers", () => {
  it("excludes retirement from available purchase funds", () => {
    // checking 15k + savings 40k + taxable 250k = 305k (retirement 170k excluded)
    expect(availablePurchaseFunds(fin)).toBe(305_000);
  });
  it("uses base incomes unless the future scenario is requested", () => {
    // (152k + 80k) / 12
    expect(grossMonthlyIncome(household)).toBeCloseTo((152_000 + 80_000) / 12, 4);
    // future buyer2 salary is unknown (null) → falls back to base
    expect(grossMonthlyIncome(household, true)).toBeCloseTo((152_000 + 80_000) / 12, 4);
  });
  it("sums recurring debt commitments", () => {
    // 2000 car + 500 transport + 0 + 0
    expect(monthlyDebts(fin)).toBe(2_500);
  });
});

describe("effectivePrice", () => {
  it("prefers offer price when present, else asking", () => {
    expect(effectivePrice(princeton)).toBe(1_000_000);
    const withOffer = { ...princeton, offerPrice: 990_000 };
    expect(effectivePrice(withOffer)).toBe(990_000);
  });
  it("is null when neither price is set", () => {
    const noPrice = { ...princeton, askingPrice: null, offerPrice: null };
    expect(effectivePrice(noPrice)).toBeNull();
  });
});

describe("resolvePlanInputs", () => {
  it("falls back to profile defaults for unset property fields", () => {
    const inputs = resolvePlanInputs(princeton, fin, household);
    expect(inputs.annualRatePct).toBe(fin.planningInterestRatePct); // property has no rate override
    expect(inputs.termYears).toBe(fin.defaultLoanTermYears);
    expect(inputs.maintenancePct).toBe(fin.defaultMaintenancePct);
    expect(inputs.downPayment).toBe(200_000); // property override
  });
  it("defaults down payment to 20% when unset", () => {
    const noDp = {
      ...princeton,
      finance: { ...princeton.finance, expectedDownPayment: null },
    };
    const inputs = resolvePlanInputs(noDp, fin, household);
    expect(inputs.downPayment).toBeCloseTo(1_000_000 * 0.2, 4);
  });
});

describe("evaluateProperty (comparison calculations)", () => {
  it("classifies the comfortable sample within range on every dimension", () => {
    const evalP = evaluateProperty(princeton, fin, household);
    expect(evalP.priceBand).toBe("comfortable"); // 1.0M ≤ 1.15M
    expect(evalP.reserveBand).toBe("comfortable"); // reserve preserved
    expect(evalP.overallBand).toBe("comfortable");
    expect(evalP.plan.lender.total).toBeGreaterThan(0);
    expect(evalP.score).not.toBeNull();
  });

  it("flags a near-maximum property above the comfortable range", () => {
    const evalS = evaluateProperty(summit, fin, household);
    // 1.24M is between routine ceiling (1.2M) and absolute ceiling (1.3M)
    expect(evalS.priceBand).toBe("near-maximum");
    expect(evalS.overallBand).toBe("near-maximum");
  });

  it("flags a property beyond the walk-away limit", () => {
    const evalR = evaluateProperty(ridgewood, fin, household);
    // 1.38M exceeds the 1.3M absolute ceiling
    expect(evalR.priceBand).toBe("beyond-limit");
    expect(evalR.overallBand).toBe("beyond-limit");
  });

  it("higher-priced homes produce higher lender payments (comparison ordering)", () => {
    const p = evaluateProperty(princeton, fin, household).plan.lender.total;
    const r = evaluateProperty(ridgewood, fin, household).plan.lender.total;
    expect(r).toBeGreaterThan(p);
  });

  it("marks bands missing when a property has no price", () => {
    const noPrice = { ...princeton, askingPrice: null, offerPrice: null };
    const evalN = evaluateProperty(noPrice, fin, household);
    expect(evalN.hasPrice).toBe(false);
    expect(evalN.overallBand).toBe("missing-info");
  });

  it("reports missing critical info", () => {
    const evalP = evaluateProperty(princeton, fin, household);
    // sample has unverified schools and no insurance override
    expect(evalP.missing).toContain("School assignment unverified");
    expect(evalP.missing).toContain("Insurance estimate missing");
  });
});
