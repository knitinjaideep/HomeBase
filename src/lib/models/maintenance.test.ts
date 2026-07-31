import { describe, it, expect } from "vitest";
import { maintenanceItemSchema } from "./maintenance";

function base() {
  return { id: "m1", createdAt: "2026-07-28T00:00:00.000Z", updatedAt: "2026-07-28T00:00:00.000Z" };
}

describe("maintenanceItemSchema", () => {
  it("requires a non-empty title", () => {
    expect(() => maintenanceItemSchema.parse({ ...base() })).toThrow();
    expect(() => maintenanceItemSchema.parse({ ...base(), title: "" })).toThrow();
  });

  it("defaults to an active, one-time, medium-priority item", () => {
    const item = maintenanceItemSchema.parse({ ...base(), title: "Replace HVAC filter" });
    expect(item.status).toBe("active");
    expect(item.priority).toBe("medium");
    expect(item.recurrenceMonths).toBeNull();
    expect(item.dueDate).toBeNull();
    expect(item.lastCompletedDate).toBeNull();
    expect(item.completionHistory).toEqual([]);
  });

  it("accepts a recurring item with a positive recurrenceMonths", () => {
    const item = maintenanceItemSchema.parse({ ...base(), title: "HVAC filter", recurrenceMonths: 3 });
    expect(item.recurrenceMonths).toBe(3);
  });

  it("rejects a non-positive recurrenceMonths", () => {
    expect(() =>
      maintenanceItemSchema.parse({ ...base(), title: "x", recurrenceMonths: 0 }),
    ).toThrow();
    expect(() =>
      maintenanceItemSchema.parse({ ...base(), title: "x", recurrenceMonths: -1 }),
    ).toThrow();
  });

  it("rejects an unrecognized status", () => {
    expect(() =>
      maintenanceItemSchema.parse({ ...base(), title: "x", status: "due" }),
    ).toThrow();
  });

  it("keeps a completion history entry with its fields", () => {
    const item = maintenanceItemSchema.parse({
      ...base(),
      title: "Water heater flush",
      completionHistory: [
        { id: "c1", completedDate: "2026-07-01", whatWasDone: "Flushed tank", cost: 0, performedBy: "Me", noteId: null },
      ],
    });
    expect(item.completionHistory).toHaveLength(1);
    expect(item.completionHistory[0].whatWasDone).toBe("Flushed tank");
    expect(item.completionHistory[0].noteId).toBeNull();
  });
});
