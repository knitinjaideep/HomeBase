import { describe, it, expect } from "vitest";
import { ALLOWED_RECOMMENDATION_REASONS, recommendedNext, type RecommendationReason } from "./recommendations";

describe("recommendedNext — buyer", () => {
  it("recommends the preapproval tracker when in the finance phase with no approval yet", () => {
    const result = recommendedNext({
      mode: "buying",
      buyer: { currentStagePhaseId: "finance", hasApprovals: false, shortlistedPropertyCount: 0 },
    });
    expect(result[0]).toEqual({
      label: "Preapproval tracker",
      href: "/lenders?tab=approvals",
      reason: "Recommended for your current stage",
    });
  });

  it("recommends the financial planner when in the finance phase with an approval already recorded", () => {
    const result = recommendedNext({
      mode: "buying",
      buyer: { currentStagePhaseId: "finance", hasApprovals: true, shortlistedPropertyCount: 0 },
    });
    expect(result[0]).toEqual({
      label: "Affordability & mortgage planner",
      href: "/finances",
      reason: "Recommended for your current stage",
    });
  });

  it("recommends Compare homes once 2+ properties are shortlisted", () => {
    const result = recommendedNext({
      mode: "buying",
      buyer: { currentStagePhaseId: "search", hasApprovals: false, shortlistedPropertyCount: 2 },
    });
    expect(result).toContainEqual({ label: "Compare homes", href: "/compare", reason: "Useful next" });
  });

  it("never fabricates a recommendation when nothing loaded yet — falls back to a safe default", () => {
    const result = recommendedNext({ mode: "buying" });
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].reason).toBe("Useful next");
  });

  it("combines the stage rule and the shortlist rule when both apply", () => {
    const result = recommendedNext({
      mode: "buying",
      buyer: { currentStagePhaseId: "finance", hasApprovals: false, shortlistedPropertyCount: 3 },
    });
    expect(result.map((r) => r.label)).toEqual(["Preapproval tracker", "Compare homes"]);
  });
});

describe("recommendedNext — owner", () => {
  it("recommends the maintenance schedule when something is due-soon or overdue", () => {
    const result = recommendedNext({
      mode: "owning",
      owner: { hasUrgentMaintenance: true, hasRepairProjects: false },
    });
    expect(result).toContainEqual({
      label: "Maintenance schedule",
      href: "/maintenance?tab=maintenance",
      reason: "Useful next",
    });
  });

  it("recommends the receipt/warranty organizer once a repair has been added", () => {
    const result = recommendedNext({
      mode: "owning",
      owner: { hasUrgentMaintenance: false, hasRepairProjects: true },
    });
    expect(result).toContainEqual({
      label: "Warranty tracker",
      href: "/documents?category=receipt",
      reason: "Useful next",
    });
  });

  it("falls back to a safe default with nothing urgent and no repairs yet", () => {
    const result = recommendedNext({
      mode: "owning",
      owner: { hasUrgentMaintenance: false, hasRepairProjects: false },
    });
    expect(result).toEqual([{ label: "Maintenance schedule", href: "/maintenance?tab=maintenance", reason: "Useful next" }]);
  });
});

describe("no fabricated usage metrics", () => {
  it("only ever uses the two allowed, honest reason labels", () => {
    expect(ALLOWED_RECOMMENDATION_REASONS).toEqual(["Recommended for your current stage", "Useful next"]);
  });

  it("every recommendation across every scenario uses an allowed reason", () => {
    const scenarios = [
      { mode: "buying" as const },
      { mode: "buying" as const, buyer: { currentStagePhaseId: "finance" as const, hasApprovals: true, shortlistedPropertyCount: 5 } },
      { mode: "owning" as const, owner: { hasUrgentMaintenance: true, hasRepairProjects: true } },
      { mode: "owning" as const },
    ];
    for (const scenario of scenarios) {
      for (const r of recommendedNext(scenario)) {
        expect(ALLOWED_RECOMMENDATION_REASONS).toContain(r.reason as RecommendationReason);
      }
    }
  });

  it("never uses a usage-derived label like 'Most used'", () => {
    const forbidden = ["most used", "trending", "popular", "recently opened"];
    for (const reason of ALLOWED_RECOMMENDATION_REASONS) {
      expect(forbidden).not.toContain(reason.toLowerCase());
    }
  });
});
