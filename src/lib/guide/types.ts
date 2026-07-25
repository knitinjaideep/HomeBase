import type { Owner } from "@/lib/models";

/**
 * The guide's *content* model. This is static, versioned TypeScript — not a CMS
 * and not database rows. Household progress is stored separately and keyed by
 * the stable ids below, so guide wording can be revised without losing state.
 */

/** Stable stage ids. Never rename one; add a new stage instead. */
export const STAGE_IDS = [
  "strategy",
  "finances",
  "attending",
  "mortgage-options",
  "lender-interviews",
  "preapproval",
  "agent-selection",
  "professional-team",
  "town-research",
  "active-search",
  "touring",
  "offer-prep",
  "negotiation",
  "attorney-review",
  "inspections",
  "financing",
  "closing-prep",
  "closing",
] as const;
export type StageId = (typeof STAGE_IDS)[number];

/** The readiness dimensions summarized on the Journey overview. */
export type ReadinessArea = "financial" | "mortgage" | "team" | "search" | "offer";

/**
 * How much a milestone moves the needle. Progress is weighted because signing
 * an attending contract is not the same size of step as reading an article.
 */
export type ActionWeight = 1 | 2 | 3 | 5 | 8;

/** A tool inside the app that supports a step. */
export interface RelatedTool {
  label: string;
  href: string;
  description?: string;
}

/** One concrete task within a stage. */
export interface GuideAction {
  /** Stable id, namespaced by stage — e.g. "finances.credit-reports". */
  id: string;
  title: string;
  /** Why this action matters, in one or two sentences. */
  why: string;
  /** What to collect or bring, when the action is a gathering task. */
  whatToGather?: string;
  /** What "done" looks like for this specific action. */
  completionCriteria?: string;
  defaultOwner: Owner;
  weight: ActionWeight;
  /** Optional YYYY-MM the action should ideally be finished by. */
  targetMonth?: string;
  /** Marks actions that only apply in some households. */
  conditional?: string;
}

/** A structured decision the household needs to record. */
export interface GuideDecision {
  /** Stable id, namespaced by stage. */
  id: string;
  prompt: string;
  help?: string;
  /** True when both spouses signing off is part of the completion criteria. */
  requiresBothSpouses?: boolean;
  /** Optional suggested answers, offered as chips rather than enforced. */
  suggestions?: string[];
}

/** A question to ask a specific professional. */
export interface GuideQuestion {
  /** Stable id so answers stay attached to the question. */
  id: string;
  question: string;
  /** Why we are asking — helps judge whether the answer was any good. */
  listenFor?: string;
}

/** A group of questions aimed at one kind of professional. */
export interface GuideQuestionSet {
  audience: "lender" | "agent" | "attorney" | "inspector" | "insurance" | "ourselves" | "other";
  title: string;
  intro?: string;
  questions: GuideQuestion[];
}

/** A document or piece of evidence to gather for this stage. */
export interface GuideDocumentItem {
  label: string;
  /** Maps to the document index's category so the item can be filed. */
  category: string;
  note?: string;
}

/** A stage-level completion criterion, optionally checked automatically. */
export interface CompletionCriterion {
  id: string;
  label: string;
  /**
   * When present, the criterion is evaluated from stored data rather than
   * ticked by hand. The key is resolved in `lib/journey/criteria.ts`.
   */
  autoCheck?: string;
}

/** A personalized "why it matters for us" line, shown only when its rule fires. */
export interface PersonalizationRule {
  id: string;
  /** Resolved against the household snapshot in `lib/guide/personalization.ts`. */
  when: string;
  text: string;
}

export interface GuideStage {
  id: StageId;
  number: number;
  title: string;
  /** Short label for nav, timelines, and chips. */
  shortTitle: string;
  /** The goal statement — "what this step accomplishes". */
  purpose: string;
  /** One or two sentences of general context. Never an essay. */
  explanation: string;
  /** Which readiness meters this stage feeds. */
  readinessAreas: ReadinessArea[];
  /** Roughly when this stage should be underway, as a YYYY-MM window. */
  suggestedWindow?: { start: string; end: string };
  /** True for stages that only become relevant once a property is in play. */
  propertySpecific?: boolean;

  personalization: PersonalizationRule[];
  actions: GuideAction[];
  decisions: GuideDecision[];
  questionSets: GuideQuestionSet[];
  documents: GuideDocumentItem[];
  /** Slugs into the resource library; matched against seeded resource titles. */
  resourceSlugs: string[];
  mistakes: string[];
  completionCriteria: CompletionCriterion[];
  relatedTools: RelatedTool[];
  /** Prominent warnings rendered above the actions. */
  warnings?: { tone: "caution" | "critical"; text: string }[];
  order: number;
  version: number;
}
