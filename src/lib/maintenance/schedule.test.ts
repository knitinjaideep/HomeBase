import { describe, it, expect } from "vitest";
import { addMonthsToISODate, computeNextDueDate, getMaintenanceUrgency } from "./schedule";

describe("addMonthsToISODate", () => {
  it("clamps a month-end date into a shorter following month (non-leap)", () => {
    expect(addMonthsToISODate("2027-01-31", 1)).toBe("2027-02-28");
  });

  it("clamps into February of a leap year", () => {
    expect(addMonthsToISODate("2028-01-31", 1)).toBe("2028-02-29");
  });

  it("clamps across a longer span (Aug 31 + 6 months)", () => {
    expect(addMonthsToISODate("2027-08-31", 6)).toBe("2028-02-29"); // 2028 is a leap year
    expect(addMonthsToISODate("2026-08-31", 6)).toBe("2027-02-28"); // 2027 is not
  });

  it("rolls over the year boundary", () => {
    expect(addMonthsToISODate("2026-12-15", 2)).toBe("2027-02-15");
  });

  it("does not clamp when the target month already has enough days", () => {
    expect(addMonthsToISODate("2026-12-31", 1)).toBe("2027-01-31");
  });

  it("handles a plain same-year, no-clamp case", () => {
    expect(addMonthsToISODate("2026-03-01", 3)).toBe("2026-06-01");
  });
});

describe("computeNextDueDate", () => {
  it("returns null for a one-time item (recurrenceMonths null)", () => {
    expect(computeNextDueDate("2026-07-01", null)).toBeNull();
  });

  it("computes the next occurrence for a recurring item", () => {
    expect(computeNextDueDate("2026-07-01", 3)).toBe("2026-10-01");
  });
});

describe("getMaintenanceUrgency", () => {
  const today = new Date("2026-07-15T12:00:00.000Z");

  it("is 'no-date' when there is no due date", () => {
    expect(getMaintenanceUrgency(null, today)).toBe("no-date");
  });

  it("is 'overdue' for a past due date", () => {
    expect(getMaintenanceUrgency("2026-07-01", today)).toBe("overdue");
  });

  it("is 'due-soon' for today and the next 14 days", () => {
    expect(getMaintenanceUrgency("2026-07-15", today)).toBe("due-soon");
    expect(getMaintenanceUrgency("2026-07-29", today)).toBe("due-soon");
  });

  it("is 'upcoming' beyond the due-soon window", () => {
    expect(getMaintenanceUrgency("2026-07-30", today)).toBe("upcoming");
  });
});
