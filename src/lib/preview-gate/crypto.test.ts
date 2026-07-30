import { describe, expect, it } from "vitest";
import { hmacSha256Base64Url, sha256Hex, timingSafeEqualStrings } from "./crypto";

describe("timingSafeEqualStrings", () => {
  it("returns true for identical strings", () => {
    expect(timingSafeEqualStrings("correct-horse", "correct-horse")).toBe(true);
  });

  it("returns true when both are empty", () => {
    expect(timingSafeEqualStrings("", "")).toBe(true);
  });

  it("returns false for different strings of the same length", () => {
    expect(timingSafeEqualStrings("aaaaaaaa", "aaaaaaab")).toBe(false);
  });

  it("returns false for different-length strings, even as a prefix", () => {
    expect(timingSafeEqualStrings("correct", "correct-horse")).toBe(false);
    expect(timingSafeEqualStrings("correct-horse", "correct")).toBe(false);
  });

  it("is case sensitive", () => {
    expect(timingSafeEqualStrings("Secret", "secret")).toBe(false);
  });
});

describe("hmacSha256Base64Url", () => {
  it("is deterministic for the same secret and message", async () => {
    const a = await hmacSha256Base64Url("secret", "payload");
    const b = await hmacSha256Base64Url("secret", "payload");
    expect(a).toBe(b);
  });

  it("differs when the secret changes", async () => {
    const a = await hmacSha256Base64Url("secret-a", "payload");
    const b = await hmacSha256Base64Url("secret-b", "payload");
    expect(a).not.toBe(b);
  });

  it("differs when the message changes", async () => {
    const a = await hmacSha256Base64Url("secret", "payload-a");
    const b = await hmacSha256Base64Url("secret", "payload-b");
    expect(a).not.toBe(b);
  });

  it("produces a URL-safe, unpadded string", async () => {
    const signature = await hmacSha256Base64Url("secret", "payload");
    expect(signature).not.toMatch(/[+/=]/);
  });
});

describe("sha256Hex", () => {
  it("is deterministic and produces 64 lowercase hex characters", async () => {
    const a = await sha256Hex("192.0.2.1");
    const b = await sha256Hex("192.0.2.1");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("differs for different inputs", async () => {
    const a = await sha256Hex("192.0.2.1");
    const b = await sha256Hex("192.0.2.2");
    expect(a).not.toBe(b);
  });
});
