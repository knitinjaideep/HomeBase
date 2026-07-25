/**
 * Bridges stored records to the tested calculation core. Resolves a property's
 * effective purchase inputs (property overrides falling back to the household's
 * financial profile), evaluates it, scores it, and lists missing critical info.
 * The resolution + comparison logic here is unit-tested.
 */

import {
  DEFAULT_SCORE_WEIGHTS,
  evaluatePlan,
  overallScore,
  estimatedClosingCosts,
  type GuardrailBand,
  type GuardrailThresholds,
  type PlanInputs,
  type PlanResult,
} from "./calculations";
import type { FinancialProfile, HouseholdProfile, Property } from "./models";

const BIG = Number.POSITIVE_INFINITY;

/** Liquid funds we treat as available for a purchase. Retirement is excluded. */
export function availablePurchaseFunds(fin: FinancialProfile): number {
  return (fin.checking ?? 0) + (fin.savings ?? 0) + (fin.taxableInvestments ?? 0);
}

/** Gross monthly income. Optionally swaps in buyer 2's future attending scenario. */
export function grossMonthlyIncome(
  household: HouseholdProfile,
  includeFutureBuyer2 = false,
): number {
  const b1 = household.buyer1Income.annualBase ?? 0;
  const b2Base = household.buyer2Income.annualBase ?? 0;
  const b2Future = household.buyer2FutureIncome.annualBase ?? 0;
  const b2 = includeFutureBuyer2 && b2Future > 0 ? b2Future : b2Base;
  return (b1 + b2) / 12;
}

/** Monthly recurring debt/transport commitments used for the DTI estimate. */
export function monthlyDebts(fin: FinancialProfile): number {
  return (
    (fin.carPaymentsAndInsuranceMonthly ?? 0) +
    (fin.otherTransportMonthly ?? 0) +
    (fin.studentLoansMonthly ?? 0) +
    (fin.otherDebtMonthly ?? 0)
  );
}

export function priceGuardrails(fin: FinancialProfile): GuardrailThresholds {
  return {
    comfortableCeiling: fin.priceComfortableMax ?? BIG,
    maxTarget: fin.priceRoutineCeiling ?? BIG,
    absoluteCeiling: fin.priceAbsoluteCeiling ?? BIG,
  };
}

export function paymentGuardrails(fin: FinancialProfile): GuardrailThresholds {
  return {
    comfortableCeiling: fin.paymentComfortable ?? BIG,
    maxTarget: fin.paymentMaxTarget ?? BIG,
    absoluteCeiling: fin.paymentAbsoluteCeiling ?? BIG,
  };
}

/** A rough annual homeowners-insurance estimate when none is entered: 0.35% of price. */
export function estimatedAnnualInsurance(price: number): number {
  return price * 0.0035;
}

/** The effective purchase price we evaluate: offer price if set, else asking. */
export function effectivePrice(property: Property): number | null {
  if (property.offerPrice !== null && property.offerPrice !== undefined) return property.offerPrice;
  if (property.askingPrice !== null && property.askingPrice !== undefined)
    return property.askingPrice;
  return null;
}

/** Merge a property's overrides with the profile defaults into full plan inputs. */
export function resolvePlanInputs(
  property: Property,
  fin: FinancialProfile,
  household: HouseholdProfile,
  opts: { includeFutureBuyer2?: boolean } = {},
): PlanInputs {
  const price = effectivePrice(property) ?? 0;
  const f = property.finance;

  const downPayment = f.expectedDownPayment ?? price * 0.2;
  const annualPropertyTaxes = property.annualPropertyTaxes ?? 0;
  const annualInsurance = f.insuranceEstimateAnnual ?? estimatedAnnualInsurance(price);
  const monthlyHoa = property.hoaMonthly ?? 0;
  const maintenancePct = f.maintenancePct ?? fin.defaultMaintenancePct;
  const closingCosts = f.closingCostAssumption ?? estimatedClosingCosts(price);
  const immediateRenovation = f.immediateRenovationEstimate ?? 0;
  // Escrow/prepaids estimated at ~3 months of taxes + insurance.
  const prepaidEscrow = annualPropertyTaxes * 0.25 + annualInsurance * 0.25;

  const downPaymentPct = price > 0 ? (downPayment / price) * 100 : 0;

  return {
    purchasePrice: price,
    downPayment,
    annualRatePct: f.mortgageRatePct ?? fin.planningInterestRatePct,
    termYears: f.loanTermYears ?? fin.defaultLoanTermYears,
    annualPropertyTaxes,
    annualInsurance,
    monthlyHoa,
    includePmi: downPaymentPct < 20,
    annualPmiRatePct: 0.6,

    closingCosts,
    prepaidEscrow,
    immediateRenovation,
    movingBudget: 0,

    maintenancePct,
    utilitiesMonthly: 0,
    commutingDeltaMonthly: 0,
    renovationAllocationMonthly: 0,

    availableFunds: availablePurchaseFunds(fin),
    minReserve: fin.minReserve ?? 0,
    preferredReserve: fin.preferredReserve ?? 0,

    grossMonthlyIncome: grossMonthlyIncome(household, opts.includeFutureBuyer2),
    takeHomeMonthlyIncome: household.combinedMonthlyTakeHome ?? 0,
    monthlyDebts: monthlyDebts(fin),

    priceGuardrails: priceGuardrails(fin),
    paymentGuardrails: paymentGuardrails(fin),
  };
}

export interface PropertyEvaluation {
  price: number | null;
  hasPrice: boolean;
  plan: PlanResult;
  score: number | null;
  priceBand: GuardrailBand;
  paymentBand: GuardrailBand;
  reserveBand: GuardrailBand;
  overallBand: GuardrailBand;
  missing: string[];
}

/** The critical facts a property is still missing, phrased for the UI. */
export function propertyMissingInfo(property: Property): string[] {
  const missing: string[] = [];
  if (property.annualPropertyTaxes === null) missing.push("Taxes missing");
  if (!property.schools.verifiedDate) missing.push("School assignment unverified");
  if (property.doorToDoorCommuteMinutes === null) missing.push("Commute untested");
  if (property.finance.insuranceEstimateAnnual === null) missing.push("Insurance estimate missing");
  if (property.finance.immediateRenovationEstimate === null)
    missing.push("Renovation estimate missing");
  if (!property.floodZoneNotes.trim()) missing.push("Flood status not reviewed");
  return missing;
}

/** Full evaluation used by property cards and the comparison view. */
export function evaluateProperty(
  property: Property,
  fin: FinancialProfile,
  household: HouseholdProfile,
  opts: { includeFutureBuyer2?: boolean } = {},
): PropertyEvaluation {
  const price = effectivePrice(property);
  const hasPrice = price !== null;
  const inputs = resolvePlanInputs(property, fin, household, opts);
  const plan = evaluatePlan(inputs);
  const score = overallScore(property.ratings, DEFAULT_SCORE_WEIGHTS);

  // Without a price, the money bands are not meaningful — mark them missing.
  const priceBand: GuardrailBand = hasPrice ? plan.priceBand : "missing-info";
  const paymentBand: GuardrailBand = hasPrice ? plan.paymentBand : "missing-info";
  const reserveBand: GuardrailBand = hasPrice ? plan.reserveBand : "missing-info";
  const overallBand: GuardrailBand = hasPrice ? plan.overallBand : "missing-info";

  return {
    price,
    hasPrice,
    plan,
    score,
    priceBand,
    paymentBand,
    reserveBand,
    overallBand,
    missing: propertyMissingInfo(property),
  };
}
