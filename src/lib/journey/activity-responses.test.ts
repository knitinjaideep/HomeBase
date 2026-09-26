import { describe, it, expect } from "vitest";
import { parseActivityResponses, readActivityResponses } from "./activity-responses";

describe("activity responses", () => {
  it("reads valid stored answers and treats missing ones as empty", () => {
    expect(readActivityResponses("commute", { daysPerWeek: 3 })).toEqual({ daysPerWeek: 3 });
    expect(readActivityResponses("commute", undefined)).toEqual({});
  });

  it("treats invalid stored data as nothing recorded instead of throwing", () => {
    expect(readActivityResponses("commute", { daysPerWeek: "lots" })).toEqual({});
  });

  it("rejects out-of-range values before they are written", () => {
    expect(() => parseActivityResponses("commute", { daysPerWeek: 9 })).toThrow();
    expect(parseActivityResponses("commute", { daysPerWeek: null })).toEqual({ daysPerWeek: null });
  });
});
