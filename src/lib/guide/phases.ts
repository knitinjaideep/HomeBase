import type { StageId } from "./types";

/**
 * The six phases shown on the Journey pipeline. Purely a grouping over the
 * eighteen stages in `guide/stages/*` — no new content or state. Grouping
 * stages this way lets the default view show "where are we" in five seconds
 * while every underlying stage, action, and decision stays exactly as
 * detailed as it already was.
 */
export type PhaseId = "prepare" | "finance" | "team" | "search" | "offer" | "close";

export interface JourneyPhase {
  id: PhaseId;
  number: number;
  title: string;
  /** One sentence: what this phase accomplishes. */
  goal: string;
  stageIds: StageId[];
}

export const JOURNEY_PHASES: JourneyPhase[] = [
  {
    id: "prepare",
    number: 1,
    title: "Prepare",
    goal: "Know what we want and what we can afford.",
    stageIds: ["strategy", "finances"],
  },
  {
    id: "finance",
    number: 2,
    title: "Finance",
    goal: "Be ready to finance the purchase.",
    stageIds: ["attending", "mortgage-options", "lender-interviews", "preapproval"],
  },
  {
    id: "team",
    number: 3,
    title: "Team",
    goal: "Choose the people who will help us buy.",
    stageIds: ["agent-selection", "professional-team"],
  },
  {
    id: "search",
    number: 4,
    title: "Search",
    goal: "Find the right home without losing financial discipline.",
    stageIds: ["town-research", "active-search", "touring"],
  },
  {
    id: "offer",
    number: 5,
    title: "Offer",
    goal: "Make a disciplined offer and fully investigate the property.",
    stageIds: ["offer-prep", "negotiation", "attorney-review", "inspections"],
  },
  {
    id: "close",
    number: 6,
    title: "Close",
    goal: "Finish financing and take ownership safely.",
    stageIds: ["financing", "closing-prep", "closing"],
  },
];

const PHASE_BY_STAGE = new Map<StageId, JourneyPhase>(
  JOURNEY_PHASES.flatMap((phase) => phase.stageIds.map((id) => [id, phase] as const)),
);

export function phaseForStage(stageId: StageId): JourneyPhase {
  return PHASE_BY_STAGE.get(stageId) ?? JOURNEY_PHASES[0];
}
