import type { ResolvedMode } from "@/lib/workspace/resolver";
import type { PhaseId } from "@/lib/guide/phases";

/**
 * The only two labels a recommendation is ever shown with. Deliberately not
 * "Most used this week" or any other usage-derived phrasing — this app
 * doesn't record feature-usage telemetry, so a label implying it would be
 * fabricated. See `recommendedNext`'s tests for the guard that keeps this
 * honest.
 */
export type RecommendationReason = "Recommended for your current stage" | "Useful next";
export const ALLOWED_RECOMMENDATION_REASONS: RecommendationReason[] = [
  "Recommended for your current stage",
  "Useful next",
];

export interface Recommendation {
  label: string;
  href: string;
  reason: RecommendationReason;
}

export interface BuyerRecommendationInput {
  /** The phase (see lib/guide/phases.ts) of `overallProgress().currentStage`. */
  currentStagePhaseId: PhaseId;
  /** Whether the household has recorded at least one mortgage approval. */
  hasApprovals: boolean;
  /** Properties with `status === "shortlisted"`. */
  shortlistedPropertyCount: number;
}

export interface OwnerRecommendationInput {
  /** Whether any maintenance item's urgency is "due-soon" or "overdue" (see lib/maintenance/schedule.ts). */
  hasUrgentMaintenance: boolean;
  hasRepairProjects: boolean;
}

export interface RecommendationInput {
  mode: ResolvedMode;
  buyer?: BuyerRecommendationInput;
  owner?: OwnerRecommendationInput;
}

const MAX_RECOMMENDATIONS = 2;

/**
 * Deterministic, explainable "Recommended next" — every rule reads only
 * data the caller already loaded elsewhere in the app (journey progress,
 * properties, maintenance items, repair projects). No rule ever returns
 * empty: each mode has a safe, honest fallback so the panel always has
 * something to show without inventing a reason for it.
 */
export function recommendedNext(input: RecommendationInput): Recommendation[] {
  const recommendations = input.mode === "owning" ? ownerRecommendations(input.owner) : buyerRecommendations(input.buyer);
  return recommendations.slice(0, MAX_RECOMMENDATIONS);
}

function buyerRecommendations(buyer: BuyerRecommendationInput | undefined): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (buyer?.currentStagePhaseId === "finance") {
    recommendations.push(
      buyer.hasApprovals
        ? { label: "Affordability & mortgage planner", href: "/finances", reason: "Recommended for your current stage" }
        : { label: "Preapproval tracker", href: "/lenders?tab=approvals", reason: "Recommended for your current stage" },
    );
  }

  if (buyer && buyer.shortlistedPropertyCount >= 2) {
    recommendations.push({ label: "Compare homes", href: "/compare", reason: "Useful next" });
  }

  if (recommendations.length === 0) {
    recommendations.push({ label: "Affordability & mortgage planner", href: "/finances", reason: "Useful next" });
  }

  return recommendations;
}

function ownerRecommendations(owner: OwnerRecommendationInput | undefined): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (owner?.hasUrgentMaintenance) {
    recommendations.push({ label: "Maintenance schedule", href: "/maintenance?tab=maintenance", reason: "Useful next" });
  }

  if (owner?.hasRepairProjects) {
    recommendations.push({ label: "Warranty tracker", href: "/documents?category=receipt", reason: "Useful next" });
  }

  if (recommendations.length === 0) {
    recommendations.push({ label: "Maintenance schedule", href: "/maintenance?tab=maintenance", reason: "Useful next" });
  }

  return recommendations;
}
