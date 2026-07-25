import { describe, it, expect } from "vitest";
import { overallScore, DEFAULT_SCORE_WEIGHTS } from "./score";

describe("overallScore", () => {
  it("computes a weighted average over present ratings", () => {
    const score = overallScore({ a: 4, b: 2 }, { a: 3, b: 1 });
    // (4*3 + 2*1) / (3+1) = 14/4 = 3.5
    expect(score).toBeCloseTo(3.5, 5);
  });
  it("omits missing ratings and renormalizes weights", () => {
    const score = overallScore({ a: 4, b: undefined }, { a: 3, b: 1 });
    // only a present → 4
    expect(score).toBe(4);
  });
  it("returns null when nothing is rated", () => {
    expect(overallScore({ a: undefined }, { a: 3 })).toBeNull();
    expect(overallScore({}, DEFAULT_SCORE_WEIGHTS)).toBeNull();
  });
  it("ignores zero-weight keys", () => {
    const score = overallScore({ a: 5, b: 1 }, { a: 1, b: 0 });
    expect(score).toBe(5);
  });
});
