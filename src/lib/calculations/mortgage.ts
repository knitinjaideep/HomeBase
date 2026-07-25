/**
 * Mortgage math — standard fixed-rate amortization.
 *
 * All functions are pure and unit-tested. Rates are expressed as annual
 * percentages (e.g. 6.5 means 6.5%). Every output is an ESTIMATE and should be
 * labeled as such in the UI.
 */

/** Loan principal = purchase price minus the cash down payment. Never negative. */
export function loanAmount(purchasePrice: number, downPayment: number): number {
  return Math.max(0, purchasePrice - downPayment);
}

/**
 * Monthly principal + interest for a fully-amortizing fixed-rate loan.
 *
 * M = P · r(1+r)^n / ((1+r)^n − 1)
 *  where r = monthly rate, n = number of monthly payments.
 * A 0% rate degrades gracefully to straight-line principal.
 */
export function monthlyPrincipalAndInterest(
  principal: number,
  annualRatePct: number,
  termYears: number,
): number {
  if (principal <= 0 || termYears <= 0) return 0;
  const n = Math.round(termYears * 12);
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / n;
  const factor = Math.pow(1 + r, n);
  return (principal * r * factor) / (factor - 1);
}

/** Down payment as a percentage of purchase price (0–100). */
export function downPaymentPercent(purchasePrice: number, downPayment: number): number {
  if (purchasePrice <= 0) return 0;
  return (downPayment / purchasePrice) * 100;
}

/**
 * Rough monthly private mortgage insurance estimate. PMI is generally required
 * when the down payment is under 20%. We use an annual rate applied to the loan
 * balance; the default 0.6% is a mid-range conventional estimate.
 */
export function monthlyPmi(
  principal: number,
  downPaymentPct: number,
  annualPmiRatePct = 0.6,
): number {
  if (principal <= 0) return 0;
  if (downPaymentPct >= 20) return 0;
  return (principal * (annualPmiRatePct / 100)) / 12;
}

/**
 * Cumulative interest paid over the first `months` payments of the loan.
 * Used for the lender-quote 5-year interest estimate. Iterates the schedule.
 */
export function cumulativeInterest(
  principal: number,
  annualRatePct: number,
  termYears: number,
  months: number,
): number {
  if (principal <= 0 || termYears <= 0 || months <= 0) return 0;
  const totalPayments = Math.round(termYears * 12);
  const payments = Math.min(Math.round(months), totalPayments);
  const r = annualRatePct / 100 / 12;
  const payment = monthlyPrincipalAndInterest(principal, annualRatePct, termYears);

  if (r === 0) return 0; // no interest at 0%

  let balance = principal;
  let interestPaid = 0;
  for (let i = 0; i < payments; i++) {
    const interest = balance * r;
    interestPaid += interest;
    balance -= payment - interest;
    if (balance < 0) balance = 0;
  }
  return interestPaid;
}
