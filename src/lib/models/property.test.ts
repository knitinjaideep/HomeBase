import { describe, it, expect } from "vitest";
import { propertySchema, propertyFormSchema } from "./property";

const persistedBase = {
  id: "p1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  dateAdded: "2026-01-01",
  schools: {},
  ratings: {},
  finance: {},
};

describe("propertySchema (persisted domain object)", () => {
  it("rejects an empty address", () => {
    expect(() => propertySchema.parse({ ...persistedBase, address: "" })).toThrow();
  });

  it("rejects a whitespace-only address", () => {
    expect(() => propertySchema.parse({ ...persistedBase, address: "   " })).toThrow();
  });

  it("rejects a missing address", () => {
    expect(() => propertySchema.parse({ ...persistedBase })).toThrow();
  });

  it("accepts a real address and trims surrounding whitespace", () => {
    const parsed = propertySchema.parse({ ...persistedBase, address: "  10 Maple Ave  " });
    expect(parsed.address).toBe("10 Maple Ave");
  });
});

describe("propertyFormSchema (draft)", () => {
  it("accepts an empty draft and defaults the address to an empty string", () => {
    const draft = propertyFormSchema.parse({});
    expect(draft.address).toBe("");
  });

  it("does not require — or expose — persisted identity fields", () => {
    const keys = Object.keys(propertyFormSchema.shape);
    expect(keys).not.toContain("id");
    expect(keys).not.toContain("createdAt");
    expect(keys).not.toContain("updatedAt");
    expect(keys).not.toContain("dateAdded");
  });
});
