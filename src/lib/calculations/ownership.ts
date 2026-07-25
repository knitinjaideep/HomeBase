/**
 * Monthly housing-cost composition. Two clearly separated figures:
 *  - lender-style monthly payment (what a lender underwrites): PITI + HOA + PMI
 *  - estimated real monthly ownership cost: lender payment plus the ongoing
 *    costs a household actually feels (maintenance, utilities, commute delta,
 *    renovation savings allocation).
 * All pure and unit-tested.
 */

import { monthlyPrincipalAndInterest, monthlyPmi, downPaymentPercent } from "./mortgage";

export interface LenderPaymentInputs {
  purchasePrice: number;
  downPayment: number;
  annualRatePct: number;
  termYears: number;
  annualPropertyTaxes: number;
  annualInsurance: number;
  monthlyHoa: number;
  /** Set false to force PMI off (e.g. physician loans with no PMI). */
  includePmi?: boolean;
  annualPmiRatePct?: number;
}

export interface LenderPaymentBreakdown {
  loanAmount: number;
  principalAndInterest: number;
  monthlyTaxes: number;
  monthlyInsurance: number;
  monthlyHoa: number;
  monthlyPmi: number;
  total: number;
}

/** The lender-style monthly payment a lender would underwrite (PITI + HOA + PMI). */
export function lenderMonthlyPayment(inputs: LenderPaymentInputs): LenderPaymentBreakdown {
  const {
    purchasePrice,
    downPayment,
    annualRatePct,
    termYears,
    annualPropertyTaxes,
    annualInsurance,
    monthlyHoa,
    includePmi = true,
    annualPmiRatePct = 0.6,
  } = inputs;

  const principal = Math.max(0, purchasePrice - downPayment);
  const principalAndInterest = monthlyPrincipalAndInterest(principal, annualRatePct, termYears);
  const monthlyTaxes = Math.max(0, annualPropertyTaxes) / 12;
  const monthlyInsurance = Math.max(0, annualInsurance) / 12;
  const hoa = Math.max(0, monthlyHoa);
  const pmi = includePmi
    ? monthlyPmi(principal, downPaymentPercent(purchasePrice, downPayment), annualPmiRatePct)
    : 0;

  const total = principalAndInterest + monthlyTaxes + monthlyInsurance + hoa + pmi;

  return {
    loanAmount: principal,
    principalAndInterest,
    monthlyTaxes,
    monthlyInsurance,
    monthlyHoa: hoa,
    monthlyPmi: pmi,
    total,
  };
}

/** Monthly maintenance reserve as a percentage of home value per year (default 1%). */
export function monthlyMaintenanceReserve(homeValue: number, annualPct = 1): number {
  return (Math.max(0, homeValue) * (annualPct / 100)) / 12;
}

export interface RealOwnershipInputs {
  lenderPayment: number;
  maintenanceMonthly: number;
  /** Optional monthly utilities estimate. */
  utilitiesMonthly?: number;
  /** Optional monthly commuting cost difference vs. today (can be negative). */
  commutingDeltaMonthly?: number;
  /** Optional monthly amount set aside for renovation financing/savings. */
  renovationAllocationMonthly?: number;
}

/** Estimated real monthly ownership cost — the household's true monthly outlay. */
export function realMonthlyOwnershipCost(inputs: RealOwnershipInputs): number {
  const {
    lenderPayment,
    maintenanceMonthly,
    utilitiesMonthly = 0,
    commutingDeltaMonthly = 0,
    renovationAllocationMonthly = 0,
  } = inputs;
  return (
    lenderPayment +
    Math.max(0, maintenanceMonthly) +
    Math.max(0, utilitiesMonthly) +
    commutingDeltaMonthly +
    Math.max(0, renovationAllocationMonthly)
  );
}
