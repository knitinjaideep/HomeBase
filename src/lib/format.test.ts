import { describe, it, expect } from "vitest";
import { expiresInLabel } from "./format";

describe("expiresInLabel", () => {
  it("returns an em dash for null/undefined", () => {
    expect(expiresInLabel(null)).toBe("—");
    expect(expiresInLabel(undefined)).toBe("—");
  });

  it("returns an em dash for an unparseable string", () => {
    expect(expiresInLabel("not a date")).toBe("—");
  });

  it("reports already-passed timestamps as Expired", () => {
    expect(expiresInLabel(new Date(Date.now() - 1000).toISOString())).toBe("Expired");
  });

  it("reports sub-hour remaining time distinctly", () => {
    expect(expiresInLabel(new Date(Date.now() + 30 * 60 * 1000).toISOString())).toBe(
      "Expires in under an hour",
    );
  });

  it("reports hours for under a day remaining", () => {
    expect(expiresInLabel(new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString())).toBe(
      "Expires in 5h",
    );
  });

  it("reports days once at least a day remains", () => {
    expect(expiresInLabel(new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString())).toBe(
      "Expires in 2d",
    );
  });
});
