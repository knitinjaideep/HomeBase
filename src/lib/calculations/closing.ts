/**
 * Cash-at-closing and post-closing reserve math. All pure and unit-tested.
 * Retirement funds are never treated as available closing cash here — callers
 * pass only the funds they have explicitly designated as available.
 */

export interface ClosingCostInputs {
  /** Cash down payment in dollars. */
  downPayment: number;
  /** Buyer-side closing costs (title, transfer, attorney, lender fees). */
  closingCosts: number;
  /** Prepaid items and escrow setup (prepaid taxes/insurance, per-diem interest). */
  prepaidEscrow: number;
  /** Immediate renovation budget the buyer intends to pay from cash. */
  immediateRenovation: number;
  /** Moving budget. */
  movingBudget: number;
}

/** Total cash a buyer must bring, before any reserve. */
export function cashRequiredAtClosing(inputs: ClosingCostInputs): number {
  const { downPayment, closingCosts, prepaidEscrow, immediateRenovation, movingBudget } = inputs;
  return (
    Math.max(0, downPayment) +
    Math.max(0, closingCosts) +
    Math.max(0, prepaidEscrow) +
    Math.max(0, immediateRenovation) +
    Math.max(0, movingBudget)
  );
}

/** Liquid cash left after closing = available funds − cash required. May be negative. */
export function cashRemainingAfterClosing(
  availableFunds: number,
  cashRequired: number,
): number {
  return availableFunds - cashRequired;
}

/**
 * Difference between remaining cash and a reserve target. Positive means the
 * reserve is met with room to spare; negative means the reserve is short.
 */
export function reserveDifference(cashRemaining: number, reserveTarget: number): number {
  return cashRemaining - reserveTarget;
}

/** Rough default for closing costs when the buyer has not entered a figure: ~2.5% of price. */
export function estimatedClosingCosts(purchasePrice: number, ratePct = 2.5): number {
  return Math.max(0, purchasePrice) * (ratePct / 100);
}
