import type {
  AttendingTransition,
  Deal,
  DocumentRecord,
  FinancialProfile,
  HomePreferences,
  HouseholdProfile,
  JourneyActionState,
  JourneyDecision,
  JourneyStageState,
  LenderQuote,
  MortgageApproval,
  Professional,
  Property,
  PropertyVisit,
  Resource,
  TownResearch,
} from "@/lib/models";

/**
 * A single read-only bundle of everything the journey engines reason about.
 * Assembling it once keeps the personalization, criteria, readiness, and
 * next-action logic consistent — they all see the same picture.
 */
export interface JourneySnapshot {
  household: HouseholdProfile;
  financial: FinancialProfile;
  preferences: HomePreferences;
  properties: Property[];
  visits: PropertyVisit[];
  lenderQuotes: LenderQuote[];
  towns: TownResearch[];
  stageStates: JourneyStageState[];
  actions: JourneyActionState[];
  decisions: JourneyDecision[];
  attending: AttendingTransition | undefined;
  approvals: MortgageApproval[];
  professionals: Professional[];
  resources: Resource[];
  documents: DocumentRecord[];
  deals: Deal[];
  /** The date the plan is evaluated against (defaults to today). */
  today: Date;
}

/** Active (non-archived) properties. */
export function activeProperties(s: JourneySnapshot): Property[] {
  return s.properties.filter((p) => !p.isArchived);
}

export function shortlistedProperties(s: JourneySnapshot): Property[] {
  return activeProperties(s).filter((p) =>
    ["shortlisted", "possible-offer", "offer-submitted", "under-contract"].includes(p.status),
  );
}

/** A quick map of action id → status for O(1) lookups in the engines. */
export function actionStatusMap(s: JourneySnapshot): Map<string, JourneyActionState["status"]> {
  return new Map(s.actions.map((a) => [a.id, a.status]));
}

export function decisionMap(s: JourneySnapshot): Map<string, JourneyDecision> {
  return new Map(s.decisions.map((d) => [d.id, d]));
}

/** True when a guardrail field is a usable number. */
export function isSet(value: number | null | undefined): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}
