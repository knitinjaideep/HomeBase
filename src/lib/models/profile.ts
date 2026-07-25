import { z } from "zod";
import { baseEntitySchema, moneySchema, SCHEMA_VERSION } from "./common";

/**
 * Singleton records. Each of these tables holds exactly one row, keyed by a
 * fixed id so the app can always find "the" profile.
 */
export const SINGLETON_ID = "singleton";

/** An income figure paired with a visible "is this an assumption?" flag. */
export const incomeSourceSchema = z.object({
  label: z.string(),
  annualBase: moneySchema,
  /** Optional variable/bonus note (kept as free text; not modeled numerically). */
  variableNote: z.string().default(""),
  /** True when this figure is a forward-looking assumption rather than a known value. */
  isAssumption: z.boolean().default(false),
});
export type IncomeSource = z.infer<typeof incomeSourceSchema>;

export const householdProfileSchema = baseEntitySchema.extend({
  planningDate: z.string(), // ISO date the plan is anchored to
  idealPurchaseStart: z.string(), // e.g. "2027-05"
  idealPurchaseEnd: z.string(), // e.g. "2027-06"
  minOwnershipYears: z.number(),

  buyer1Name: z.string(),
  buyer2Name: z.string(),

  buyer1Income: incomeSourceSchema,
  buyer2Income: incomeSourceSchema,
  /** Optional forward scenario for buyer 2 (e.g. attending physician salary). */
  buyer2FutureIncome: incomeSourceSchema,

  combinedMonthlyTakeHome: moneySchema,

  buyer1CreditScore: z.number().nullable(),
  buyer2CreditScore: z.number().nullable(),

  notes: z.string().default(""),
});
export type HouseholdProfile = z.infer<typeof householdProfileSchema>;

export const financialProfileSchema = baseEntitySchema.extend({
  // Assets
  checking: moneySchema,
  savings: moneySchema,
  taxableInvestments: moneySchema,
  retirementAccounts: moneySchema,
  designatedDownPaymentCash: moneySchema,

  // Reserves
  minReserve: moneySchema,
  preferredReserve: moneySchema,

  // Retirement availability — never counted as closing cash by default.
  retirementAvailableForPurchase: moneySchema,

  // Debts & recurring commitments
  vehicleBalanceRemaining: moneySchema,
  carPaymentsAndInsuranceMonthly: moneySchema,
  otherTransportMonthly: moneySchema,
  studentLoansMonthly: moneySchema,
  otherDebtMonthly: moneySchema,

  // Monthly expenses (planning assumptions)
  groceriesMonthly: moneySchema,
  diningShoppingMonthly: moneySchema,
  insuranceMonthly: moneySchema,
  retirementContributionMonthly: moneySchema,
  espcontributionMonthly: moneySchema,
  childcareMonthly: moneySchema, // unknown by default → null, editable assumption
  travelMonthly: moneySchema,

  // Guardrails (editable)
  priceComfortableMin: moneySchema,
  priceComfortableMax: moneySchema,
  priceRoutineCeiling: moneySchema,
  priceAbsoluteCeiling: moneySchema,

  paymentComfortable: moneySchema,
  paymentMaxTarget: moneySchema,
  paymentAbsoluteCeiling: moneySchema,

  // Planning rate used across the app until real quotes exist.
  planningInterestRatePct: z.number(),
  defaultLoanTermYears: z.number(),
  defaultMaintenancePct: z.number(),
});
export type FinancialProfile = z.infer<typeof financialProfileSchema>;

export const renovationToleranceSchema = z.enum(["turnkey", "cosmetic", "moderate", "major"]);
export type RenovationTolerance = z.infer<typeof renovationToleranceSchema>;

export const homePreferencesSchema = baseEntitySchema.extend({
  primaryTowns: z.array(z.string()),
  backupTowns: z.array(z.string()),
  minSchoolRating: z.number(), // research threshold, not absolute truth

  minBedrooms: z.number(),
  minBathrooms: z.number(),

  requiredNotes: z.string().default(""),
  preferredNotes: z.string().default(""),
  dealbreakerNotes: z.string().default(""),

  maxCommuteMinutes: z.number(),
  /** Undecided by default; seeded to a sensible middle option but editable. */
  renovationTolerance: renovationToleranceSchema,
  renovationDecided: z.boolean().default(false),
});
export type HomePreferences = z.infer<typeof homePreferencesSchema>;

export const appSettingsSchema = baseEntitySchema.extend({
  schemaVersion: z.number().default(SCHEMA_VERSION),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  seeded: z.boolean().default(false),
  /** ISO timestamp of the last export, for the backup reminder. */
  lastBackupAt: z.string().nullable().default(null),
});
export type AppSettings = z.infer<typeof appSettingsSchema>;
