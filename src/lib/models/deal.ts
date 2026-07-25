import { z } from "zod";
import { baseEntitySchema, idSchema, moneySchema } from "./common";

/**
 * Everything that happens to *one specific property* from offer preparation
 * through post-closing (journey stages 12–18). Created lazily: a property only
 * gets a deal record once you start preparing an offer on it.
 */

// ---- Stage 12: offer preparation -----------------------------------------

export const offerReadinessSchema = z.object({
  schoolsVerified: z.boolean().default(false),
  taxesVerified: z.boolean().default(false),
  floodStatusReviewed: z.boolean().default(false),
  commuteTested: z.boolean().default(false),
  comparableSalesReviewed: z.boolean().default(false),
  monthlyPaymentCalculated: z.boolean().default(false),
  cashAtClosingCalculated: z.boolean().default(false),
  postClosingReserveCalculated: z.boolean().default(false),
  renovationEstimateEntered: z.boolean().default(false),
  insuranceAvailabilityConsidered: z.boolean().default(false),
  listingDisclosuresReviewed: z.boolean().default(false),
  buyer1Approves: z.boolean().default(false),
  buyer2Approves: z.boolean().default(false),
  contingenciesReviewed: z.boolean().default(false),
  attorneyIdentified: z.boolean().default(false),
  lenderConfirmedScenario: z.boolean().default(false),
  appraisalGapUnderstood: z.boolean().default(false),
  inspectionStrategyDocumented: z.boolean().default(false),
});
export type OfferReadiness = z.infer<typeof offerReadinessSchema>;

// ---- Stage 13: negotiation ------------------------------------------------

export const negotiationEntrySchema = z.object({
  id: idSchema,
  at: z.string(),
  /** Who moved: us, the seller, or a note to ourselves. */
  party: z.enum(["us", "seller", "note"]).default("note"),
  summary: z.string().default(""),
  amount: moneySchema.default(null),
  /** Why we accepted or rejected — the reasoning matters more than the number. */
  reasoning: z.string().default(""),
});
export type NegotiationEntry = z.infer<typeof negotiationEntrySchema>;

export const offerTermsSchema = z.object({
  initialOfferPrice: moneySchema.default(null),
  escalationTerms: z.string().default(""),
  earnestMoney: moneySchema.default(null),
  proposedClosingDate: z.string().nullable().default(null),
  financingContingency: z.string().default(""),
  appraisalTerms: z.string().default(""),
  inspectionTerms: z.string().default(""),
  sellerConcessions: z.string().default(""),
  includedItems: z.string().default(""),
  excludedItems: z.string().default(""),
  finalAcceptedTerms: z.string().default(""),
  submittedDate: z.string().nullable().default(null),
});
export type OfferTerms = z.infer<typeof offerTermsSchema>;

// ---- Stage 14: attorney review -------------------------------------------

export const attorneyReviewSchema = z.object({
  contractReceivedDate: z.string().nullable().default(null),
  attorneyRetained: z.boolean().default(false),
  attorneyProfessionalId: idSchema.nullable().default(null),
  reviewStartedDate: z.string().nullable().default(null),
  reviewDeadline: z.string().nullable().default(null),
  requestedChanges: z.string().default(""),
  agreedChanges: z.string().default(""),
  openIssues: z.string().default(""),
  attorneyApproved: z.boolean().default(false),
  attorneyApprovedDate: z.string().nullable().default(null),
  finalContractLocation: z.string().default(""),
});
export type AttorneyReview = z.infer<typeof attorneyReviewSchema>;

// ---- Stage 15: inspections & due diligence -------------------------------

export const inspectionTypeSchema = z.enum([
  "general",
  "structural",
  "roof",
  "foundation",
  "electrical",
  "plumbing",
  "hvac",
  "sewer-scope",
  "oil-tank-sweep",
  "radon",
  "mold-moisture",
  "pests",
  "chimney",
  "flood-risk",
  "water-quality",
  "septic",
  "well",
  "lead-paint",
  "permit-review",
  "insurance-review",
]);
export type InspectionType = z.infer<typeof inspectionTypeSchema>;

export const inspectionSeveritySchema = z.enum([
  "unknown",
  "none",
  "minor",
  "moderate",
  "major",
  "deal-breaker",
]);

export const inspectionResolutionSchema = z.enum([
  "open",
  "credit-agreed",
  "repair-agreed",
  "seller-declined",
  "accepted-risk",
  "walking-away",
  "not-applicable",
]);

