import type { Deal, Professional, Property } from "@/lib/models";
import { SETTLED_STATUSES } from "@/lib/models";
import {
  actionStatusMap,
  activeProperties,
  decisionMap,
  isSet,
  shortlistedProperties,
  type JourneySnapshot,
} from "./snapshot";

/**
 * Deterministic evaluation of every `autoCheck` key referenced by the guide's
 * completion criteria and personalization rules. No AI, no scoring — each
 * predicate is a plain, inspectable rule over stored data.
 *
 * A `PredicateContext` gives each rule the snapshot plus a couple of memoized
 * helpers so rules stay short and read like sentences.
 */
interface PredicateContext {
  s: JourneySnapshot;
  status: Map<string, string>;
  decisions: ReturnType<typeof decisionMap>;
  /** Whether a specific action has reached a settled (completed/N-A) status. */
  actionDone: (id: string) => boolean;
  /** Whether a guided decision has an answer and, if required, both approvals. */
  decisionMade: (id: string, requireBoth?: boolean) => boolean;
  selectedOfRole: (role: Professional["role"]) => Professional | undefined;
  anyOfRole: (role: Professional["role"]) => boolean;
}

function buildContext(s: JourneySnapshot): PredicateContext {
  const status = new Map(actionStatusMap(s));
  const decisions = decisionMap(s);
  const actionDone = (id: string) => SETTLED_STATUSES.includes((status.get(id) ?? "not-started") as never);
  const decisionMade = (id: string, requireBoth = false) => {
    const d = decisions.get(id);
    if (!d || d.answer.trim() === "") return false;
    return requireBoth ? d.buyer1Approved && d.buyer2Approved : true;
  };
  const selectedOfRole = (role: Professional["role"]) =>
    s.professionals.find((p) => p.role === role && p.selectionStatus === "selected");
  const anyOfRole = (role: Professional["role"]) => s.professionals.some((p) => p.role === role);
  return { s, status, decisions, actionDone, decisionMade, selectedOfRole, anyOfRole };
}

// ---- Reusable sub-checks ---------------------------------------------------

function guardrailsComplete(s: JourneySnapshot): boolean {
  const f = s.financial;
  return (
    isSet(f.priceComfortableMin) &&
    isSet(f.priceComfortableMax) &&
    isSet(f.priceRoutineCeiling) &&
    isSet(f.priceAbsoluteCeiling) &&
    isSet(f.paymentComfortable) &&
    isSet(f.paymentMaxTarget) &&
    isSet(f.minReserve) &&
    isSet(f.preferredReserve)
  );
}

function primaryTowns(s: JourneySnapshot) {
  return s.towns.filter((t) => t.designation === "primary");
}

function formalApprovals(s: JourneySnapshot) {
  return s.approvals.filter((a) => a.kind === "preapproval" || a.kind === "fully-underwritten");
}

function attendingTreatmentConfirmed(s: JourneySnapshot): boolean {
  if (s.attending?.lenderIncomeTreatment === "confirmed-in-writing") return true;
  return s.approvals.some((a) => a.attendingContractReviewed && a.kind !== "readiness-conversation");
}

/** The deal we treat as "the live one" — under contract, else the furthest along. */
export function primaryDeal(s: JourneySnapshot): { deal: Deal; property: Property } | undefined {
  const byProperty = new Map(s.properties.map((p) => [p.id, p]));
  const withProps = s.deals
    .map((deal) => ({ deal, property: byProperty.get(deal.propertyId) }))
    .filter((x): x is { deal: Deal; property: Property } => Boolean(x.property));
  if (withProps.length === 0) return undefined;
  const underContract = withProps.find((x) => x.property.status === "under-contract");
  if (underContract) return underContract;
  const submitted = withProps.find((x) => x.property.status === "offer-submitted");
  if (submitted) return submitted;
  return withProps.sort((a, b) => b.deal.updatedAt.localeCompare(a.deal.updatedAt))[0];
}

function countTrue(obj: Record<string, unknown>, keys: string[]): number {
  return keys.filter((k) => obj[k] === true).length;
}

// ---- The predicate table ---------------------------------------------------

type Predicate = (ctx: PredicateContext) => boolean;

