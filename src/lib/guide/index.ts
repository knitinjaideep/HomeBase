import type { GuideAction, GuideStage, ReadinessArea, StageId } from "./types";
import { PLANNING_STAGES } from "./stages/planning";
import { TEAM_STAGES } from "./stages/team";
import { TRANSACTION_STAGES } from "./stages/transaction";

export * from "./types";
export * from "./phases";

/** Every stage, in journey order. This is the guide. */
export const GUIDE_STAGES: GuideStage[] = [
  ...PLANNING_STAGES,
  ...TEAM_STAGES,
  ...TRANSACTION_STAGES,
].sort((a, b) => a.order - b.order);

const STAGE_BY_ID = new Map<string, GuideStage>(GUIDE_STAGES.map((s) => [s.id, s]));

export function getStage(id: string | undefined): GuideStage | undefined {
  return id ? STAGE_BY_ID.get(id) : undefined;
}

/** Every action across the guide, flattened, with its stage attached. */
export interface FlatAction extends GuideAction {
  stageId: StageId;
}

export const ALL_ACTIONS: FlatAction[] = GUIDE_STAGES.flatMap((stage) =>
  stage.actions.map((action) => ({ ...action, stageId: stage.id })),
);

const ACTION_BY_ID = new Map<string, FlatAction>(ALL_ACTIONS.map((a) => [a.id, a]));

export function getAction(id: string): FlatAction | undefined {
  return ACTION_BY_ID.get(id);
}

/** Total achievable weight across every action — the denominator for progress. */
export const TOTAL_GUIDE_WEIGHT = ALL_ACTIONS.reduce((sum, a) => sum + a.weight, 0);

/** Readiness areas in the order they appear on the overview. */
export const READINESS_AREAS: { id: ReadinessArea; label: string; description: string }[] = [
  { id: "financial", label: "Financial", description: "Guardrails, house fund, reserves, childcare." },
  { id: "mortgage", label: "Mortgage", description: "Options, lenders, attending income, preapproval." },
  { id: "team", label: "Team", description: "Agent, attorney, inspectors, insurance." },
  { id: "search", label: "Search", description: "Towns, criteria, readiness to tour." },
  { id: "offer", label: "Offer", description: "Per-property due diligence through closing." },
];

/** Stages that feed a given readiness area. */
export function stagesForArea(area: ReadinessArea): GuideStage[] {
  return GUIDE_STAGES.filter((s) => s.readinessAreas.includes(area));
}

import type { GuideQuestionSet } from "./types";

/**
 * The interview question bank for a professional role, pulled from the guide so
 * the Professionals page and the guide never drift. Maps professional roles to
 * the guide's question-set audiences.
 */
export function interviewQuestionsForRole(role: string): GuideQuestionSet | undefined {
  const audience =
    role === "buyer-agent"
      ? "agent"
      : role === "attorney"
        ? "attorney"
        : role === "home-inspector" || role === "sewer-inspector" || role === "radon-inspector" || role === "oil-tank-sweep"
          ? "inspector"
          : role === "insurance-agent"
            ? "insurance"
            : undefined;
  if (!audience) return undefined;
  for (const stage of GUIDE_STAGES) {
    const set = stage.questionSets.find((q) => q.audience === audience);
    if (set) return set;
  }
  return undefined;
}
