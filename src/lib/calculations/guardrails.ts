/**
 * Financial-guardrail classification. The app never displays a simple
 * "you can afford this" verdict. Instead every price / payment is placed into
 * one calm, factual band relative to the household's predetermined limits.
 * All pure and unit-tested.
 */

export type GuardrailBand =
  | "comfortable"
  | "above-comfortable"
  | "near-maximum"
  | "beyond-limit"
  | "missing-info";

export interface GuardrailThresholds {
  /** Upper edge of the comfortable range. At or below → comfortable. */
  comfortableCeiling: number;
  /** Upper edge of the acceptable stretch (max target). */
  maxTarget: number;
  /** Absolute walk-away ceiling. Above this → beyond limit. */
  absoluteCeiling: number;
}

/**
 * Classify a single value against three ascending thresholds.
 * A null/undefined/NaN value yields "missing-info" so the UI can prompt for it.
 */
export function classifyAgainstGuardrail(
  value: number | null | undefined,
  thresholds: GuardrailThresholds,
): GuardrailBand {
  if (value === null || value === undefined || Number.isNaN(value)) return "missing-info";
  if (value <= thresholds.comfortableCeiling) return "comfortable";
  if (value <= thresholds.maxTarget) return "above-comfortable";
  if (value <= thresholds.absoluteCeiling) return "near-maximum";
  return "beyond-limit";
}

/** Human-readable, non-alarmist label for each band. */
export const GUARDRAIL_LABELS: Record<GuardrailBand, string> = {
  comfortable: "Within comfortable range",
  "above-comfortable": "Above comfortable range",
  "near-maximum": "Near maximum",
  "beyond-limit": "Beyond walk-away limit",
  "missing-info": "Missing information",
};

/**
 * Combine several band results into the single most-conservative one, so a
 * property is summarized by its worst dimension. Order of severity:
 * comfortable < above-comfortable < near-maximum < beyond-limit.
 * "missing-info" never overrides a real signal; it only shows when nothing else does.
 */
const SEVERITY: Record<GuardrailBand, number> = {
  comfortable: 0,
  "above-comfortable": 1,
  "near-maximum": 2,
  "beyond-limit": 3,
  "missing-info": -1,
};

export function mostConservativeBand(bands: GuardrailBand[]): GuardrailBand {
  const real = bands.filter((b) => b !== "missing-info");
  if (real.length === 0) return "missing-info";
  return real.reduce((worst, b) => (SEVERITY[b] > SEVERITY[worst] ? b : worst), real[0]);
}

/** A calm, factual sentence for a band, or null when nothing needs saying. */
export function guardrailMessage(band: GuardrailBand, subject: string): string | null {
  switch (band) {
    case "comfortable":
      return null;
    case "above-comfortable":
      return `This ${subject} is above your comfortable range.`;
    case "near-maximum":
      return `This ${subject} is near your maximum.`;
    case "beyond-limit":
      return `This ${subject} is beyond your predetermined walk-away limit.`;
    case "missing-info":
      return `${subject.charAt(0).toUpperCase() + subject.slice(1)} is missing information.`;
  }
}
