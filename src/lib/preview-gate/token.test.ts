import { describe, expect, it } from "vitest";
import { createPreviewToken, verifyPreviewToken } from "./token";
import { PREVIEW_TOKEN_VERSION } from "./cookie";

const SECRET = "cookie-secret";

describe("createPreviewToken / verifyPreviewToken", () => {
  it("round-trips a freshly issued token", async () => {
    const token = await createPreviewToken(SECRET);
    expect(await verifyPreviewToken(token, SECRET)).toBe(true);
  });

  it("never embeds the raw access key — only version, timestamp, and signature", async () => {
    const token = await createPreviewToken(SECRET);
    const parts = token.split(".");
    expect(parts).toHaveLength(3);
    expect(token).not.toContain(SECRET);
  });

  it("rejects a token signed with a different (rotated) secret", async () => {
    const token = await createPreviewToken("old-secret");
    expect(await verifyPreviewToken(token, "new-secret")).toBe(false);
  });

  it("rejects a tampered signature", async () => {
    const token = await createPreviewToken(SECRET);
    const [version, issuedAt] = token.split(".");
    const tampered = `${version}.${issuedAt}.not-the-real-signature`;
    expect(await verifyPreviewToken(tampered, SECRET)).toBe(false);
  });

  it("rejects a token with a mismatched version", async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const token = await createPreviewToken(SECRET, nowSeconds, PREVIEW_TOKEN_VERSION + 1);
    expect(await verifyPreviewToken(token, SECRET)).toBe(false);
  });

  it("rejects an expired token", async () => {
    const THIRTY_ONE_DAYS_AGO = Math.floor(Date.now() / 1000) - 31 * 24 * 60 * 60;
    const token = await createPreviewToken(SECRET, THIRTY_ONE_DAYS_AGO);
    expect(await verifyPreviewToken(token, SECRET)).toBe(false);
  });

  it("rejects a token issued too far in the future", async () => {
    const FIVE_MINUTES_FROM_NOW = Math.floor(Date.now() / 1000) + 5 * 60;
    const token = await createPreviewToken(SECRET, FIVE_MINUTES_FROM_NOW);
    expect(await verifyPreviewToken(token, SECRET)).toBe(false);
  });

  it("rejects malformed tokens", async () => {
    expect(await verifyPreviewToken("not-a-token", SECRET)).toBe(false);
    expect(await verifyPreviewToken("1.2", SECRET)).toBe(false);
    expect(await verifyPreviewToken("", SECRET)).toBe(false);
  });

  it("rejects a non-numeric issued-at field", async () => {
    expect(await verifyPreviewToken(`${PREVIEW_TOKEN_VERSION}.not-a-number.sig`, SECRET)).toBe(false);
  });
});
