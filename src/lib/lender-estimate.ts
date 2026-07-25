import { estimateLenderQuote, type LenderQuoteEstimate } from "./calculations";
import type { LenderQuote } from "./models";

export interface QuoteEstimate extends LenderQuoteEstimate {
  loanAmount: number;
  cashRequired: number;
}

/**
 * Derive comparison figures for a stored quote. The loan amount falls back to
 * price minus down payment when not entered. Cash required is down payment plus
 * the quote's estimated closing costs. All values are estimates.
 */
export function estimateForQuote(q: LenderQuote): QuoteEstimate {
  const loanAmount = q.loanAmount ?? (q.purchasePrice ?? 0) - (q.downPayment ?? 0);
  const est = estimateLenderQuote({
    loanAmount: Math.max(0, loanAmount),
    interestRatePct: q.interestRatePct ?? 0,
    loanTermYears: q.loanTermYears ?? 30,
    points: q.points ?? 0,
    lenderFees: q.lenderFees ?? 0,
  });
  const cashRequired = (q.downPayment ?? 0) + (q.estimatedClosingCosts ?? 0);
  return { ...est, loanAmount: Math.max(0, loanAmount), cashRequired };
}
