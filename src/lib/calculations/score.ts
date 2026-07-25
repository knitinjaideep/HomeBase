/**
 * Overall property score — a transparent weighted average of the 1–5 ratings a
 * buyer records. It is a convenience for sorting and comparison, never a verdict.
 * Missing ratings are simply omitted from the average (they do not count as zero).
 * All pure and unit-tested.
 */

export interface RatingWeights {
  [key: string]: number;
}

/**
 * Weighted average over a set of 1–5 ratings. Only ratings that are present
 * (a finite number) contribute; weights are renormalized over what's present.
 * Returns a 0–5 number, or null when nothing has been rated yet.
 */
export function overallScore(
  ratings: Record<string, number | null | undefined>,
  weights: RatingWeights,
): number | null {
  let weightedSum = 0;
  let weightTotal = 0;

  for (const key of Object.keys(weights)) {
    const value = ratings[key];
    const weight = weights[key];
    if (typeof value === "number" && Number.isFinite(value) && weight > 0) {
      weightedSum += value * weight;
      weightTotal += weight;
    }
  }

  if (weightTotal === 0) return null;
  return weightedSum / weightTotal;
}

/** Default weighting for a property's headline score. Priorities the household stated. */
export const DEFAULT_SCORE_WEIGHTS: RatingWeights = {
  schoolConfidence: 3,
  commute: 2,
  condition: 2,
  layout: 1.5,
  neighborhood: 1.5,
  backyard: 1,
  primaryBedroom: 1,
  closet: 0.5,
  resaleConfidence: 1,
};