const PREDICATES: Record<string, Predicate> = {
  // Stage 1 — strategy
  guardrailsComplete: ({ s }) => guardrailsComplete(s),
  guardrailsIncomplete: ({ s }) => !guardrailsComplete(s),
  bothApprovedStrategyDecisions: ({ decisionMade }) =>
    decisionMade("strategy.why-biggest-compromise", true) ||
    decisionMade("strategy.biggest-compromise", true),
  dealbreakersDocumented: ({ s }) => s.preferences.dealbreakerNotes.trim().length > 0,
  townStrategyDocumented: ({ s }) =>
    primaryTowns(s).length >= 1 &&
    s.towns.some((t) => t.designation === "backup" || t.designation === "considering"),
  criteriaApproved: ({ s, decisionMade }) =>
    s.preferences.requiredNotes.trim().length > 0 &&
    s.preferences.dealbreakerNotes.trim().length > 0 &&
    s.preferences.renovationDecided &&
    (decisionMade("strategy.biggest-compromise", true) || true),

  // Stage 2 — finances
  childcareRecorded: ({ s }) => isSet(s.financial.childcareMonthly),
  childcareMissing: ({ s }) => !isSet(s.financial.childcareMonthly),
  houseFundIdentified: ({ s }) => isSet(s.financial.designatedDownPaymentCash) && (s.financial.designatedDownPaymentCash ?? 0) > 0,
  reservesSet: ({ s }) => isSet(s.financial.minReserve) && isSet(s.financial.preferredReserve),
  creditScoresRecorded: ({ s }) =>
    isSet(s.household.buyer1CreditScore) && isSet(s.household.buyer2CreditScore),
  hasTaxableInvestments: ({ s }) => (s.financial.taxableInvestments ?? 0) > 0,
  coreDocumentsGathered: ({ s }) => {
    const needed = ["taxes", "income", "bank-statements", "identification"];
    return needed.every((cat) =>
      s.documents.some((d) => d.category === cat && (d.status === "gathered" || d.status === "submitted")),
    );
  },

  // Stage 3 — attending
  attendingSalaryMissing: ({ s }) => !isSet(s.attending?.expectedBaseSalary ?? null),
  attendingSalaryRecorded: ({ s }) => isSet(s.attending?.expectedBaseSalary ?? null),
  attendingStartRecorded: ({ s }) => Boolean(s.attending?.expectedStartDate),
  attendingContractMissing: ({ s }) => !s.attending?.contractSigned,
  attendingContractSigned: ({ s }) => Boolean(s.attending?.contractSigned),
  attendingContractLate: ({ s }) => {
    // Risk fires when we are within ~4 months of the target start and no contract.
    if (s.attending?.contractSigned) return false;
    const target = s.household.idealPurchaseStart; // YYYY-MM
    if (!target) return false;
    const [y, m] = target.split("-").map(Number);
    if (!y || !m) return false;
    const targetDate = new Date(y, m - 1, 1);
    const flagFrom = new Date(targetDate);
    flagFrom.setMonth(flagFrom.getMonth() - 4);
    return s.today >= flagFrom;
  },
  attendingTreatmentConfirmed: ({ s }) => attendingTreatmentConfirmed(s),
  attendingTreatmentUnconfirmed: ({ s }) => !attendingTreatmentConfirmed(s),
  creditScoreGap: ({ s }) =>
    isSet(s.household.buyer1CreditScore) &&
    isSet(s.household.buyer2CreditScore) &&
    Math.abs((s.household.buyer1CreditScore ?? 0) - (s.household.buyer2CreditScore ?? 0)) >= 20,

  // Stage 4 — mortgage options
  loanStructuresChosen: ({ decisionMade }) => decisionMade("mortgage-options.structures-to-quote"),
  twoScenariosSaved: ({ s }) => s.lenderQuotes.length >= 0 && countScenarios(s) >= 2,
  rateTypeDecided: ({ decisionMade }) => decisionMade("mortgage-options.rate-type-decision"),
  priceRangeLikelyJumbo: ({ s }) => (s.financial.priceComfortableMax ?? 0) >= 900_000,

  // Stage 5 — lender interviews
  fourLendersRecorded: ({ s }) => distinctLenderCount(s) >= 4,
  fewLenders: ({ s }) => distinctLenderCount(s) < 4,
  lenderInterviewsCaptured: ({ s }) =>
    s.professionals.filter((p) => p.role === "lender" && Object.keys(p.interviewAnswers).length > 0)
      .length >= 2 || s.lenderQuotes.length >= 2,
  lenderFinalistsChosen: ({ decisionMade }) => decisionMade("lender-interviews.finalists", true),

  // Stage 6 — preapproval
  formalPreapprovalRecorded: ({ s }) => formalApprovals(s).length >= 1,
  noPreapproval: ({ s }) => formalApprovals(s).length === 0,
  preapprovalInProgress: ({ s }) => s.approvals.length >= 1,
  preapprovalReviewsComplete: ({ s }) =>
    formalApprovals(s).some(
      (a) => a.creditReviewed && a.incomeReviewed && a.assetsReviewed && a.debtsReviewed,
    ),
  preapprovalTermsRecorded: ({ s }) =>
    formalApprovals(s).some((a) => isSet(a.maxLoanAmount) && isSet(a.estimatedRatePct)),
  preapprovalExpiryRecorded: ({ s }) => formalApprovals(s).some((a) => Boolean(a.expiresDate)),
  preapprovalExpiringSoon: ({ s }) =>
    formalApprovals(s).some((a) => {
      if (!a.expiresDate) return false;
      const exp = new Date(a.expiresDate);
      const soon = new Date(s.today);
      soon.setDate(soon.getDate() + 60);
      return exp <= soon && exp >= s.today;
    }),

  // Stage 7 — agent selection
  threeAgentCandidates: ({ s }) => s.professionals.filter((p) => p.role === "buyer-agent").length >= 3,
  threeAgentsInterviewed: ({ s }) =>
    s.professionals.filter((p) => p.role === "buyer-agent" && p.interviewDate).length >= 3,
  agentVerified: ({ selectedOfRole }) => {
    const a = selectedOfRole("buyer-agent");
    return Boolean(a && a.agentVerification.njLicenseNumber && a.agentVerification.recentTransactionsInTargetTowns);
  },
  buyerAgreementReviewed: ({ selectedOfRole }) =>
    Boolean(selectedOfRole("buyer-agent")?.agentVerification.buyerAgreementReviewed),
  agentDecisionRecorded: ({ decisionMade }) => decisionMade("agent-selection.choice", true),
  agentSelected: ({ selectedOfRole }) => Boolean(selectedOfRole("buyer-agent")),
  noAgentsInterviewed: ({ s }) =>
    s.professionals.filter((p) => p.role === "buyer-agent" && p.interviewDate).length === 0,
  agentSelectedWithoutAgreement: ({ selectedOfRole }) => {
    const a = selectedOfRole("buyer-agent");
    return Boolean(a && !a.agentVerification.buyerAgreementReviewed);
  },
  hasPrimaryTowns: ({ s }) => primaryTowns(s).length > 0,

  // Stage 8 — professional team
  attorneySelected: ({ selectedOfRole }) => Boolean(selectedOfRole("attorney")),
  inspectorSelected: ({ selectedOfRole }) => Boolean(selectedOfRole("home-inspector")),
  specialistsIdentified: ({ anyOfRole }) =>
    anyOfRole("sewer-inspector") && anyOfRole("oil-tank-sweep") && anyOfRole("radon-inspector"),
  insuranceIdentified: ({ anyOfRole }) => anyOfRole("insurance-agent"),
  teamGapsExist: ({ selectedOfRole, anyOfRole }) =>
    !selectedOfRole("attorney") ||
    !selectedOfRole("home-inspector") ||
    !anyOfRole("insurance-agent"),

  // Stage 9 — town research
  twoPrimaryTowns: ({ s }) => primaryTowns(s).length >= 2,
  primaryTownsVisited: ({ s }) => {
    const primary = primaryTowns(s);
    return primary.length >= 1 && primary.every((t) => t.visited);
  },
  primaryTownUnvisited: ({ s }) => primaryTowns(s).some((t) => !t.visited),
  primaryTownsCommuteRecorded: ({ s }) => {
    const primary = primaryTowns(s);
    return primary.length >= 1 && primary.every((t) => isSet(t.doorToDoorCommuteMinutes));
  },
  backupTownIdentified: ({ s }) => s.towns.some((t) => t.designation === "backup"),

  // Stage 10 — active search
  searchReadinessComplete: (ctx) => searchReadinessMissing(ctx).length === 0,
  searchReadinessIncomplete: (ctx) => searchReadinessMissing(ctx).length > 0,

  // Stage 11 — touring
  allVisitsDocumented: ({ s }) => {
    const visitedProps = activeProperties(s).filter((p) =>
      ["visited", "interested", "shortlisted", "possible-offer", "offer-submitted", "under-contract"].includes(
        p.status,
      ),
    );
    if (visitedProps.length === 0) return false;
    return visitedProps.every((p) => {
      const v = s.visits.filter((visit) => visit.propertyId === p.id);
      return v.length > 0 && v.some((visit) => visit.stillWantAfterExcitement.trim().length > 0);
    });
  },
  visitsPendingNotes: ({ s }) => {
    const visitedProps = activeProperties(s).filter((p) => p.status === "visited" || p.status === "interested");
    return visitedProps.some((p) => {
      const v = s.visits.filter((visit) => visit.propertyId === p.id);
      return v.length === 0 || v.every((visit) => visit.stillWantAfterExcitement.trim().length === 0);
    });
  },
  shortlistExists: ({ s }) => shortlistedProperties(s).length >= 1,
  shortlistVerified: ({ s }) => shortlistVerified(s),
  touringWithoutPreapproval: ({ s }) => {
    const touring = activeProperties(s).some((p) =>
      ["tour-scheduled", "visited", "interested", "shortlisted"].includes(p.status),
    );
    return touring && s.approvals.length === 0;
  },

  // Stages 12–18 — the live deal
  dealDueDiligenceVerified: (ctx) => dealReadiness(ctx, [
    "schoolsVerified", "taxesVerified", "floodStatusReviewed", "commuteTested",
  ]),
  dealNumbersCalculated: (ctx) => dealReadiness(ctx, [
    "monthlyPaymentCalculated", "cashAtClosingCalculated", "postClosingReserveCalculated",
  ]),
  dealWalkAwaySet: ({ s }) => {
    const d = primaryDeal(s);
    return Boolean(d && isSet(d.deal.walkAwayPrice));
  },
  dealBothApprove: ({ s }) => {
    const d = primaryDeal(s);
    return Boolean(d && d.deal.readiness.buyer1Approves && d.deal.readiness.buyer2Approves);
  },
  dealFinalTermsRecorded: ({ s }) => {
    const d = primaryDeal(s);
    return Boolean(d && d.deal.offer.finalAcceptedTerms.trim().length > 0);
  },
  dealNegotiationLogged: ({ s }) => {
    const d = primaryDeal(s);
    return Boolean(d && d.deal.negotiationLog.length >= 1);
  },
  dealPriceWithinWalkAway: ({ s }) => {
    const d = primaryDeal(s);
    if (!d) return false;
    const walk = d.deal.walkAwayPrice;
    const accepted = d.property.offerPrice ?? d.deal.offer.initialOfferPrice;
    if (!isSet(walk) || !isSet(accepted)) return false;
    return accepted <= walk;
  },
  dealNoAttorney: ({ s }) => {
    const d = primaryDeal(s);
    return Boolean(d && !d.deal.attorneyReview.attorneyRetained);
  },
  dealAttorneyRetained: ({ s }) => Boolean(primaryDeal(s)?.deal.attorneyReview.attorneyRetained),
  dealAttorneyApproved: ({ s }) => Boolean(primaryDeal(s)?.deal.attorneyReview.attorneyApproved),
  dealFinalContractStored: ({ s }) =>
    Boolean(primaryDeal(s)?.deal.attorneyReview.finalContractLocation.trim()),
  dealCoreInspectionsDone: ({ s }) => {
    const d = primaryDeal(s);
    if (!d) return false;
    const done = (type: string) =>
      d.deal.inspections.some((i) => i.type === type && (i.date !== null || i.findings.trim().length > 0));
    return done("general") && done("sewer-scope") && done("oil-tank-sweep");
  },
  dealFindingsRecorded: ({ s }) => {
    const d = primaryDeal(s);
    return Boolean(d && d.deal.inspections.some((i) => i.findings.trim().length > 0));
  },
  dealFindingsResolved: ({ s }) => {
    const d = primaryDeal(s);
    if (!d) return false;
    const withFindings = d.deal.inspections.filter((i) => i.severity !== "unknown" && i.severity !== "none");
    return withFindings.length > 0 && withFindings.every((i) => i.resolution !== "open");
  },
  dealRateLocked: ({ s }) => Boolean(primaryDeal(s)?.deal.financing.rateLocked),
  dealClearToClose: ({ s }) => Boolean(primaryDeal(s)?.deal.financing.clearToClose),
  dealClosingDisclosureReviewed: ({ s }) =>
    Boolean(primaryDeal(s)?.deal.financing.closingDisclosureReceived),
  dealWireVerified: ({ s }) =>
    Boolean(primaryDeal(s)?.deal.financing.wireInstructionsVerifiedByPhone),
  dealWalkthroughScheduled: ({ s }) => Boolean(primaryDeal(s)?.deal.closingPrep.finalWalkthroughScheduled),
  dealFundsReady: ({ s }) => {
    const d = primaryDeal(s);
    return Boolean(d && d.deal.closingPrep.closingFundsReady && d.deal.closingPrep.fundsMethodConfirmed);
  },
  dealInsuranceActive: ({ s }) => Boolean(primaryDeal(s)?.deal.closingPrep.insuranceActive),
  dealClosed: ({ s }) => Boolean(primaryDeal(s)?.deal.postClosing.closingCompleted),
  dealReserveVerified: ({ s }) => Boolean(primaryDeal(s)?.deal.postClosing.postClosingReserveVerified),
  dealHomeSetup: ({ s }) => {
    const d = primaryDeal(s);
    if (!d) return false;
    const pc = d.deal.postClosing;
    return pc.locksChanged && pc.emergencyShutoffsLocated && pc.maintenanceCalendarCreated;
  },

  always: () => true,
};

