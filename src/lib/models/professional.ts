import { z } from "zod";
import { baseEntitySchema, idSchema, ratingSchema } from "./common";

/** The kinds of professionals a New Jersey purchase typically involves. */
export const professionalRoleSchema = z.enum([
  "buyer-agent",
  "attorney",
  "lender",
  "home-inspector",
  "sewer-inspector",
  "oil-tank-sweep",
  "radon-inspector",
  "structural-engineer",
  "insurance-agent",
  "contractor",
  "surveyor",
  "title-company",
  "other",
]);
export type ProfessionalRole = z.infer<typeof professionalRoleSchema>;

/** Where a candidate came from — a genuine referral is worth recording. */
export const referralSourceSchema = z.enum([
  "unknown",
  "personal-referral",
  "professional-referral",
  "open-house",
  "brokerage-directory",
  "realtor-directory",
  "sold-listing-research",
  "online-search",
  "other",
]);
export type ReferralSource = z.infer<typeof referralSourceSchema>;

export const selectionStatusSchema = z.enum([
  "candidate",
  "interviewed",
  "selected",
  "not-selected",
  "no-longer-considering",
]);
export type SelectionStatus = z.infer<typeof selectionStatusSchema>;

/**
 * Agent-specific verification. Kept as its own object because Stage 7 asks for
 * concrete, checkable facts rather than an impression of a person.
 */
export const agentVerificationSchema = z.object({
  njLicenseNumber: z.string().default(""),
  njLicenseVerifiedDate: z.string().nullable().default(null),
  brokerage: z.string().default(""),
  primaryServiceArea: z.string().default(""),
  yearsExperience: z.number().nullable().default(null),
  isFullTime: z.boolean().nullable().default(null),
  buyerSideExperience: z.string().default(""),
  buyersRepresentedLast12Months: z.number().nullable().default(null),
  recentTransactionsInTargetTowns: z.string().default(""),
  physicianMortgageExperience: z.string().default(""),
  competitiveOfferExperience: z.string().default(""),
  olderNjHomeExperience: z.string().default(""),
  trainCommuteFamiliarity: z.string().default(""),
  attorneyReviewFamiliarity: z.string().default(""),
  localInspectionFamiliarity: z.string().default(""),
  referencesContacted: z.string().default(""),
  communicationStyle: z.string().default(""),
  availability: z.string().default(""),
  coverageWhenUnavailable: z.string().default(""),
  conflictsOfInterest: z.string().default(""),
  compensationStructure: z.string().default(""),
  buyerAgreementTerms: z.string().default(""),
  buyerAgreementReviewed: z.boolean().default(false),
  buyerAgreementDurationNote: z.string().default(""),
  buyerAgreementTerminationNote: z.string().default(""),
});
export type AgentVerification = z.infer<typeof agentVerificationSchema>;

/**
 * The agent scorecard. Every dimension is an explicit 1–5 rating you assign;
 * the app shows the average but never picks the winner for you.
 */
export const agentScorecardSchema = z.object({
  targetTownExpertise: ratingSchema.default(null),
  buyerAdvocacy: ratingSchema.default(null),
  financialDiscipline: ratingSchema.default(null),
  communication: ratingSchema.default(null),
  responsiveness: ratingSchema.default(null),
  negotiationApproach: ratingSchema.default(null),
  localProfessionalNetwork: ratingSchema.default(null),
  understandsOurPriorities: ratingSchema.default(null),
  comfortDiscussingCompensation: ratingSchema.default(null),
  contractTransparency: ratingSchema.default(null),
  personalityFit: ratingSchema.default(null),
  overallConfidence: ratingSchema.default(null),
});
export type AgentScorecard = z.infer<typeof agentScorecardSchema>;

export const professionalSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  company: z.string().default(""),
  role: professionalRoleSchema.default("other"),
  phone: z.string().default(""),
  email: z.string().default(""),
  website: z.string().default(""),

  referralSource: referralSourceSchema.default("unknown"),
  referralSourceDetail: z.string().default(""),
  townCoverage: z.string().default(""),
  licenseInfo: z.string().default(""),
  feeEstimate: z.number().nullable().default(null),
  feeNote: z.string().default(""),

  interviewDate: z.string().nullable().default(null),
  /** Answers keyed by the stable question id from the guide's question banks. */
  interviewAnswers: z.record(z.string(), z.string()).default({}),

  rating: ratingSchema.default(null),
  selectionStatus: selectionStatusSchema.default("candidate"),
  selectedAt: z.string().nullable().default(null),

  relatedPropertyIds: z.array(idSchema).default([]),
  documentNotes: z.string().default(""),
  concerns: z.string().default(""),
  notes: z.string().default(""),

  /** Populated only for buyer's agents. */
  agentVerification: agentVerificationSchema.default({}),
  agentScorecard: agentScorecardSchema.default({}),
  /** The shared spouse decision note — deliberately separate from `notes`. */
  spouseDecisionNote: z.string().default(""),
});
export type Professional = z.infer<typeof professionalSchema>;
