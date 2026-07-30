import { describe, expect, it } from "vitest";
import { sanitizeReturnTo } from "./return-to";

describe("sanitizeReturnTo", () => {
  it("passes through a normal internal path", () => {
    expect(sanitizeReturnTo("/journey")).toBe("/journey");
  });

  it("preserves a query string on the internal path", () => {
    expect(sanitizeReturnTo("/journey/stage-1?tab=actions")).toBe("/journey/stage-1?tab=actions");
  });

  it("defaults to / for null or missing input", () => {
    expect(sanitizeReturnTo(null)).toBe("/");
    expect(sanitizeReturnTo(undefined)).toBe("/");
    expect(sanitizeReturnTo("")).toBe("/");
  });

  it("rejects absolute URLs", () => {
    expect(sanitizeReturnTo("https://evil.example.com/phish")).toBe("/");
    expect(sanitizeReturnTo("http://evil.example.com")).toBe("/");
  });

  it("rejects protocol-relative URLs", () => {
    expect(sanitizeReturnTo("//evil.example.com")).toBe("/");
  });

  it("rejects backslash tricks some browsers treat as slashes", () => {
    expect(sanitizeReturnTo("/\\evil.example.com")).toBe("/");
    expect(sanitizeReturnTo("/a\\b")).toBe("/");
  });

  it("rejects encoded variants of a protocol-relative URL", () => {
    expect(sanitizeReturnTo("%2F%2Fevil.example.com")).toBe("/");
  });

  it("rejects a value that doesn't start with a slash", () => {
    expect(sanitizeReturnTo("journey")).toBe("/");
    expect(sanitizeReturnTo("javascript:alert(1)")).toBe("/");
  });

  it("rejects malformed percent-encoding", () => {
    expect(sanitizeReturnTo("/%")).toBe("/");
  });

  it("never redirects back into the gate itself", () => {
    expect(sanitizeReturnTo("/preview-access")).toBe("/");
    expect(sanitizeReturnTo("/preview-access/")).toBe("/");
    expect(sanitizeReturnTo("/preview-access?returnTo=%2Fjourney")).toBe("/");
  });
});
