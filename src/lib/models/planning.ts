import { z } from "zod";
import {
  baseEntitySchema,
  idSchema,
  ownerSchema,
  prioritySchema,
  ratingSchema,
  taskStatusSchema,
} from "./common";

/** A checklist grouping (timeline phase or a reusable template instance). */
export const checklistKindSchema = z.enum(["timeline", "template"]);

export const checklistSchema = baseEntitySchema.extend({
  title: z.string().min(1),
  kind: checklistKindSchema.default("template"),
  /** For timeline phases: the calendar window this covers, e.g. "2026-07". */
  phaseStart: z.string().nullable().default(null),
  phaseEnd: z.string().nullable().default(null),
  description: z.string().default(""),
  /** Template category, e.g. "inspection", "town-research", used to group. */
  category: z.string().default(""),
  order: z.number().default(0),
});
export type Checklist = z.infer<typeof checklistSchema>;

export const checklistTaskSchema = baseEntitySchema.extend({
  checklistId: idSchema,
  title: z.string().min(1),
  status: taskStatusSchema.default("todo"),
  dueDate: z.string().nullable().default(null),
  owner: ownerSchema.default("both"),
  priority: prioritySchema.default("medium"),
  notes: z.string().default(""),
  /** Optional link to a specific property. */
  relatedPropertyId: idSchema.nullable().default(null),
  order: z.number().default(0),
});
export type ChecklistTask = z.infer<typeof checklistTaskSchema>;

/**
 * How seriously we are treating a town. A town may only be promoted to
 * "primary" after an in-person research visit (journey stage 9).
 */
export const townDesignationSchema = z.enum(["considering", "primary", "backup", "ruled-out"]);
export type TownDesignation = z.infer<typeof townDesignationSchema>;

/** Research notes for a town under consideration. */
export const townResearchSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  /** Two-letter US state; "" when unknown (rows created before states were recorded). */
  state: z.string().default(""),
  /** County, for telling apart same-named townships ("Washington Township, Morris County"). */
  county: z.string().default(""),
  /** The Census-backed `geographies` row this location is, or null (custom, or not matched yet). */
  geographyId: z.string().uuid().nullable().default(null),
  /** A location the household typed in because no Census geography fit. Never has a geography. */
  isCustom: z.boolean().default(false),
  designation: townDesignationSchema.default("considering"),
  /** Optional 1-based order within its designation; null = not ranked. */
  priority: z.number().int().positive().nullable().default(null),
  whyConsidering: z.string().default(""),

  // Money
  typicalPriceNote: z.string().default(""),
  taxNotes: z.string().default(""),
  budgetFit: ratingSchema.default(null),

  // Commute
  stationName: z.string().default(""),
  trainLine: z.string().default(""),
  stationParking: z.string().default(""),
  parkingPermitNotes: z.string().default(""),
  doorToDoorCommuteMinutes: z.number().nullable().default(null),
  commuteNotes: z.string().default(""),
  stationNotes: z.string().default(""),

  // Schools & family
  schoolDistrictNotes: z.string().default(""),
  schoolRatingMetric: z.string().default(""),
  schoolSource: z.string().default(""),
  schoolVerificationMethod: z.string().default(""),
  schoolVerifiedDate: z.string().nullable().default(null),
  childcareNotes: z.string().default(""),
  healthcareNotes: z.string().default(""),

  // Housing stock
  floodNotes: z.string().default(""),
  housingStockNotes: z.string().default(""),
  typicalHomeAge: z.string().default(""),
  lotSizeNotes: z.string().default(""),
  renovationPatterns: z.string().default(""),
  ordinanceNotes: z.string().default(""),

  // Impressions — recorded from actual visits, not from reputation
  visited: z.boolean().default(false),
  visitDate: z.string().nullable().default(null),
  weekdayImpression: z.string().default(""),
  weekendImpression: z.string().default(""),

  strengths: z.string().default(""),
  weaknesses: z.string().default(""),
  generalNotes: z.string().default(""),
  confidence: ratingSchema.default(null),
});
export type TownResearch = z.infer<typeof townResearchSchema>;
