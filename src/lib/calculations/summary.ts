/**
 * evaluatePlan — the single transparent function that turns a full set of
 * purchase inputs into every figure the app displays. Used by the financial
 * planner and by per-property evaluation so the numbers are always consistent.
 * Pure and unit-tested. Every output is an ESTIMATE.
 */

import { cashRequiredAtClosing, cashRemainingAfterClosing, reserveDifference } from "./closing";
import { housingRatio, totalDebtToIncome } from "./dti";
import {
  classifyAgainstGuardrail,
  mostConservativeBand,
  type GuardrailBand,
  type GuardrailThresholds,
} from "./guardrails";
import {
  lenderMonthlyPayment,
  monthlyMaintenanceReserve,
  realMonthlyOwnershipCost,
  type LenderPaymentBreakdown,
} from "./ownership";

export interface PlanInputs {
  purchasePrice: number;
  downPayment: number;
  annualRatePct: number;
  termYears: number;
  annualPropertyTaxes: number;
  annualInsurance: number;
  monthlyHoa: number;
  includePmi: boolean;
  annualPmiRatePct: number;

  closingCosts: number;
  prepaidEscrow: number;
  immediateRenovation: number;
  movingBudget: number;

  maintenancePct: number;
  utilitiesMonthly: number;
  commutingDeltaMonthly: number;
  renovationAllocationMonthly: number;

  availableFunds: number;
  minReserve: number;
  preferredReserve: number;

  grossMonthlyIncome: number;
  takeHomeMonthlyIncome: number;
  monthlyDebts: number;

  priceGuardrails: GuardrailThresholds;
  paymentGuardrails: GuardrailThresholds;
}

export interface PlanResult {
  lender: LenderPaymentBreakdown;
  maintenanceMonthly: number;
  realMonthlyOwnershipCost: number;

  cashRequiredAtClosing: number;
  cashRemainingAfterClosing: number;
  differenceFromMinReserve: number;
  differenceFromPreferredReserve: number;

  housingPctOfGross: number;
  housingPctOfTakeHome: number;
  totalDti: number;

  priceBand: GuardrailBand;
  paymentBand: GuardrailBand;
  reserveBand: GuardrailBand;
  overallBand: GuardrailBand;
}

export function evaluatePlan(input: PlanInputs): PlanResult {
  const lender = lenderMonthlyPayment({
    purchasePrice: input.purchasePrice,
    downPayment: input.downPayment,
    annualRatePct: input.annualRatePct,
    termYears: input.termYears,
    annualPropertyTaxes: input.annualPropertyTaxes,
    annualInsurance: input.annualInsurance,
    monthlyHoa: input.monthlyHoa,
    includePmi: input.includePmi,
    annualPmiRatePct: input.annualPmiRatePct,
  });

  const maintenanceMonthly = monthlyMaintenanceReserve(input.purchasePrice, input.maintenancePct);
  const realMonthly = realMonthlyOwnershipCost({
    lenderPayment: lender.total,
    maintenanceMonthly,
    utilitiesMonthly: input.utilitiesMonthly,
    commutingDeltaMonthly: input.commutingDeltaMonthly,
    renovationAllocationMonthly: input.renovationAllocationMonthly,
  });

  const cashRequired = cashRequiredAtClosing({
    downPayment: input.downPayment,
    closingCosts: input.closingCosts,
    prepaidEscrow: input.prepaidEscrow,
    immediateRenovation: input.immediateRenovation,
    movingBudget: input.movingBudget,
  });
  const cashRemaining = cashRemainingAfterClosing(input.availableFunds, cashRequired);

  const priceBand = classifyAgainstGuardrail(input.purchasePrice, input.priceGuardrails);
  const paymentBand = classifyAgainstGuardrail(lender.total, input.paymentGuardrails);

  // Reserve band: comfortable when preferred reserve is met, above-comfortable
  // when only the minimum is met, beyond-limit when below the minimum.
  let reserveBand: GuardrailBand;
  if (cashRemaining >= input.preferredReserve) reserveBand = "comfortable";
  else if (cashRemaining >= input.minReserve) reserveBand = "above-comfortable";
  else reserveBand = "beyond-limit";

  return {
    lender,
    maintenanceMonthly,
    realMonthlyOwnershipCost: realMonthly,

    cashRequiredAtClosing: cashRequired,
    cashRemainingAfterClosing: cashRemaining,
    differenceFromMinReserve: reserveDifference(cashRemaining, input.minReserve),
    differenceFromPreferredReserve: reserveDifference(cashRemaining, input.preferredReserve),

    housingPctOfGross: housingRatio(lender.total, input.grossMonthlyIncome),
    housingPctOfTakeHome: housingRatio(lender.total, input.takeHomeMonthlyIncome),
    totalDti: totalDebtToIncome(lender.total, input.monthlyDebts, input.grossMonthlyIncome),

    priceBand,
    paymentBand,
    reserveBand,
    overallBand: mostConservativeBand([priceBand, paymentBand, reserveBand]),
  };
}
