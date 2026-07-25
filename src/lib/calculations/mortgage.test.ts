import { describe, it, expect } from "vitest";
import {
  loanAmount,
  monthlyPrincipalAndInterest,
  downPaymentPercent,
  monthlyPmi,
  cumulativeInterest,
} from "./mortgage";

describe("loanAmount", () => {
  it("subtracts down payment from price", () => {
    expect(loanAmount(1_000_000, 200_000)).toBe(800_000);
  });
  it("never returns negative", () => {
    expect(loanAmount(300_000, 400_000)).toBe(0);
  });
});

describe("monthlyPrincipalAndInterest", () => {
  it("matches the standard amortization formula", () => {
    // $800,000 @ 6.5% for 30 years ≈ $5,056.54/mo
    const pi = monthlyPrincipalAndInterest(800_000, 6.5, 30);
    expect(pi).toBeCloseTo(5056.54, 1);
  });
  it("handles a 0% rate as straight-line principal", () => {
    // $360,000 over 30 years (360 months) = $1,000/mo
    expect(monthlyPrincipalAndInterest(360_000, 0, 30)).toBeCloseTo(1000, 5);
  });
  it("returns 0 for a non-positive principal", () => {
    expect(monthlyPrincipalAndInterest(0, 6, 30)).toBe(0);
    expect(monthlyPrincipalAndInterest(-100, 6, 30)).toBe(0);
  });
  it("returns 0 for a non-positive term", () => {
    expect(monthlyPrincipalAndInterest(100_000, 6, 0)).toBe(0);
  });
});

describe("downPaymentPercent", () => {
  it("computes the percentage", () => {
    expect(downPaymentPercent(1_000_000, 200_000)).toBe(20);
  });
  it("returns 0 when price is 0", () => {
    expect(downPaymentPercent(0, 50_000)).toBe(0);
  });
});

describe("monthlyPmi", () => {
  it("is zero at 20% down or more", () => {
    expect(monthlyPmi(800_000, 20)).toBe(0);
    expect(monthlyPmi(800_000, 25)).toBe(0);
  });
  it("applies an annual rate to the loan when under 20% down", () => {
    // 900,000 * 0.6% / 12 = 450/mo
    expect(monthlyPmi(900_000, 10, 0.6)).toBeCloseTo(450, 5);
  });
});

describe("cumulativeInterest", () => {
  it("sums interest over the first N payments", () => {
    // First-year interest on 800k @ 6.5%/30yr is roughly $51,700
    const firstYear = cumulativeInterest(800_000, 6.5, 30, 12);
    expect(firstYear).toBeGreaterThan(51_000);
    expect(firstYear).toBeLessThan(52_000);
  });
  it("is monotonic — 5 years exceeds 1 year", () => {
    const oneYear = cumulativeInterest(800_000, 6.5, 30, 12);
    const fiveYear = cumulativeInterest(800_000, 6.5, 30, 60);
    expect(fiveYear).toBeGreaterThan(oneYear);
  });
  it("is zero at a 0% rate", () => {
    expect(cumulativeInterest(800_000, 0, 30, 60)).toBe(0);
  });
});
