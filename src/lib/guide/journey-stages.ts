import type { StageId } from "./types";

/**
 * The Journey's six broad Stages. The hierarchy is Journey → Stage → Activity:
 * a Stage is a phase of buying a home, and the Activities inside it can be
 * started, worked on, and finished in any order, side by side. Nothing here
 * gates one activity on another.
 *
 * Purely a grouping over the guide's content units (`guide/stages/*`, which
 * the code still calls `GuideStage` — see the note on `STAGE_IDS`). There is no
 * new persisted state: an activity's saved progress stays keyed by its
 * existing id, and a Stage's progress is always derived from its activities.
 *
 * Every activity id must appear in exactly one Stage (enforced by a test).
 */
export type JourneyStageId =
  | "get-ready"
  | "buying-power"
  | "team-search-plan"
  | "find-a-home"
  | "make-an-offer"
  | "close";

export interface JourneyStage {
  id: JourneyStageId;
  /** 1-based position of the Stage in the Journey. */
  order: number;
  title: string;
  /** One sentence: what this Stage accomplishes. */
  goal: string;
  /** Activity ids in display order. Order is presentation only, never a prerequisite. */
  activityIds: StageId[];
}

export const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: "get-ready",
    order: 1,
    title: "Get Ready",
    goal: "Know what we want, what we can afford, and what changes about our income.",
    activityIds: [
      "strategy",
      "finances",
      "attending",
      "town-research",
      "home-preferences",
      "school-priorities",
      "commute",
    ],
  },
  {
    id: "buying-power",
    order: 2,
    title: "Buying Power",
    goal: "Be ready to finance the purchase.",
    activityIds: ["mortgage-options", "lender-interviews", "preapproval"],
  },
  {
    id: "team-search-plan",
    order: 3,
    title: "Team & Search Plan",
    goal: "Choose the people who will help us buy.",
    activityIds: ["agent-selection", "professional-team"],
  },
  {
    id: "find-a-home",
    order: 4,
    title: "Find a Home",
    goal: "Find the right home without losing financial discipline.",
    activityIds: ["active-search", "touring"],
  },
  {
    id: "make-an-offer",
    order: 5,
    title: "Make an Offer",
    goal: "Make a disciplined offer and get it reviewed.",
    activityIds: ["offer-prep", "negotiation", "attorney-review"],
  },
  {
    id: "close",
    order: 6,
    title: "Close",
    goal: "Investigate the property, finish financing, and take ownership safely.",
    activityIds: ["inspections", "financing", "closing-prep", "closing"],
  },
];

const STAGE_BY_ID = new Map<string, JourneyStage>(JOURNEY_STAGES.map((st) => [st.id, st]));
const STAGE_BY_ACTIVITY = new Map<StageId, JourneyStage>(
  JOURNEY_STAGES.flatMap((st) => st.activityIds.map((id) => [id, st] as const)),
);

/** Look up a Stage by id (e.g. "get-ready"). Returns undefined for anything else. */
export function getJourneyStage(id: string | undefined): JourneyStage | undefined {
  return id ? STAGE_BY_ID.get(id) : undefined;
}

/** The Stage an activity belongs to. */
export function stageForActivity(activityId: StageId): JourneyStage {
  // Every activity is mapped (test-enforced); the fallback only guards a bad edit.
  return STAGE_BY_ACTIVITY.get(activityId) ?? JOURNEY_STAGES[0];
}
