/**
 * Lender-quote estimates. Quotes are never ranked by interest rate alone; the
 * app surfaces payment, cash required, upfront cost, and multi-year totals so
 * the tradeoffs are visible. All pure and unit-tested. Every figure is an ESTIMATE.
 */

import { monthlyPrincipalAndInterest, cumulativeInterest } from "./mortgage";

export interface LenderQuoteInputs {
  loanAmount: number;
  interestRatePct: number;
  loanTermYears: number;
  /** Discount/origination points, as a percentage of loan amount. */
  points: number;
  /** Flat lender fees in dollars. */
  lenderFees: number;
}

export interface LenderQuoteEstimate {
  monthlyPrincipalAndInterest: number;
  /** Up-front cost paid to obtain the loan: points (as dollars) + flat fees. */
  upfrontLenderCost: number;
  /** Interest paid over the first 5 years (60 payments). */
  fiveYearInterest: number;
  /** Five-year total financing cost: upfront cost + first-5-year interest. */
  fiveYearTotalFinancingCost: number;
}

/** Dollar value of points on a loan. */
export function pointsCost(loanAmount: number, points: number): number {
  return Math.max(0, loanAmount) * (Math.max(0, points) / 100);
}

export function estimateLenderQuote(inputs: LenderQuoteInputs): LenderQuoteEstimate {
  const { loanAmount, interestRatePct, loanTermYears, points, lenderFees } = inputs;

  const pi = monthlyPrincipalAndInterest(loanAmount, interestRatePct, loanTermYears);
  const upfrontLenderCost = pointsCost(loanAmount, points) + Math.max(0, lenderFees);
  const fiveYearInterest = cumulativeInterest(loanAmount, interestRatePct, loanTermYears, 60);
  const fiveYearTotalFinancingCost = upfrontLenderCost + fiveYearInterest;

  return {
    monthlyPrincipalAndInterest: pi,
    upfrontLenderCost,
    fiveYearInterest,
    fiveYearTotalFinancingCost,
  };
}
