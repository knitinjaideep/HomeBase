import { z } from "zod";
import { baseEntitySchema, idSchema, ownerSchema } from "./common";

/**
 * Journey state. The *content* of the guide (stages, actions, questions) lives
 * in `src/lib/guide` as static TypeScript so it can be edited and versioned in
 * the repo. These tables store only what the household has actually done, keyed
 * by the stable content ids, so revising guide text never destroys progress.
 */

/** Progress states shared by stages and actions. */
export const journeyStatusSchema = z.enum([
  "not-started",
  "learning",
  "gathering",
  "in-progress",
  "blocked",
  "ready",
  "completed",
  "revisit",
  "not-applicable",
]);
export type JourneyStatus = z.infer<typeof journeyStatusSchema>;

/** Statuses that count as "this is finished". */
export const SETTLED_STATUSES: JourneyStatus[] = ["completed", "not-applicable"];

/** Statuses that mean active effort is underway. */
export const ACTIVE_STATUSES: JourneyStatus[] = [
  "learning",
  "gathering",
  "in-progress",
  "blocked",
  "ready",
];

/**
 * Per-stage state. `id` is the stable stage id from the guide content (e.g.
 * "strategy"), not a generated uuid, so content and state always line up.
 */
export const journeyStageStateSchema = baseEntitySchema.extend({
  /** Manual status override. Null means "derive it from the actions". */
  statusOverride: journeyStatusSchema.nullable().default(null),
  targetDate: z.string().nullable().default(null),
  owner: ownerSchema.default("both"),
  notes: z.string().default(""),
  /** Free-text description of what is blocking this stage, if anything. */
  blockerNote: z.string().default(""),
});
export type JourneyStageState = z.infer<typeof journeyStageStateSchema>;

/** Per-action state. `id` is the stable action id from the guide content. */
export const journeyActionStateSchema = baseEntitySchema.extend({
  stageId: z.string(),
  status: journeyStatusSchema.default("not-started"),
  owner: ownerSchema.default("both"),
  dueDate: z.string().nullable().default(null),
  notes: z.string().default(""),
  /** Where the supporting evidence lives — a note, not an upload. */
  attachmentNote: z.string().default(""),
  completedAt: z.string().nullable().default(null),
});
export type JourneyActionState = z.infer<typeof journeyActionStateSchema>;

/**
 * A recorded decision. `id` is the stable decision id from the guide content
 * for guided decisions; ad-hoc decisions use a generated id.
 */
export const journeyDecisionSchema = baseEntitySchema.extend({
  stageId: z.string(),
  /** Copied from content so the record still reads correctly if content moves. */
  prompt: z.string().default(""),
  answer: z.string().default(""),
  /** Who agreed. Both spouses agreeing is a completion criterion in several stages. */
  buyer1Approved: z.boolean().default(false),
  buyer2Approved: z.boolean().default(false),
  decidedAt: z.string().nullable().default(null),
  notes: z.string().default(""),
});
export type JourneyDecision = z.infer<typeof journeyDecisionSchema>;

/**
 * Stage 3 — the attending-income transition. A singleton because it describes
 * one person's one job transition.
 */
export const attendingSearchStatusSchema = z.enum([
  "not-started",
  "searching",
  "interviewing",
  "offer-received",
  "contract-signed",
  "started",
]);

export const lenderIncomeTreatmentSchema = z.enum([
  "unknown",
  "not-yet-asked",
  "asked-awaiting-answer",
  "confirmed-in-writing",
  "declined",
]);

export const attendingTransitionSchema = baseEntitySchema.extend({
  searchStatus: attendingSearchStatusSchema.default("not-started"),
  expectedLocation: z.string().default(""),
  expectedStartDate: z.string().nullable().default(null),
  expectedBaseSalary: z.number().nullable().default(null),
  /** Marked when the salary is an estimate rather than a contracted figure. */
  salaryIsEstimate: z.boolean().default(true),
  expectedShiftStructure: z.string().default(""),
  expectedBonusStructure: z.string().default(""),
  contractSigned: z.boolean().default(false),
  contractSignedDate: z.string().nullable().default(null),
  contractContingencies: z.string().default(""),
  credentialingStatus: z.string().default(""),
  /** Whether a lender has confirmed, in writing, how this income will be treated. */
  lenderIncomeTreatment: lenderIncomeTreatmentSchema.default("not-yet-asked"),
  lenderTreatmentNotes: z.string().default(""),
  maxMonthsClosingToStart: z.number().nullable().default(null),
  requiredReservesNote: z.string().default(""),
  requiredDocumentationNote: z.string().default(""),
  notes: z.string().default(""),
});
export type AttendingTransition = z.infer<typeof attendingTransitionSchema>;

/**
 * Stage 6 — mortgage approvals. Deliberately typed so a casual "you're fine"
 * conversation is never mistaken for an underwritten approval.
 */
export const approvalKindSchema = z.enum([
  "readiness-conversation",
  "prequalification",
  "preapproval",
  "fully-underwritten",
]);
export type ApprovalKind = z.infer<typeof approvalKindSchema>;

export const mortgageApprovalSchema = baseEntitySchema.extend({
  lender: z.string().min(1),
  kind: approvalKindSchema.default("readiness-conversation"),
  /** Optional link to a professional record for the loan officer. */
  professionalId: idSchema.nullable().default(null),
  issuedDate: z.string().nullable().default(null),
  expiresDate: z.string().nullable().default(null),

  maxLoanAmount: z.number().nullable().default(null),
  maxPurchasePrice: z.number().nullable().default(null),
  estimatedRatePct: z.number().nullable().default(null),
  estimatedClosingCosts: z.number().nullable().default(null),
  assumedAnnualTaxes: z.number().nullable().default(null),
  assumedAnnualInsurance: z.number().nullable().default(null),
  reserveRequirement: z.string().default(""),

  creditReviewed: z.boolean().default(false),
  incomeReviewed: z.boolean().default(false),
  attendingContractReviewed: z.boolean().default(false),
  assetsReviewed: z.boolean().default(false),
  debtsReviewed: z.boolean().default(false),
  downPaymentVerified: z.boolean().default(false),

  propertyTypeRestrictions: z.string().default(""),
  loanLimitNotes: z.string().default(""),
  notes: z.string().default(""),
});
export type MortgageApproval = z.infer<typeof mortgageApprovalSchema>;
