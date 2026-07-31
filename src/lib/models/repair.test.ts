import { describe, it, expect } from "vitest";
import { repairProjectSchema } from "./repair";

function base() {
  return { id: "r1", createdAt: "2026-07-28T00:00:00.000Z", updatedAt: "2026-07-28T00:00:00.000Z" };
}

describe("repairProjectSchema", () => {
  it("requires a non-empty title", () => {
    expect(() => repairProjectSchema.parse({ ...base() })).toThrow();
  });

  it("defaults to planned, medium priority, no dates or costs", () => {
    const project = repairProjectSchema.parse({ ...base(), title: "Repaint exterior trim" });
    expect(project.status).toBe("planned");
    expect(project.priority).toBe("medium");
    expect(project.startDate).toBeNull();
    expect(project.completionDate).toBeNull();
    expect(project.estimatedCost).toBeNull();
    expect(project.actualCost).toBeNull();
  });

  it("keeps provided dates and costs", () => {
    const project = repairProjectSchema.parse({
      ...base(),
      title: "Fix deck railing",
      status: "completed",
      startDate: "2026-05-01",
      completionDate: "2026-05-10",
      estimatedCost: 400,
      actualCost: 375,
    });
    expect(project.status).toBe("completed");
    expect(project.estimatedCost).toBe(400);
    expect(project.actualCost).toBe(375);
  });

  it("rejects an unrecognized status", () => {
    expect(() => repairProjectSchema.parse({ ...base(), title: "x", status: "done" })).toThrow();
  });
});
