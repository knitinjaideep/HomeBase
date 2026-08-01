/**
 * Purely a function of `expirationDate` vs. "today" — never persisted,
 * mirroring `getMaintenanceUrgency` in lib/maintenance/schedule.ts and for
 * the same reason: this codebase has no background job that could keep a
 * stored status in sync, so it's computed at render time only.
 */

export type DocumentExpiryStatus = "expired" | "expiring-soon" | "ok" | "no-date";

const EXPIRING_SOON_WINDOW_DAYS = 60;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getDocumentExpiryStatus(
  expirationDate: string | null,
  today: Date = new Date(),
): DocumentExpiryStatus {
  if (!expirationDate) return "no-date";
  const todayStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const [y, m, d] = expirationDate.slice(0, 10).split("-").map(Number);
  const expires = Date.UTC(y, m - 1, d);
  const diffDays = Math.round((expires - todayStart) / MS_PER_DAY);
  if (diffDays < 0) return "expired";
  if (diffDays <= EXPIRING_SOON_WINDOW_DAYS) return "expiring-soon";
  return "ok";
}
