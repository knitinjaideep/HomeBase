/**
 * Debt-to-income and income-share estimates. All pure and unit-tested.
 * These are planning estimates, not lender underwriting.
 */

/** Housing cost as a percentage of monthly income (front-end ratio). */
export function housingRatio(monthlyHousing: number, monthlyIncome: number): number {
  if (monthlyIncome <= 0) return 0;
  return (monthlyHousing / monthlyIncome) * 100;
}

/**
 * Total debt-to-income: (housing + other monthly debts) / gross monthly income.
 * `monthlyDebts` should exclude the housing payment (it is added here).
 */
export function totalDebtToIncome(
  monthlyHousing: number,
  monthlyDebts: number,
  grossMonthlyIncome: number,
): number {
  if (grossMonthlyIncome <= 0) return 0;
  return ((monthlyHousing + Math.max(0, monthlyDebts)) / grossMonthlyIncome) * 100;
}

/** Convert an annual figure to monthly. */
export function toMonthly(annual: number): number {
  return annual / 12;
}
