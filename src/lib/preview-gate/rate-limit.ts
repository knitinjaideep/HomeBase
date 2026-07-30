/**
 * A minimal in-memory, fixed-window limiter for the preview key-validation
 * action. Deliberately not a distributed store (no Redis/Upstash dependency
 * for a temporary, personal-app gate) — state is per server instance, so a
 * multi-instance deployment gets a looser effective limit than the numbers
 * below suggest. Acceptable for this app's traffic; see README for the
 * documented limitation.
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS_PER_WINDOW = 8;

const attempts = new Map<string, { count: number; windowStart: number }>();

export function checkRateLimit(identifier: string, now: number = Date.now()): { allowed: boolean } {
  const entry = attempts.get(identifier);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    attempts.set(identifier, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= MAX_ATTEMPTS_PER_WINDOW) {
    return { allowed: false };
  }

  entry.count += 1;
  return { allowed: true };
}

export function resetRateLimit(identifier: string): void {
  attempts.delete(identifier);
}

/**
 * IP address when available (the common case behind Vercel's proxy),
 * otherwise a coarse User-Agent + Accept-Language signal — not invasive
 * fingerprinting, just enough to bucket anonymous repeat attempts.
 */
export function getClientIdentifier(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  const firstForwarded = forwardedFor?.split(",")[0]?.trim();
  if (firstForwarded) return `ip:${firstForwarded}`;

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return `ip:${realIp}`;

  const userAgent = headers.get("user-agent") ?? "unknown-ua";
  const language = headers.get("accept-language") ?? "unknown-lang";
  return `ua:${userAgent}|${language}`;
}
