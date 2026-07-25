import { describe, it, expect } from "vitest";
import { housingRatio, totalDebtToIncome, toMonthly } from "./dti";

describe("housingRatio", () => {
  it("computes housing as a percent of income", () => {
    expect(housingRatio(8_000, 32_000)).toBe(25);
  });
  it("returns 0 when income is 0", () => {
    expect(housingRatio(8_000, 0)).toBe(0);
  });
});

describe("totalDebtToIncome", () => {
  it("adds housing and other debts over gross income", () => {
    // (8000 + 2500) / 35000 = 30%
    expect(totalDebtToIncome(8_000, 2_500, 35_000)).toBeCloseTo(30, 5);
  });
  it("ignores negative debt values", () => {
    expect(totalDebtToIncome(8_000, -2_500, 32_000)).toBe(25);
  });
  it("returns 0 when gross income is 0", () => {
    expect(totalDebtToIncome(8_000, 2_500, 0)).toBe(0);
  });
});

describe("toMonthly", () => {
  it("divides annual by 12", () => {
    expect(toMonthly(120_000)).toBe(10_000);
  });
});
