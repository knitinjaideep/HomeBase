/**
 * Deterministic recurrence date math — no AI, no date libraries (there are
 * none in package.json). "Every N months" is computed with plain calendar
 * arithmetic, clamping to the last day of the target month so e.g. Jan 31 +
 * 1 month lands on Feb 28/29 rather than overflowing into March the way a
 * naive `date.setMonth(date.getMonth() + n)` would.
 */

/** `iso` is read as a date-only string ("YYYY-MM-DD..."); any time/zone suffix is ignored. */
export function addMonthsToISODate(iso: string, months: number): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const targetYear = Math.floor(total / 12);
  const targetMonthIdx = ((total % 12) + 12) % 12; // 0-11, defensive against negative `months`
  const lastDayOfTargetMonth = new Date(Date.UTC(targetYear, targetMonthIdx + 1, 0)).getUTCDate();
  const day = Math.min(d, lastDayOfTargetMonth);
  return `${targetYear}-${String(targetMonthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** `recurrenceMonths: null` means one-time — no next occurrence. */
export function computeNextDueDate(completedDateIso: string, recurrenceMonths: number | null): string | null {
  return recurrenceMonths == null ? null : addMonthsToISODate(completedDateIso, recurrenceMonths);
}

export type MaintenanceUrgency = "overdue" | "due-soon" | "upcoming" | "no-date";

const DUE_SOON_WINDOW_DAYS = 14;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Purely a function of `dueDate` vs. "today" — never persisted (see
 * lib/models/maintenance.ts's comment on why status stays user-driven).
 * Computed at render time only, so it's always accurate with no background
 * job keeping it in sync.
 */
export function getMaintenanceUrgency(dueDate: string | null, today: Date = new Date()): MaintenanceUrgency {
  if (!dueDate) return "no-date";
  const todayStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const [y, m, d] = dueDate.slice(0, 10).split("-").map(Number);
  const due = Date.UTC(y, m - 1, d);
  const diffDays = Math.round((due - todayStart) / MS_PER_DAY);
  if (diffDays < 0) return "overdue";
  if (diffDays <= DUE_SOON_WINDOW_DAYS) return "due-soon";
  return "upcoming";
}
