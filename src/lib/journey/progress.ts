import {
  GUIDE_STAGES,
  JOURNEY_STAGES,
  READINESS_AREAS,
  stagesForArea,
  type GuideActivity,
  type JourneyStage,
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

/**
 * Progress for one activity (a guide content unit — historically a "stage").
 * Activities never block one another: each is derived from its own tasks and
 * completion criteria.
 */
export interface ActivityProgress {
  activity: GuideActivity;
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

/** Derive an activity's status from its actions and criteria, unless overridden. */
function deriveStatus(
  criteriaComplete: boolean,
  actionsDone: number,
  anyActive: boolean,
): JourneyStatus {
  if (criteriaComplete) return "completed";
  if (anyActive || actionsDone > 0) {
    return "in-progress";
  }
  return "not-started";
}

export function activityProgress(stage: GuideActivity, s: JourneySnapshot): ActivityProgress {
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
  const derived = deriveStatus(criteriaComplete, actionsDone, anyActive);

  return {
    activity: stage,
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

/** A Stage's status. Derived from its activities; never stored. */
export type JourneyStageStatus = "not-started" | "in-progress" | "completed";

/**
 * Progress for one of the Journey's six Stages. Derived entirely from the
 * activities inside it, which may be in any state at once:
 *
 * - `fraction` is settled activities ÷ all activities (3 of 7 → 0.43).
 * - `not-started` when no activity has begun, `completed` when every activity
 *   is settled, `in-progress` otherwise.
 *
 * "Settled" means completed or not-applicable — the same rule tasks use.
 */
export interface JourneyStageProgress {
  stage: JourneyStage;
  activities: ActivityProgress[];
  status: JourneyStageStatus;
  /** 0–1: settled activities ÷ total activities. */
  fraction: number;
  activitiesDone: number;
  activitiesTotal: number;
  /** Activities that have begun but are not settled. */
  activitiesInProgress: number;
}

export function journeyStageProgress(stage: JourneyStage, activities: ActivityProgress[]): JourneyStageProgress {
  const inStage = stage.activityIds
    .map((id) => activities.find((ap) => ap.activity.id === id))
    .filter((ap): ap is ActivityProgress => Boolean(ap));
  const settled = (ap: ActivityProgress) => SETTLED_STATUSES.includes(ap.status);
  const activitiesDone = inStage.filter(settled).length;
  const activitiesInProgress = inStage.filter((ap) => !settled(ap) && ap.status !== "not-started").length;
  const total = inStage.length;

  const status: JourneyStageStatus =
    total > 0 && activitiesDone === total
      ? "completed"
      : activitiesDone > 0 || activitiesInProgress > 0
        ? "in-progress"
        : "not-started";

  return {
    stage,
    activities: inStage,
    status,
    fraction: total > 0 ? activitiesDone / total : 0,
    activitiesDone,
    activitiesTotal: total,
    activitiesInProgress,
  };
}

/**
 * A suggestion — never a requirement — for which activity in a Stage to open
 * next: one already underway if there is one (pick up where you left off),
 * otherwise the first one not yet started, in the Stage's listed order.
 * Undefined once every activity in the Stage is settled.
 */
export function recommendedActivity(sp: JourneyStageProgress): ActivityProgress | undefined {
  const open = sp.activities.filter((ap) => !SETTLED_STATUSES.includes(ap.status));
  return open.find((ap) => ap.status !== "not-started") ?? open[0];
}

/**
 * The next Stage after `selectedId` that is not yet complete, for an "Up next"
 * pointer. Purely a convenience — every Stage is always open to the household.
 */
export function upNextStage(stages: JourneyStageProgress[], selectedId: string): JourneyStageProgress | undefined {
  const index = stages.findIndex((sp) => sp.stage.id === selectedId);
  return stages.slice(index + 1).find((sp) => sp.status !== "completed");
}

export interface OverallProgress {
  /** Weighted 0–1 across every activity. */
  fraction: number;
  /** The six Stages, in Journey order, each derived from its activities. */
  stages: JourneyStageProgress[];
  /** Every activity's progress, in guide order. */
  activities: ActivityProgress[];
  completedStages: number;
  totalStages: number;
  /**
   * A hint for "where the household's attention is", used only to pick
   * recommendations — never to gate or hide anything. It is the earliest Stage
   * that is not completed and has an activity underway; if nothing is underway,
   * the earliest Stage that is not completed; undefined once every Stage is
   * complete.
   */
  focusStage: JourneyStage | undefined;
}

export function overallProgress(s: JourneySnapshot): OverallProgress {
  const activities = GUIDE_STAGES.map((activity) => activityProgress(activity, s));
  const stages = JOURNEY_STAGES.map((stage) => journeyStageProgress(stage, activities));
  const totalWeight = activities.reduce((sum, ap) => sum + ap.totalWeight, 0);
  const completedWeight = activities.reduce((sum, ap) => sum + ap.completedWeight, 0);
  const completedStages = stages.filter((sp) => sp.status === "completed").length;

  const open = stages.filter((sp) => sp.status !== "completed");
  const focus = open.find((sp) => sp.status === "in-progress") ?? open[0];

  return {
    fraction: totalWeight > 0 ? completedWeight / totalWeight : 0,
    stages,
    activities,
    completedStages,
    totalStages: stages.length,
    focusStage: focus?.stage,
  };
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
export function readinessByArea(progressByActivity: ActivityProgress[]): AreaReadiness[] {
  const byId = new Map(progressByActivity.map((ap) => [ap.activity.id, ap]));

  return READINESS_AREAS.map(({ id, label, description }) => {
    const stages = stagesForArea(id);
    const relevant = stages.map((st) => byId.get(st.id)).filter((x): x is ActivityProgress => Boolean(x));
    const totalWeight = relevant.reduce((sum, sp) => sum + sp.totalWeight, 0);
    const completedWeight = relevant.reduce((sum, sp) => sum + sp.completedWeight, 0);
    const fraction = totalWeight > 0 ? completedWeight / totalWeight : 0;

    const allComplete = relevant.length > 0 && relevant.every((sp) => sp.status === "completed");
    const anyStarted = relevant.some((sp) => sp.status !== "not-started");
    const status: JourneyStatus = allComplete ? "completed" : anyStarted ? "in-progress" : "not-started";

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
function describeArea(label: string, relevant: ActivityProgress[]): string {
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
