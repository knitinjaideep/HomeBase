import { describe, it, expect } from "vitest";
import {
  buyerModeProfileSchema,
  homeWorkspaceSchema,
  ownerModeProfileSchema,
  workspaceModeSchema,
} from "./workspace";

describe("workspaceModeSchema", () => {
  it("accepts the two supported modes", () => {
    expect(workspaceModeSchema.parse("buying")).toBe("buying");
    expect(workspaceModeSchema.parse("owning")).toBe("owning");
  });

  it("rejects any other value", () => {
    expect(() => workspaceModeSchema.parse("renting")).toThrow();
    expect(() => workspaceModeSchema.parse("BUYING")).toThrow();
    expect(() => workspaceModeSchema.parse("")).toThrow();
  });
});

describe("homeWorkspaceSchema", () => {
  const base = {
    id: "hh1",
    name: "Our Household",
    createdAt: "2026-07-28T00:00:00.000Z",
    updatedAt: "2026-07-28T00:00:00.000Z",
  };

  it("parses a workspace with a null activeMode (unselected / existing user)", () => {
    const parsed = homeWorkspaceSchema.parse({ ...base, activeMode: null });
    expect(parsed.activeMode).toBeNull();
  });

  it("parses a workspace with a selected mode", () => {
    expect(homeWorkspaceSchema.parse({ ...base, activeMode: "buying" }).activeMode).toBe("buying");
    expect(homeWorkspaceSchema.parse({ ...base, activeMode: "owning" }).activeMode).toBe("owning");
  });

  it("rejects an invalid activeMode", () => {
    expect(() => homeWorkspaceSchema.parse({ ...base, activeMode: "leasing" })).toThrow();
  });

  it("strips columns not modelled on the workspace view (e.g. localMigrationCompletedAt)", () => {
    const parsed = homeWorkspaceSchema.parse({
      ...base,
      activeMode: null,
      localMigrationCompletedAt: "2026-07-01T00:00:00.000Z",
    });
    expect(parsed).not.toHaveProperty("localMigrationCompletedAt");
  });
});

describe("buyerModeProfileSchema", () => {
  const base = { id: "b1", createdAt: "2026-07-28T00:00:00.000Z", updatedAt: "2026-07-28T00:00:00.000Z" };

  it("applies sensible defaults when only base fields are provided", () => {
    const parsed = buyerModeProfileSchema.parse(base);
    expect(parsed.experience).toBe("first-time");
    expect(parsed.arrangement).toBe("solo");
    expect(parsed.targetPurchaseDate).toBeNull();
    expect(parsed.participantNames).toEqual([]);
    expect(parsed.onboardingCompletedAt).toBeNull();
  });

  it("parses a fully specified profile", () => {
    const parsed = buyerModeProfileSchema.parse({
      ...base,
      experience: "repeat",
      arrangement: "partner",
      targetPurchaseDate: "2027-05",
      participantNames: ["Alex", "Sam"],
      onboardingCompletedAt: "2026-07-28T12:00:00.000Z",
    });
    expect(parsed.arrangement).toBe("partner");
    expect(parsed.participantNames).toEqual(["Alex", "Sam"]);
  });

  it("rejects invalid enum values", () => {
    expect(() => buyerModeProfileSchema.parse({ ...base, experience: "sometimes" })).toThrow();
    expect(() => buyerModeProfileSchema.parse({ ...base, arrangement: "committee" })).toThrow();
  });
});

describe("ownerModeProfileSchema", () => {
  const base = { id: "o1", createdAt: "2026-07-28T00:00:00.000Z", updatedAt: "2026-07-28T00:00:00.000Z" };

  it("applies sensible defaults when only base fields are provided", () => {
    const parsed = ownerModeProfileSchema.parse(base);
    expect(parsed.propertyType).toBe("single-family");
    expect(parsed.ownershipStage).toBe("new-owner");
    expect(parsed.moveInDate).toBeNull();
    expect(parsed.onboardingCompletedAt).toBeNull();
  });

  it("parses a fully specified profile", () => {
    const parsed = ownerModeProfileSchema.parse({
      ...base,
      propertyType: "condo-townhouse",
      ownershipStage: "established-owner",
      moveInDate: "2024-09-01",
      onboardingCompletedAt: "2026-07-28T12:00:00.000Z",
    });
    expect(parsed.propertyType).toBe("condo-townhouse");
    expect(parsed.ownershipStage).toBe("established-owner");
  });

  it("rejects invalid enum values", () => {
    expect(() => ownerModeProfileSchema.parse({ ...base, propertyType: "castle" })).toThrow();
    expect(() => ownerModeProfileSchema.parse({ ...base, ownershipStage: "landlord" })).toThrow();
  });
});