export const inspectionRecordSchema = z.object({
  id: idSchema,
  type: inspectionTypeSchema.default("general"),
  ordered: z.boolean().default(false),
  inspectorName: z.string().default(""),
  inspectorProfessionalId: idSchema.nullable().default(null),
  date: z.string().nullable().default(null),
  cost: moneySchema.default(null),
  findings: z.string().default(""),
  severity: inspectionSeveritySchema.default("unknown"),
  estimatedRepairCost: moneySchema.default(null),
  specialistFollowUp: z.string().default(""),
  sellerResponse: z.string().default(""),
  creditRequested: moneySchema.default(null),
  repairRequested: z.string().default(""),
  resolution: inspectionResolutionSchema.default("open"),
  notes: z.string().default(""),
});
export type InspectionRecord = z.infer<typeof inspectionRecordSchema>;

// ---- Stage 16: finalize financing ----------------------------------------

export const financingTrackSchema = z.object({
  loanApplicationSubmitted: z.boolean().default(false),
  loanApplicationDate: z.string().nullable().default(null),
  loanEstimateReceived: z.boolean().default(false),
  competingLoanEstimates: z.string().default(""),
  selectedLender: z.string().default(""),
  selectedLenderProfessionalId: idSchema.nullable().default(null),
  rateLocked: z.boolean().default(false),
  rateLockExpires: z.string().nullable().default(null),
  lockedRatePct: z.number().nullable().default(null),
  appraisalOrdered: z.boolean().default(false),
  appraisalResult: moneySchema.default(null),
  appraisalNotes: z.string().default(""),
  underwritingSubmitted: z.boolean().default(false),
  conditionalApproval: z.boolean().default(false),
  outstandingConditions: z.string().default(""),
  homeownersInsuranceBound: z.boolean().default(false),
  clearToClose: z.boolean().default(false),
  closingDisclosureReceived: z.boolean().default(false),
  closingDisclosureDate: z.string().nullable().default(null),
  finalCashToClose: moneySchema.default(null),
  /** The anti-fraud step: confirmed by phone using an independently-found number. */
  wireInstructionsVerifiedByPhone: z.boolean().default(false),
  wireVerificationNote: z.string().default(""),
});
export type FinancingTrack = z.infer<typeof financingTrackSchema>;

// ---- Stage 17: closing preparation ---------------------------------------

export const closingPrepSchema = z.object({
  finalWalkthroughScheduled: z.boolean().default(false),
  finalWalkthroughDate: z.string().nullable().default(null),
  utilitiesArranged: z.boolean().default(false),
  movingArranged: z.boolean().default(false),
  closingFundsReady: z.boolean().default(false),
  closingDisclosureReviewed: z.boolean().default(false),
  identificationReady: z.boolean().default(false),
  fundsMethodConfirmed: z.boolean().default(false),
  insuranceActive: z.boolean().default(false),
  propertyConditionRechecked: z.boolean().default(false),
  agreedRepairsVerified: z.boolean().default(false),
  appliancesAndFixturesVerified: z.boolean().default(false),
  keysAndAccessConfirmed: z.boolean().default(false),
  notes: z.string().default(""),
});
export type ClosingPrep = z.infer<typeof closingPrepSchema>;

// ---- Stage 18: closing & post-closing ------------------------------------

export const postClosingSchema = z.object({
  closingCompleted: z.boolean().default(false),
  closingDate: z.string().nullable().default(null),
  finalDocumentsSaved: z.boolean().default(false),
  keysReceived: z.boolean().default(false),
  locksChanged: z.boolean().default(false),
  utilitiesConfirmed: z.boolean().default(false),
  emergencyShutoffsLocated: z.boolean().default(false),
  homeSystemsDocumented: z.boolean().default(false),
  warrantiesStored: z.boolean().default(false),
  maintenanceCalendarCreated: z.boolean().default(false),
  firstMortgagePaymentRecorded: z.boolean().default(false),
  addressChangesCompleted: z.boolean().default(false),
  postClosingReserveVerified: z.boolean().default(false),
  actualPostClosingReserve: moneySchema.default(null),
  thirtyDayRepairList: z.string().default(""),
  oneYearMaintenancePlan: z.string().default(""),
  notes: z.string().default(""),
});
export type PostClosing = z.infer<typeof postClosingSchema>;

// ---- The deal record ------------------------------------------------------

export const dealSchema = baseEntitySchema.extend({
  propertyId: idSchema,
  /**
   * The private number decided before negotiating starts. The app displays it
   * during offer preparation and never raises it on its own.
   */
  walkAwayPrice: moneySchema.default(null),
  walkAwayRecordedAt: z.string().nullable().default(null),
  walkAwayReasoning: z.string().default(""),

  readiness: offerReadinessSchema.default({}),
  offer: offerTermsSchema.default({}),
  negotiationLog: z.array(negotiationEntrySchema).default([]),
  attorneyReview: attorneyReviewSchema.default({}),
  inspections: z.array(inspectionRecordSchema).default([]),
  financing: financingTrackSchema.default({}),
  closingPrep: closingPrepSchema.default({}),
  postClosing: postClosingSchema.default({}),
});
export type Deal = z.infer<typeof dealSchema>;
