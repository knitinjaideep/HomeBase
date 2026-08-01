import { describe, it, expect } from "vitest";
import { MAINTENANCE_STARTER_TEMPLATES, templatesForPropertyType } from "./starter-templates";

describe("templatesForPropertyType", () => {
  it("returns the full list for a single-family home", () => {
    expect(templatesForPropertyType("single-family")).toHaveLength(MAINTENANCE_STARTER_TEMPLATES.length);
  });

  it("returns the full list when the property type is unknown (null/undefined)", () => {
    expect(templatesForPropertyType(null)).toHaveLength(MAINTENANCE_STARTER_TEMPLATES.length);
    expect(templatesForPropertyType(undefined)).toHaveLength(MAINTENANCE_STARTER_TEMPLATES.length);
  });

  it("excludes HOA-handled items (gutters, exterior inspection) for condo/townhouse", () => {
    const templates = templatesForPropertyType("condo-townhouse");
    expect(templates.some((t) => t.id === "gutters")).toBe(false);
    expect(templates.some((t) => t.id === "exterior-inspection")).toBe(false);
    expect(templates.every((t) => t.appliesToCondo)).toBe(true);
    expect(templates.length).toBeLessThan(MAINTENANCE_STARTER_TEMPLATES.length);
  });
});
