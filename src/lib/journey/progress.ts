import {
  GUIDE_STAGES,
  JOURNEY_PHASES,
  READINESS_AREAS,
  stagesForArea,
  type GuideStage,
  type JourneyPhase,
  type ReadinessArea,
} from "@/lib/guide";
import { SETTLED_STATUSES, type JourneyStatus } from "@/lib/models";
import { evaluateCheck } from "./criteria";
import { actionStatusMap, type JourneySnapshot } from "./snapshot";

/**
 * Weighted progress and readiness. Progress is intentionally *not* a raw count
 * of completed tasks: each action carries a weight, so signing an attending
 * contract counts for far more than reading an article. Completion criteria are
 * evaluated deterministically from stored data.
 */

export interface StageProgress {
  stage: GuideStage;
  status: JourneyStatus;
  /** 0–1, weighted by action weight. */
  fraction: number;
  completedWeight: number;
  totalWeight: number;
  actionsDone: number;
  actionsTotal: number;
  criteriaMet: number;
  criteriaTotal: number;
  /** Human-readable labels of criteria not yet met. */
  missingCriteria: string[];
  /** True when every completion criterion is satisfied. */
  criteriaComplete: boolean;
}

/** Derive a stage's status from its actions and criteria, unless overridden. */
function deriveStatus(
  criteriaComplete: boolean,
  actionsDone: number,
  actionsTotal: number,
  anyActive: boolean,
): JourneyStatus {
  if (criteriaComplete) return "completed";
  if (anyActive || actionsDone > 0) {
    return actionsDone >= actionsTotal ? "ready" : "in-progress";
  }
  return "not-started";
}

export function stageProgress(stage: GuideStage, s: JourneySnapshot): StageProgress {
  const status = actionStatusMap(s);
  let completedWeight = 0;
  let actionsDone = 0;
  let anyActive = false;
  const totalWeight = stage.actions.reduce((sum, a) => sum + a.weight, 0);

  for (const action of stage.actions) {
    const st = status.get(action.id) ?? "not-started";
    if (SETTLED_STATUSES.includes(st as never)) {
      completedWeight += action.weight;
      actionsDone += 1;
    } else if (st !== "not-started") {
      anyActive = true;
      // Partial credit for work in flight keeps the meter honest and encouraging.
      completedWeight += action.weight * 0.4;
    }
  }

  const missingCriteria: string[] = [];
  let criteriaMet = 0;
  for (const c of stage.completionCriteria) {
    const met = c.autoCheck ? evaluateCheck(c.autoCheck, s) : false;
    if (met) criteriaMet += 1;
    else missingCriteria.push(c.label);
  }
  const criteriaTotal = stage.completionCriteria.length;
  const criteriaComplete = criteriaTotal > 0 && criteriaMet === criteriaTotal;

  const override = s.stageStates.find((x) => x.id === stage.id)?.statusOverride ?? null;
  const derived = deriveStatus(criteriaComplete, actionsDone, stage.actions.length, anyActive);

  return {
    stage,
    status: override ?? derived,
    fraction: totalWeight > 0 ? Math.min(1, completedWeight / totalWeight) : 0,
    completedWeight,
    totalWeight,
    actionsDone,
    actionsTotal: stage.actions.length,
    criteriaMet,
    criteriaTotal,
    missingCriteria,
    criteriaComplete,
  };
}

export interface OverallProgress {
  /** Weighted 0–1 across every stage the household has reached. */
  fraction: number;
  /** The current stage: the earliest not-yet-complete stage. */
  currentStage: GuideStage;
  /** Stage-by-stage detail, in order. */
  stages: StageProgress[];
  completedStages: number;
  totalStages: number;
}

export function overallProgress(s: JourneySnapshot): OverallProgress {
  const stages = GUIDE_STAGES.map((stage) => stageProgress(stage, s));
  const totalWeight = stages.reduce((sum, sp) => sum + sp.totalWeight, 0);
  const completedWeight = stages.reduce((sum, sp) => sum + sp.completedWeight, 0);
  const completedStages = stages.filter((sp) => sp.status === "completed").length;

  // The current stage is the first non-property-specific stage that is not yet
  // complete — or, once an offer is live, the earliest incomplete deal stage.
  const firstIncomplete =
    stages.find((sp) => sp.status !== "completed" && sp.status !== "not-applicable") ?? stages[0];

  return {
    fraction: totalWeight > 0 ? completedWeight / totalWeight : 0,
    currentStage: firstIncomplete.stage,
    stages,
    completedStages,
    totalStages: stages.length,
  };
}

