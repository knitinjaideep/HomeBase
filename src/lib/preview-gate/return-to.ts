/**
 * Restores the visitor's originally requested URL after preview access is
 * granted, without ever allowing an open redirect. Only an internal relative
 * path is accepted — anything else (absolute URL, protocol-relative URL,
 * backslash tricks, encoded slashes, control characters) falls back to "/".
 */
export function sanitizeReturnTo(raw: string | null | undefined): string {
  if (!raw) return "/";
  if (raw.length > 2048) return "/";

  let value: string;
  try {
    value = decodeURIComponent(raw);
  } catch {
    return "/";
  }

  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/"; // protocol-relative
  if (value.startsWith("/\\")) return "/"; // backslash treated as a slash by some browsers
  if (value.includes("\\")) return "/";
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f]/.test(value)) return "/"; // header/redirect-splitting characters

  // Never send a visitor back to the gate itself — avoids a page-level
  // redirect loop for an already-authorized visitor landing on /preview-access.
  if (value === "/preview-access" || value.startsWith("/preview-access/") || value.startsWith("/preview-access?")) {
    return "/";
  }

  return value;
}