// ---- helpers used by several predicates -----------------------------------

/** Distinct lenders across quotes, approvals, and professional records. */
function distinctLenderCount(s: JourneySnapshot): number {
  const names = new Set<string>();
  s.lenderQuotes.forEach((q) => names.add(q.lender.trim().toLowerCase()));
  s.approvals.forEach((a) => names.add(a.lender.trim().toLowerCase()));
  s.professionals.filter((p) => p.role === "lender").forEach((p) => names.add(p.name.trim().toLowerCase()));
  names.delete("");
  return names.size;
}

/** Saved planner scenarios live in Dexie's `scenarios`; the snapshot omits them,
 * so we approximate "worked the numbers" with recorded lender quotes plus a
 * completed action. This keeps the snapshot lean without losing the signal. */
function countScenarios(s: JourneySnapshot): number {
  const done = s.actions.filter(
    (a) => a.id === "mortgage-options.down-payment-scenarios" && SETTLED_STATUSES.includes(a.status),
  ).length;
  return done > 0 ? 2 : s.lenderQuotes.length;
}

function shortlistVerified(s: JourneySnapshot): boolean {
  const list = shortlistedProperties(s);
  if (list.length === 0) return false;
  return list.every(
    (p) => Boolean(p.schools.verifiedDate) && isSet(p.annualPropertyTaxes) && isSet(p.doorToDoorCommuteMinutes),
  );
}

