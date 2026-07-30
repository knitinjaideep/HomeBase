import { hmacSha256Base64Url, timingSafeEqualStrings } from "./crypto";
import { PREVIEW_COOKIE_MAX_AGE_SECONDS, PREVIEW_TOKEN_VERSION } from "./cookie";

// Tolerates modest clock drift between the issuing request and later
// verification (e.g. serverless instances with slightly skewed clocks)
// without meaningfully weakening the expiry check.
const CLOCK_SKEW_SECONDS = 60;

/**
 * The cookie value: `${version}.${issuedAtSeconds}.${signature}`. Never
 * contains the raw access key — only a signed attestation that it was
 * verified at `issuedAtSeconds`.
 */
export async function createPreviewToken(
  cookieSecret: string,
  issuedAtSeconds: number = Math.floor(Date.now() / 1000),
  version: number = PREVIEW_TOKEN_VERSION,
): Promise<string> {
  const payload = `${version}.${issuedAtSeconds}`;
  const signature = await hmacSha256Base64Url(cookieSecret, payload);
  return `${payload}.${signature}`;
}

/**
 * Rejects malformed tokens, wrong/rotated versions, tampered or mis-keyed
 * signatures, future-dated tokens beyond clock skew tolerance, and tokens
 * older than {@link PREVIEW_COOKIE_MAX_AGE_SECONDS}.
 */
export async function verifyPreviewToken(token: string, cookieSecret: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [versionStr, issuedAtStr, signature] = parts;
  if (versionStr !== String(PREVIEW_TOKEN_VERSION)) return false;
  if (!/^\d+$/.test(issuedAtStr)) return false;

  const issuedAt = Number(issuedAtStr);
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (issuedAt > nowSeconds + CLOCK_SKEW_SECONDS) return false;
  if (nowSeconds - issuedAt > PREVIEW_COOKIE_MAX_AGE_SECONDS) return false;

  const expectedSignature = await hmacSha256Base64Url(cookieSecret, `${versionStr}.${issuedAtStr}`);
  return timingSafeEqualStrings(signature, expectedSignature);
}
