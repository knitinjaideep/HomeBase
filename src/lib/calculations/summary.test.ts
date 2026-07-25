import { describe, it, expect } from "vitest";
import { evaluatePlan, type PlanInputs } from "./summary";
import type { GuardrailThresholds } from "./guardrails";

const priceGuardrails: GuardrailThresholds = {
  comfortableCeiling: 1_150_000,
  maxTarget: 1_200_000,
  absoluteCeiling: 1_300_000,
};
const paymentGuardrails: GuardrailThresholds = {
  comfortableCeiling: 8_000,
  maxTarget: 9_000,
  absoluteCeiling: 10_000,
};

function baseInputs(overrides: Partial<PlanInputs> = {}): PlanInputs {
  return {
    purchasePrice: 1_100_000,
    downPayment: 220_000,
    annualRatePct: 6.5,
    termYears: 30,
    annualPropertyTaxes: 22_000,
    annualInsurance: 2_400,
    monthlyHoa: 0,
    includePmi: true,
    annualPmiRatePct: 0.6,
    closingCosts: 27_500,
    prepaidEscrow: 9_000,
    immediateRenovation: 20_000,
    movingBudget: 5_000,
    maintenancePct: 1,
    utilitiesMonthly: 500,
    commutingDeltaMonthly: 300,
    renovationAllocationMonthly: 0,
    availableFunds: 320_000,
    minReserve: 40_000,
    preferredReserve: 60_000,
    grossMonthlyIncome: 20_000,
    takeHomeMonthlyIncome: 12_000,
    monthlyDebts: 2_500,
    priceGuardrails,
    paymentGuardrails,
    ...overrides,
  };
}

describe("evaluatePlan", () => {
  it("composes the lender-style monthly payment from PITI + HOA", () => {
    const r = evaluatePlan(baseInputs());
    // 20% down → no PMI
    expect(r.lender.monthlyPmi).toBe(0);
    const expected =
      r.lender.principalAndInterest +
      r.lender.monthlyTaxes +
      r.lender.monthlyInsurance +
      r.lender.monthlyHoa;
    expect(r.lender.total).toBeCloseTo(expected, 5);
    expect(r.lender.monthlyTaxes).toBeCloseTo(22_000 / 12, 5);
  });

  it("real monthly cost exceeds the lender payment by ongoing costs", () => {
    const r = evaluatePlan(baseInputs());
    expect(r.realMonthlyOwnershipCost).toBeGreaterThan(r.lender.total);
    const expected =
      r.lender.total + r.maintenanceMonthly + 500 /* utilities */ + 300; /* commute */
    expect(r.realMonthlyOwnershipCost).toBeCloseTo(expected, 5);
  });

  it("computes cash required and remaining, and reserve differences", () => {
    const r = evaluatePlan(baseInputs());
    // 220k + 27.5k + 9k + 20k + 5k = 281.5k
    expect(r.cashRequiredAtClosing).toBe(281_500);
    // 320k - 281.5k = 38.5k
    expect(r.cashRemainingAfterClosing).toBe(38_500);
    expect(r.differenceFromMinReserve).toBe(38_500 - 40_000);
    expect(r.differenceFromPreferredReserve).toBe(38_500 - 60_000);
  });

  it("flags the reserve band as beyond-limit when below the minimum reserve", () => {
    const r = evaluatePlan(baseInputs());
    // remaining 38.5k < min 40k
    expect(r.reserveBand).toBe("beyond-limit");
    expect(r.overallBand).toBe("beyond-limit");
  });

  it("classifies a comfortable purchase within all guardrails", () => {
    const r = evaluatePlan(
      baseInputs({
        purchasePrice: 1_000_000,
        downPayment: 250_000,
        annualPropertyTaxes: 16_000,
        availableFunds: 400_000,
        immediateRenovation: 0,
      }),
    );
    expect(r.priceBand).toBe("comfortable");
    expect(r.reserveBand).toBe("comfortable");
    expect(["comfortable", "above-comfortable"]).toContain(r.overallBand);
  });

  it("classifies a price beyond the walk-away limit", () => {
    const r = evaluatePlan(baseInputs({ purchasePrice: 1_400_000 }));
    expect(r.priceBand).toBe("beyond-limit");
    expect(r.overallBand).toBe("beyond-limit");
  });

  it("reports income shares and total DTI", () => {
    const r = evaluatePlan(baseInputs());
    expect(r.housingPctOfGross).toBeCloseTo((r.lender.total / 20_000) * 100, 4);
    expect(r.housingPctOfTakeHome).toBeCloseTo((r.lender.total / 12_000) * 100, 4);
    expect(r.totalDti).toBeCloseTo(((r.lender.total + 2_500) / 20_000) * 100, 4);
  });

  it("adds PMI when the down payment is under 20%", () => {
    const r = evaluatePlan(baseInputs({ downPayment: 100_000 }));
    expect(r.lender.monthlyPmi).toBeGreaterThan(0);
  });
});