function dealReadiness(ctx: PredicateContext, keys: string[]): boolean {
  const d = primaryDeal(ctx.s);
  if (!d) return false;
  return countTrue(d.deal.readiness as unknown as Record<string, unknown>, keys) === keys.length;
}

/**
 * The stage-10 readiness list — reused by the overview's search meter and by
 * the next-action engine. Returns the labels of what is still missing.
 */
export function searchReadinessMissing(ctxOrSnapshot: PredicateContext | JourneySnapshot): string[] {
  const ctx = "s" in ctxOrSnapshot ? ctxOrSnapshot : buildContext(ctxOrSnapshot);
  const missing: string[] = [];
  if (!guardrailsComplete(ctx.s)) missing.push("Financial guardrails");
  if (!((ctx.s.financial.designatedDownPaymentCash ?? 0) > 0)) missing.push("House fund identified");
  if (ctx.s.approvals.length === 0) missing.push("Preapproval started");
  if (!ctx.selectedOfRole("buyer-agent")) missing.push("Buyer's agent selected");
  if (primaryTowns(ctx.s).length < 1) missing.push("Primary towns");
  if (!ctx.s.towns.some((t) => t.designation === "backup")) missing.push("Backup towns");
  if (ctx.s.preferences.requiredNotes.trim() === "") missing.push("Must-haves approved");
  if (ctx.s.preferences.dealbreakerNotes.trim() === "") missing.push("Deal-breakers approved");
  if (!ctx.s.preferences.renovationDecided) missing.push("Renovation tolerance approved");
  return missing;
}

// ---- Public API -----------------------------------------------------------

/** Evaluate a single autoCheck key against the snapshot. Unknown keys → false. */
export function evaluateCheck(key: string, s: JourneySnapshot): boolean {
  const predicate = PREDICATES[key];
  if (!predicate) return false;
  try {
    return predicate(buildContext(s));
  } catch {
    return false;
  }
}

/** Evaluate a personalization `when` clause. Unknown clauses never fire. */
export function evaluateCondition(clause: string, s: JourneySnapshot): boolean {
  if (clause === "always") return true;
  return evaluateCheck(clause, s);
}
