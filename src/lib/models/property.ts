import { z } from "zod";
import { baseEntitySchema, idSchema, moneySchema, ratingSchema } from "./common";

/** Internal workflow status for a property we are tracking. */
export const propertyStatusSchema = z.enum([
  "saved",
  "researching",
  "tour-scheduled",
  "visited",
  "interested",
  "shortlisted",
  "possible-offer",
  "offer-submitted",
  "rejected",
  "under-contract",
  "eliminated",
  "archived",
]);
export type PropertyStatus = z.infer<typeof propertyStatusSchema>;

/** MLS-style listing status, distinct from our internal workflow status. */
export const listingStatusSchema = z.enum([
  "active",
  "pending",
  "contingent",
  "sold",
  "withdrawn",
  "off-market",
  "unknown",
]);

export const propertyTypeSchema = z.enum([
  "single-family",
  "townhouse",
  "condo",
  "multi-family",
  "other",
]);

export const trafficLevelSchema = z.enum(["low", "moderate", "high", "unknown"]);
export const parkingSchema = z.enum(["ample", "limited", "permit-only", "none", "unknown"]);

/**
 * School research, treated as research data — never derived from the town name.
 * Ratings and boundaries can change and should be independently verified.
 */
export const schoolResearchSchema = z.object({
  elementary: z.string().default(""),
  middle: z.string().default(""),
  high: z.string().default(""),
  source: z.string().default(""),
  verifiedDate: z.string().nullable().default(null),
  ratingMetric: z.string().default(""), // e.g. "GreatSchools 8/10" — kept as text
  notes: z.string().default(""),
});
export type SchoolResearch = z.infer<typeof schoolResearchSchema>;

/** All 1–5 subjective ratings for a property, in one place for scoring/comparison. */
export const propertyRatingsSchema = z.object({
  schoolConfidence: ratingSchema.default(null),
  commute: ratingSchema.default(null),
  stationConvenience: ratingSchema.default(null),
  neighborhood: ratingSchema.default(null),
  layout: ratingSchema.default(null),
  condition: ratingSchema.default(null),
  resaleConfidence: ratingSchema.default(null),
  backyard: ratingSchema.default(null),
  frontYard: ratingSchema.default(null),
  primaryBedroom: ratingSchema.default(null),
  closet: ratingSchema.default(null),
  kitchen: ratingSchema.default(null),
  basement: ratingSchema.default(null),
  garage: ratingSchema.default(null),
  storage: ratingSchema.default(null),
  naturalLight: ratingSchema.default(null),
  homeOffice: ratingSchema.default(null),
  childSafety: ratingSchema.default(null),
});
export type PropertyRatings = z.infer<typeof propertyRatingsSchema>;

/** Property-level financial inputs; blanks fall back to the financial profile. */
export const propertyFinanceSchema = z.object({
  expectedDownPayment: moneySchema.default(null),
  mortgageRatePct: z.number().nullable().default(null),
  loanTermYears: z.number().nullable().default(null),
  insuranceEstimateAnnual: moneySchema.default(null),
  maintenancePct: z.number().nullable().default(null),
  closingCostAssumption: moneySchema.default(null),
  immediateRenovationEstimate: moneySchema.default(null),
});
export type PropertyFinance = z.infer<typeof propertyFinanceSchema>;

export const propertySchema = baseEntitySchema.extend({
  // Identity
  address: z.string().min(1),
  town: z.string().default(""),
  zip: z.string().default(""),
  listingUrl: z.string().default(""),
  mlsNumber: z.string().default(""),
  listingStatus: listingStatusSchema.default("unknown"),
  dateAdded: z.string(),
  showingDate: z.string().nullable().default(null),

  // Details
  askingPrice: moneySchema.default(null),
  offerPrice: moneySchema.default(null),
  finalSalePrice: moneySchema.default(null),
  annualPropertyTaxes: moneySchema.default(null),
  bedrooms: z.number().nullable().default(null),
  bathrooms: z.number().nullable().default(null),
  squareFootage: z.number().nullable().default(null),
  lotSize: z.string().default(""), // acres or sq ft, kept as text
  yearBuilt: z.number().nullable().default(null),
  hoaMonthly: moneySchema.default(null),
  propertyType: propertyTypeSchema.default("single-family"),
  daysOnMarket: z.number().nullable().default(null),

  // Location
  schools: schoolResearchSchema,
  distanceToStation: z.string().default(""),
  stationName: z.string().default(""),
  parking: parkingSchema.default("unknown"),
  driveToStationMinutes: z.number().nullable().default(null),
  doorToDoorCommuteMinutes: z.number().nullable().default(null),
  neighborhoodNotes: z.string().default(""),
  floodZoneNotes: z.string().default(""),
  roadNoise: z.string().default(""),
  trafficLevel: trafficLevelSchema.default("unknown"),

  // Features / condition (ratings) + free notes
  ratings: propertyRatingsSchema,
  notes: z.string().default(""),

  // Financial inputs
  finance: propertyFinanceSchema,

  // Workflow
  status: propertyStatusSchema.default("saved"),

  // Housekeeping
  isSample: z.boolean().default(false),
  isArchived: z.boolean().default(false),
  archivedAt: z.string().nullable().default(null),
});
export type Property = z.infer<typeof propertySchema>;

/** One spouse's take on a visited property. Embedded inside a PropertyVisit. */
export const spousePropertyReviewSchema = z.object({
  liked: z.string().default(""),
  disliked: z.string().default(""),
  emotionalExcitement: ratingSchema.default(null),
  practicalFit: ratingSchema.default(null),
  wouldVisitAgain: z.boolean().nullable().default(null),
  wouldMakeOffer: z.boolean().nullable().default(null),
  notes: z.string().default(""),
});
export type SpousePropertyReview = z.infer<typeof spousePropertyReviewSchema>;

/** A single tour of a property. Shared observations + per-spouse reviews. */
export const propertyVisitSchema = baseEntitySchema.extend({
  propertyId: idSchema,
  visitDate: z.string(),

  // Shared observation ratings (1–5)
  firstImpression: ratingSchema.default(null),
  neighborhoodFeeling: ratingSchema.default(null),
  streetTraffic: ratingSchema.default(null),
  noise: ratingSchema.default(null),
  naturalLight: ratingSchema.default(null),
  layout: ratingSchema.default(null),
  kitchen: ratingSchema.default(null),
  primaryBedroom: ratingSchema.default(null),
  closetSpace: ratingSchema.default(null),
  bathrooms: ratingSchema.default(null),
  backyard: ratingSchema.default(null),
  basement: ratingSchema.default(null),
  storage: ratingSchema.default(null),
  wfhSuitability: ratingSchema.default(null),
  childSafety: ratingSchema.default(null),

  // Condition & concern notes (free text so nothing is forced)
  visibleWaterDamage: z.string().default(""),
  mustySmells: z.string().default(""),
  foundationConcerns: z.string().default(""),
  roofConcerns: z.string().default(""),
  hvacConcerns: z.string().default(""),
  electricalConcerns: z.string().default(""),
  plumbingConcerns: z.string().default(""),
  windowCondition: z.string().default(""),

  immediateRepairs: z.string().default(""),
  questionsForAgent: z.string().default(""),
  wouldHaveToBeTrue: z.string().default(""),

  // The prominent reflection question.
  stillWantAfterExcitement: z.string().default(""),

  buyer1Review: spousePropertyReviewSchema,
  buyer2Review: spousePropertyReviewSchema,
});
export type PropertyVisit = z.infer<typeof propertyVisitSchema>;
