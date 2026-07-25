import type { StageId } from "@/lib/guide";
import { evaluateCheck, primaryDeal, searchReadinessMissing } from "./criteria";
import { isSet, type JourneySnapshot } from "./snapshot";

/**
 * The personalized next-action engine. Deterministic and rules-based — there is
 * no AI here. Each rule explains *why it appeared*, *which stored information
 * triggered it*, and *what action would clear it*, so nothing is an opaque score.
 */

export type RecommendationLevel = "critical" | "warning" | "suggestion";

export interface Recommendation {
  id: string;
  level: RecommendationLevel;
  title: string;
  /** Why this recommendation appeared. */
  why: string;
  /** Which stored information triggered it. */
  trigger: string;
  /** What action would clear it. */
  clearedBy: string;
  /** Where to go to act on it. */
  href: string;
  stageId?: StageId;
}

interface Rule {
  id: string;
  /** Fires when this returns true. */
  when: (s: JourneySnapshot) => boolean;
  build: (s: JourneySnapshot) => Omit<Recommendation, "id">;
}

const RULES: Rule[] = [
  // ---- Critical financial safety ----------------------------------------
  {
    id: "offer-exceeds-walk-away",
    when: (s) => {
      const d = primaryDeal(s);
      if (!d) return false;
      const walk = d.deal.walkAwayPrice;
      const proposed = d.property.offerPrice ?? d.deal.offer.initialOfferPrice;
      return isSet(walk) && isSet(proposed) && proposed > walk;
    },
    build: (s) => {
      const d = primaryDeal(s)!;
      return {
        level: "critical",
        title: "A possible offer exceeds the walk-away price",
        why: "The offer we are contemplating is above the number we agreed we would not pass.",
        trigger: `${d.property.address}: proposed price is above the recorded walk-away price.`,
        clearedBy: "Lower the offer, or deliberately revisit the walk-away price together and record why.",
        href: "/properties",
        stageId: "offer-prep",
      };
    },
  },
  {
    id: "reserve-below-minimum",
    when: (s) => {
      const d = primaryDeal(s);
      const reserve = d?.deal.postClosing.actualPostClosingReserve;
      return Boolean(d) && isSet(reserve) && isSet(s.financial.minReserve) && reserve! < s.financial.minReserve!;
    },
    build: () => ({
      level: "critical",
      title: "Post-closing reserve is below our minimum",
      why: "After this purchase the cash cushion would drop under the floor we set.",
      trigger: "Recorded post-closing reserve is below the minimum reserve in Settings.",
      clearedBy: "Increase available funds, reduce the purchase, or reconsider the deal.",
      href: "/finances",
      stageId: "offer-prep",
    }),
  },
  {
    id: "offer-on-attending-unconfirmed",
    when: (s) => {
      const hasLiveDeal = Boolean(primaryDeal(s));
      const usingAttending = isSet(s.attending?.expectedBaseSalary ?? null);
      const confirmed = evaluateCheck("attendingTreatmentConfirmed", s);
      return hasLiveDeal && usingAttending && !confirmed;
    },
    build: () => ({
      level: "critical",
      title: "No lender has confirmed how attending income will be treated",
      why: "There is a live deal that may lean on attending income, but no lender has confirmed the treatment in writing.",
      trigger: "A deal is in progress and the attending income treatment is not confirmed in writing.",
      clearedBy: "Get written confirmation from a lender before relying on that income.",
      href: "/journey/attending",
      stageId: "attending",
    }),
  },
  {
    id: "under-contract-team-gaps",
    when: (s) => {
      const d = primaryDeal(s);
      if (!d || d.property.status !== "under-contract") return false;
      const hasAttorney = d.deal.attorneyReview.attorneyRetained || evaluateCheck("attorneySelected", s);
      const hasLender = s.approvals.length > 0 || evaluateCheck("dealRateLocked", s);
      const hasInspector = evaluateCheck("inspectorSelected", s);
      return !hasAttorney || !hasLender || !hasInspector;
    },
    build: (s) => {
      const missing: string[] = [];
      if (!evaluateCheck("attorneySelected", s)) missing.push("attorney");
      if (s.approvals.length === 0) missing.push("lender");
      if (!evaluateCheck("inspectorSelected", s)) missing.push("inspector");
      return {
        level: "critical",
        title: "Under contract with team members still missing",
        why: "A property is under contract, but a key member of the team is not in place.",
        trigger: `Missing: ${missing.join(", ")}.`,
        clearedBy: "Select the missing professionals immediately — the deadlines are short.",
        href: "/professionals",
        stageId: "professional-team",
      };
    },
  },
  {
    id: "closing-wire-insurance",
    when: (s) => {
      const d = primaryDeal(s);
      if (!d) return false;
      const closingSoon = d.deal.financing.clearToClose || d.deal.closingPrep.finalWalkthroughScheduled;
      const wireMissing = !d.deal.financing.wireInstructionsVerifiedByPhone;
      const insuranceMissing = !d.deal.closingPrep.insuranceActive;
      return closingSoon && (wireMissing || insuranceMissing);
    },
    build: (s) => {
      const d = primaryDeal(s)!;
      const parts: string[] = [];
      if (!d.deal.financing.wireInstructionsVerifiedByPhone) parts.push("wire instructions are not verified by phone");
      if (!d.deal.closingPrep.insuranceActive) parts.push("homeowners insurance is not active");
      return {
        level: "critical",
        title: "Closing is near and safety items are incomplete",
        why: "Closing is approaching but the anti-fraud and insurance steps are not done.",
        trigger: parts.join("; ") + ".",
        clearedBy: "Verify wire instructions by phone on an independently-found number, and bind insurance.",
        href: "/properties",
        stageId: "financing",
      };
    },
  },

  // ---- Warnings ----------------------------------------------------------
  {
    id: "attending-contract-timing",
    when: (s) => evaluateCheck("attendingContractLate", s),
    build: () => ({
      level: "warning",
      title: "Attending contract timing is becoming a risk",
      why: "We are within a few months of the target purchase and no signed attending contract is recorded.",
      trigger: "No signed contract recorded, and the target purchase window is close.",
      clearedBy: "Record the signed contract, or decide the fallback financing plan.",
      href: "/journey/attending",
      stageId: "attending",
    }),
  },
  {
    id: "touring-without-preapproval",
    when: (s) => evaluateCheck("touringWithoutPreapproval", s),
    build: () => ({
      level: "warning",
      title: "Touring without a preapproval",
      why: "We are viewing homes but no preapproval is on file. The right house could appear before we can act.",
      trigger: "Properties are in a touring status and there are no recorded approvals.",
      clearedBy: "Start a preapproval with at least one lender.",
      href: "/lenders?tab=approvals",
      stageId: "preapproval",
    }),
  },
  {
    id: "shortlist-unverified",
    when: (s) => evaluateCheck("shortlistExists", s) && !evaluateCheck("shortlistVerified", s),
    build: () => ({
      level: "warning",
      title: "Shortlisted homes are missing verified facts",
      why: "A property cannot be fairly compared until its taxes, schools, and commute are verified.",
      trigger: "A shortlisted property is missing verified taxes, school assignment, or commute.",
      clearedBy: "Verify property taxes, school assignment, and the commute on each shortlisted home.",
      href: "/properties",
      stageId: "touring",
    }),
  },
  {
    id: "agent-agreement-missing",
    when: (s) => evaluateCheck("agentSelectedWithoutAgreement", s),
    build: () => ({
      level: "warning",
      title: "Buyer-agreement terms are not recorded",
      why: "An agent is selected but the representation agreement's terms have not been reviewed.",
      trigger: "The selected buyer's agent has no reviewed buyer-agreement terms.",
      clearedBy: "Review and record the agreement's scope, duration, compensation, and termination.",
      href: "/professionals?role=buyer-agent",
      stageId: "agent-selection",
    }),
  },
  {
    id: "primary-town-unvisited",
    when: (s) => evaluateCheck("primaryTownUnvisited", s),
    build: () => ({
      level: "warning",
      title: "A Primary town has not been visited",
      why: "A town is marked Primary without a recorded research visit — the guide asks for a visit first.",
      trigger: "A town's designation is Primary but no visit is recorded.",
      clearedBy: "Visit the town on a weekday and a weekend, then record both impressions.",
      href: "/journey/town-research",
      stageId: "town-research",
    }),
  },
  {
    id: "preapproval-expiring",
    when: (s) => evaluateCheck("preapprovalExpiringSoon", s),
    build: () => ({
      level: "warning",
      title: "A preapproval is expiring soon",
      why: "A preapproval on file expires within 60 days and could lapse mid-search.",
      trigger: "A recorded preapproval's expiration date is within 60 days.",
      clearedBy: "Ask the lender what refreshing it requires, and update the record.",
      href: "/lenders?tab=approvals",
      stageId: "preapproval",
    }),
  },

  // ---- Suggestions -------------------------------------------------------
  {
    id: "attending-salary-unknown",
    when: (s) => evaluateCheck("attendingSalaryMissing", s),
    build: () => ({
      level: "suggestion",
      title: "Record an estimated attending salary range",
      why: "Without a figure, every monthly-payment estimate quietly assumes resident income.",
      trigger: "No expected attending salary is recorded.",
      clearedBy: "Enter a range in the attending tracker and mark it uncertain.",
      href: "/journey/attending",
      stageId: "attending",
    }),
  },
  {
    id: "childcare-missing",
    when: (s) => evaluateCheck("childcareMissing", s),
    build: () => ({
      level: "suggestion",
      title: "Add a childcare estimate",
      why: "Financial readiness stays incomplete while childcare — often the largest line after the mortgage — is blank.",
      trigger: "No childcare figure is recorded in the financial profile.",
      clearedBy: "Enter a monthly childcare assumption in Settings.",
      href: "/settings",
      stageId: "finances",
    }),
  },
  {
    id: "house-fund-unidentified",
    when: (s) => !evaluateCheck("houseFundIdentified", s),
    build: () => ({
      level: "suggestion",
      title: "Identify the house fund",
      why: "The offer strategy depends on knowing exactly how much cash is available.",
      trigger: "No designated down-payment cash is recorded.",
      clearedBy: "Define which savings and investments will fund the purchase.",
      href: "/settings",
      stageId: "finances",
    }),
  },
  {
    id: "few-lenders",
    when: (s) => evaluateCheck("fewLenders", s),
    build: () => ({
      level: "suggestion",
      title: "Add more lender candidates",
      why: "Policies on attending income and reserves vary more between lenders than rates do.",
      trigger: "Fewer than four lenders are recorded.",
      clearedBy: "Add lender candidates until there are at least four to interview.",
      href: "/lenders",
      stageId: "lender-interviews",
    }),
  },
  {
    id: "no-agent-interviews",
    when: (s) => evaluateCheck("noAgentsInterviewed", s),
    build: () => ({
      level: "suggestion",
      title: "Start interviewing buyer's agents",
      why: "Choosing an agent well takes several interviews, and it is easier before a listing forces the decision.",
      trigger: "No buyer's-agent interviews are recorded.",
      clearedBy: "Add agent candidates and record their interviews.",
      href: "/professionals?role=buyer-agent",
      stageId: "agent-selection",
    }),
  },
  {
    id: "search-readiness-gaps",
    when: (s) => {
      const touring = s.properties.some(
        (p) => !p.isArchived && ["tour-scheduled", "visited", "interested", "shortlisted"].includes(p.status),
      );
      return !touring && searchReadinessMissing(s).length > 0 && searchReadinessMissing(s).length <= 9;
    },
    build: (s) => ({
      level: "suggestion",
      title: "Finish getting ready to search",
      why: "A few readiness items remain before touring in earnest.",
      trigger: `Still open: ${searchReadinessMissing(s).slice(0, 3).join(", ")}${
        searchReadinessMissing(s).length > 3 ? "…" : ""
      }.`,
      clearedBy: "Complete the readiness items on the Active search stage.",
      href: "/journey/active-search",
      stageId: "active-search",
    }),
  },
];

/**
 * Evaluate every rule and return the recommendations that fire, most urgent
 * first. Property-specific critical rules always outrank general suggestions.
 */
export function nextActions(s: JourneySnapshot): Recommendation[] {
  const order: Record<RecommendationLevel, number> = { critical: 0, warning: 1, suggestion: 2 };
  const fired: Recommendation[] = [];
  for (const rule of RULES) {
    let matches = false;
    try {
      matches = rule.when(s);
    } catch {
      matches = false;
    }
    if (matches) fired.push({ id: rule.id, ...rule.build(s) });
  }
  return fired.sort((a, b) => order[a.level] - order[b.level]);
}

/** The top N recommendations for the overview's "next actions" panel. */
export function topRecommendations(s: JourneySnapshot, n = 3): Recommendation[] {
  return nextActions(s).slice(0, n);
}
