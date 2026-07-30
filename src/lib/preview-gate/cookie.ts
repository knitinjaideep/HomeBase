/**
 * The preview-authorization cookie's name, shape, and lifetime. Bumping
 * PREVIEW_TOKEN_VERSION here (a code change, not an env var) invalidates
 * every previously issued cookie immediately — the same effect as rotating
 * PREVIEW_COOKIE_SECRET, without needing to touch environment configuration.
 */

export const PREVIEW_TOKEN_VERSION = 1;

export const PREVIEW_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

// Next.js always sets NODE_ENV=production for `next build`/`next start` and
// every Vercel deployment (Preview and Production alike); only `next dev`
// uses "development". Secure cookies work fine on Vercel Preview URLs (they
// are HTTPS) and on http://localhost (browsers treat localhost as a secure
// context), so gating on NODE_ENV alone is sufficient here.
const isSecureRuntime = process.env.NODE_ENV === "production";

/**
 * `__Host-` requires Secure + Path=/ + no Domain attribute, which this cookie
 * already satisfies whenever it's marked Secure — giving the strongest cookie
 * isolation guarantee Chrome/Firefox support. Falls back to a plain name in
 * local dev, where the cookie isn't marked Secure.
 */
export const PREVIEW_COOKIE_NAME = isSecureRuntime ? "__Host-hs-preview" : "hs-preview-dev";

export function previewCookieOptions() {
  return {
    httpOnly: true,
    secure: isSecureRuntime,
    sameSite: "lax" as const,
    path: "/",
    maxAge: PREVIEW_COOKIE_MAX_AGE_SECONDS,
  };
}
