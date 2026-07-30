import { describe, expect, it } from "vitest";
import { checkRateLimit, getClientIdentifier, resetRateLimit } from "./rate-limit";

function id(name: string): string {
  // Unique per test so shared module-level state doesn't leak between cases.
  return `test:${name}:${Math.random()}`;
}

describe("checkRateLimit", () => {
  it("allows attempts under the threshold", () => {
    const identifier = id("under-threshold");
    for (let i = 0; i < 8; i++) {
      expect(checkRateLimit(identifier).allowed).toBe(true);
    }
  });

  it("blocks once the threshold is exceeded within the window", () => {
    const identifier = id("over-threshold");
    for (let i = 0; i < 8; i++) checkRateLimit(identifier);
    expect(checkRateLimit(identifier).allowed).toBe(false);
    expect(checkRateLimit(identifier).allowed).toBe(false);
  });

  it("resetRateLimit clears the counter so the identifier can try again", () => {
    const identifier = id("reset");
    for (let i = 0; i < 8; i++) checkRateLimit(identifier);
    expect(checkRateLimit(identifier).allowed).toBe(false);
    resetRateLimit(identifier);
    expect(checkRateLimit(identifier).allowed).toBe(true);
  });

  it("allows attempts again once the window has elapsed", () => {
    const identifier = id("window-elapsed");
    const start = 1_000_000;
    for (let i = 0; i < 8; i++) checkRateLimit(identifier, start);
    expect(checkRateLimit(identifier, start).allowed).toBe(false);

    const afterWindow = start + 10 * 60 * 1000 + 1;
    expect(checkRateLimit(identifier, afterWindow).allowed).toBe(true);
  });

  it("tracks separate identifiers independently", () => {
    const a = id("a");
    const b = id("b");
    for (let i = 0; i < 8; i++) checkRateLimit(a);
    expect(checkRateLimit(a).allowed).toBe(false);
    expect(checkRateLimit(b).allowed).toBe(true);
  });
});

describe("getClientIdentifier", () => {
  it("prefers the first x-forwarded-for entry", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" });
    expect(getClientIdentifier(headers)).toBe("ip:203.0.113.5");
  });

  it("falls back to x-real-ip", () => {
    const headers = new Headers({ "x-real-ip": "203.0.113.9" });
    expect(getClientIdentifier(headers)).toBe("ip:203.0.113.9");
  });

  it("falls back to a coarse user-agent + accept-language signal", () => {
    const headers = new Headers({ "user-agent": "TestAgent/1.0", "accept-language": "en-US" });
    expect(getClientIdentifier(headers)).toBe("ua:TestAgent/1.0|en-US");
  });

  it("never throws when no identifying headers are present", () => {
    expect(() => getClientIdentifier(new Headers())).not.toThrow();
  });
});