/** A phase's status on the pipeline. "blocked" only fires for the current phase. */
export type PhaseStatus = "completed" | "current" | "blocked" | "upcoming";

export interface PhaseProgress {
  phase: JourneyPhase;
  status: PhaseStatus;
  /** 0–1, weighted by the phase's own stages. */
  fraction: number;
  stages: StageProgress[];
}

/**
 * Group stage progress into the six pipeline phases. Exactly one phase is
 * "current" — the one containing the overall current stage — unless every
 * phase is complete.
 */
export function phaseProgress(progress: OverallProgress): PhaseProgress[] {
  const byId = new Map(progress.stages.map((sp) => [sp.stage.id, sp]));
  let currentSeen = false;

  return JOURNEY_PHASES.map((phase) => {
    const stages = phase.stageIds
      .map((id) => byId.get(id))
      .filter((sp): sp is StageProgress => Boolean(sp));
    const totalWeight = stages.reduce((sum, sp) => sum + sp.totalWeight, 0);
    const completedWeight = stages.reduce((sum, sp) => sum + sp.completedWeight, 0);
    const fraction = totalWeight > 0 ? Math.min(1, completedWeight / totalWeight) : 0;
    const allComplete =
      stages.length > 0 && stages.every((sp) => SETTLED_STATUSES.includes(sp.status as never));
    const isCurrentPhase = !allComplete && !currentSeen && stages.some((sp) => sp.stage.id === progress.currentStage.id);
    if (isCurrentPhase) currentSeen = true;
    const blocked = isCurrentPhase && stages.some((sp) => sp.status === "blocked");

    const status: PhaseStatus = allComplete
      ? "completed"
      : blocked
        ? "blocked"
        : isCurrentPhase
          ? "current"
          : currentSeen
            ? "upcoming"
            : "completed";

    return { phase, status, fraction, stages };
  });
}

export interface AreaReadiness {
  area: ReadinessArea;
  label: string;
  description: string;
  fraction: number;
  status: JourneyStatus;
  /** A short, descriptive summary rather than a bare percentage. */
  summary: string;
}

/** Readiness per area, described in words (never a bare "87% ready"). */
export function readinessByArea(progressByStage: StageProgress[]): AreaReadiness[] {
  const byId = new Map(progressByStage.map((sp) => [sp.stage.id, sp]));

  return READINESS_AREAS.map(({ id, label, description }) => {
    const stages = stagesForArea(id);
    const relevant = stages.map((st) => byId.get(st.id)).filter((x): x is StageProgress => Boolean(x));
    const totalWeight = relevant.reduce((sum, sp) => sum + sp.totalWeight, 0);
    const completedWeight = relevant.reduce((sum, sp) => sum + sp.completedWeight, 0);
    const fraction = totalWeight > 0 ? completedWeight / totalWeight : 0;

    const allComplete = relevant.length > 0 && relevant.every((sp) => sp.status === "completed");
    const anyStarted = relevant.some((sp) => sp.status !== "not-started");
    const status: JourneyStatus = allComplete
      ? "completed"
      : fraction >= 0.66
        ? "ready"
        : anyStarted
          ? "in-progress"
          : "not-started";

    return {
      area: id,
      label,
      description,
      fraction,
      status,
      summary: describeArea(label, relevant),
    };
  });
}

/**
 * Build a descriptive readiness sentence such as
 * "Financial strategy established; childcare estimate still missing."
 */
function describeArea(label: string, relevant: StageProgress[]): string {
  const done = relevant.filter((sp) => sp.status === "completed");
  const missing = relevant.flatMap((sp) => sp.missingCriteria);

  if (relevant.length === 0) return `${label}: not yet applicable.`;
  if (done.length === relevant.length) return `${label}: complete.`;

  const gap = missing[0];
  if (done.length === 0 && !gap) return `${label}: not started.`;
  if (done.length === 0 && gap) return `${label}: getting started — ${lower(gap)} still needed.`;
  if (gap) return `${label}: underway; ${lower(gap)} still needed.`;
  return `${label}: underway.`;
}

function lower(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}
