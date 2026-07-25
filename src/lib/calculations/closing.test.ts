import { describe, it, expect } from "vitest";
import {
  cashRequiredAtClosing,
  cashRemainingAfterClosing,
  reserveDifference,
  estimatedClosingCosts,
} from "./closing";

describe("cashRequiredAtClosing", () => {
  it("sums down payment, closing, prepaids, renovation, and moving", () => {
    const total = cashRequiredAtClosing({
      downPayment: 200_000,
      closingCosts: 25_000,
      prepaidEscrow: 8_000,
      immediateRenovation: 15_000,
      movingBudget: 5_000,
    });
    expect(total).toBe(253_000);
  });
  it("treats negative components as zero", () => {
    const total = cashRequiredAtClosing({
      downPayment: 100_000,
      closingCosts: -5_000,
      prepaidEscrow: 0,
      immediateRenovation: 0,
      movingBudget: 0,
    });
    expect(total).toBe(100_000);
  });
});

describe("cashRemainingAfterClosing", () => {
  it("subtracts required cash from available funds", () => {
    expect(cashRemainingAfterClosing(300_000, 253_000)).toBe(47_000);
  });
  it("can be negative when funds fall short", () => {
    expect(cashRemainingAfterClosing(200_000, 253_000)).toBe(-53_000);
  });
});

describe("reserveDifference", () => {
  it("is positive when the reserve is exceeded", () => {
    expect(reserveDifference(47_000, 40_000)).toBe(7_000);
  });
  it("is negative when short of the reserve", () => {
    expect(reserveDifference(30_000, 40_000)).toBe(-10_000);
  });
});

describe("estimatedClosingCosts", () => {
  it("defaults to 2.5% of price", () => {
    expect(estimatedClosingCosts(1_000_000)).toBe(25_000);
  });
});
