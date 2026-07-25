import { describe, it, expect } from "vitest";
import { pointsCost, estimateLenderQuote } from "./lender";

describe("pointsCost", () => {
  it("computes the dollar cost of points", () => {
    expect(pointsCost(800_000, 1)).toBe(8_000);
    expect(pointsCost(800_000, 0.5)).toBe(4_000);
  });
});

describe("estimateLenderQuote", () => {
  it("returns payment, upfront cost, and 5-year totals", () => {
    const est = estimateLenderQuote({
      loanAmount: 800_000,
      interestRatePct: 6.5,
      loanTermYears: 30,
      points: 1,
      lenderFees: 3_000,
    });
    expect(est.monthlyPrincipalAndInterest).toBeCloseTo(5056.54, 1);
    expect(est.upfrontLenderCost).toBe(11_000); // 8,000 points + 3,000 fees
    expect(est.fiveYearInterest).toBeGreaterThan(240_000);
    expect(est.fiveYearInterest).toBeLessThan(260_000);
    expect(est.fiveYearTotalFinancingCost).toBeCloseTo(
      est.upfrontLenderCost + est.fiveYearInterest,
      5,
    );
  });

  it("does not rank by rate alone — a lower rate with heavy points can cost more upfront", () => {
    const lowRateHighPoints = estimateLenderQuote({
      loanAmount: 800_000,
      interestRatePct: 6.0,
      loanTermYears: 30,
      points: 3,
      lenderFees: 3_000,
    });
    const higherRateNoPoints = estimateLenderQuote({
      loanAmount: 800_000,
      interestRatePct: 6.5,
      loanTermYears: 30,
      points: 0,
      lenderFees: 3_000,
    });
    expect(lowRateHighPoints.upfrontLenderCost).toBeGreaterThan(
      higherRateNoPoints.upfrontLenderCost,
    );
  });
});
