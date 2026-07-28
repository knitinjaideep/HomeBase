import { describe, it, expect } from "vitest";
import { propertyMatchesSearch } from "@/lib/property-search";

const property = { address: "10 Maple Ave", town: "Montclair" };

describe("propertyMatchesSearch", () => {
  it("matches everything on a blank query (the box is not filtering)", () => {
    expect(propertyMatchesSearch(property, "")).toBe(true);
  });

  it("matches everything on a whitespace-only query — clearing never crashes", () => {
    expect(propertyMatchesSearch(property, "   ")).toBe(true);
  });

  it("matches on an address substring, case-insensitively", () => {
    expect(propertyMatchesSearch(property, "MAPLE")).toBe(true);
  });

  it("matches on a town substring", () => {
    expect(propertyMatchesSearch(property, "montc")).toBe(true);
  });

  it("does not match an unrelated query", () => {
    expect(propertyMatchesSearch(property, "zzz")).toBe(false);
  });
});
