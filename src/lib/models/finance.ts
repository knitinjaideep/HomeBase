import { z } from "zod";
import { baseEntitySchema, idSchema, moneySchema } from "./common";

/** A named, saved financial-planner scenario. Editable and duplicable. */
export const mortgageScenarioSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  /** Optional link to a property this scenario was built around. */
  propertyId: idSchema.nullable().default(null),

  purchasePrice: z.number(),
  downPaymentMode: z.enum(["dollars", "percent"]).default("percent"),
  downPaymentValue: z.number(), // dollars or percent depending on mode
  mortgageRatePct: z.number(),
  loanTermYears: z.number(),

  annualPropertyTaxes: z.number(),
  annualInsurance: z.number(),
  monthlyHoa: z.number(),
  includePmi: z.boolean().default(true),
  pmiRatePct: z.number().default(0.6),

  closingCosts: z.number(),
  prepaidEscrow: z.number(),
  immediateRenovation: z.number(),
  movingBudget: z.number(),

  maintenancePct: z.number(),
  utilitiesMonthly: z.number(),
  commutingDeltaMonthly: z.number(),
  renovationAllocationMonthly: z.number(),

  availableFunds: z.number(),
  minReserve: z.number(),
  preferredReserve: z.number(),

  grossMonthlyIncome: z.number(),
  takeHomeMonthlyIncome: z.number(),
  monthlyDebts: z.number(),
  childcareMonthly: z.number(),

  /** Free note, e.g. "assumes attending salary from July 2027". */
  assumptionNote: z.string().default(""),
});
export type MortgageScenario = z.infer<typeof mortgageScenarioSchema>;

export const loanTypeSchema = z.enum([
  "physician",
  "conventional",
  "high-balance-conventional",
  "jumbo",
  "fha",
  "va",
  "other",
]);
export type LoanType = z.infer<typeof loanTypeSchema>;

/** A quote from a lender. Never ranked by rate alone in the UI. */
export const lenderQuoteSchema = baseEntitySchema.extend({
  lender: z.string().min(1),
  contact: z.string().default(""),
  loanType: loanTypeSchema.default("conventional"),
  quoteDate: z.string().nullable().default(null),

  purchasePrice: moneySchema.default(null),
  loanAmount: moneySchema.default(null),
  downPayment: moneySchema.default(null),

  interestRatePct: z.number().nullable().default(null),
  aprPct: z.number().nullable().default(null),
  rateType: z.enum(["fixed", "adjustable"]).default("fixed"),
  loanTermYears: z.number().nullable().default(null),

  points: z.number().nullable().default(null),
  lenderFees: moneySchema.default(null),
  estimatedClosingCosts: moneySchema.default(null),

  hasPmi: z.boolean().nullable().default(null),
  reserveRequirement: z.string().default(""),
  contractIncomeEligible: z.boolean().nullable().default(null),
  maxMonthsBeforeStart: z.number().nullable().default(null),
  prepaymentPenalty: z.boolean().nullable().default(null),
  rateLockDays: z.number().nullable().default(null),

  notes: z.string().default(""),
});
export type LenderQuote = z.infer<typeof lenderQuoteSchema>;
