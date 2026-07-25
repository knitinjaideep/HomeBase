import { describe, it, expect } from "vitest";
import {
  classifyAgainstGuardrail,
  mostConservativeBand,
  guardrailMessage,
  GUARDRAIL_LABELS,
  type GuardrailThresholds,
} from "./guardrails";

const priceGuardrails: GuardrailThresholds = {
  comfortableCeiling: 1_150_000,
  maxTarget: 1_200_000,
  absoluteCeiling: 1_300_000,
};

describe("classifyAgainstGuardrail", () => {
  it("labels values at or below the comfortable ceiling as comfortable", () => {
    expect(classifyAgainstGuardrail(1_050_000, priceGuardrails)).toBe("comfortable");
    expect(classifyAgainstGuardrail(1_150_000, priceGuardrails)).toBe("comfortable");
  });
  it("labels the stretch band above comfortable", () => {
    expect(classifyAgainstGuardrail(1_180_000, priceGuardrails)).toBe("above-comfortable");
  });
  it("labels values near the absolute ceiling as near-maximum", () => {
    expect(classifyAgainstGuardrail(1_250_000, priceGuardrails)).toBe("near-maximum");
    expect(classifyAgainstGuardrail(1_300_000, priceGuardrails)).toBe("near-maximum");
  });
  it("labels values above the absolute ceiling as beyond-limit", () => {
    expect(classifyAgainstGuardrail(1_350_000, priceGuardrails)).toBe("beyond-limit");
  });
  it("labels null/undefined/NaN as missing-info", () => {
    expect(classifyAgainstGuardrail(null, priceGuardrails)).toBe("missing-info");
    expect(classifyAgainstGuardrail(undefined, priceGuardrails)).toBe("missing-info");
    expect(classifyAgainstGuardrail(NaN, priceGuardrails)).toBe("missing-info");
  });
});

describe("mostConservativeBand", () => {
  it("returns the most severe real band", () => {
    expect(mostConservativeBand(["comfortable", "near-maximum", "above-comfortable"])).toBe(
      "near-maximum",
    );
  });
  it("ignores missing-info when a real band exists", () => {
    expect(mostConservativeBand(["missing-info", "comfortable"])).toBe("comfortable");
  });
  it("returns missing-info only when nothing is known", () => {
    expect(mostConservativeBand(["missing-info", "missing-info"])).toBe("missing-info");
    expect(mostConservativeBand([])).toBe("missing-info");
  });
});

describe("guardrailMessage", () => {
  it("has no message for a comfortable band", () => {
    expect(guardrailMessage("comfortable", "purchase price")).toBeNull();
  });
  it("produces calm factual copy for other bands", () => {
    expect(guardrailMessage("beyond-limit", "payment")).toContain("walk-away limit");
    expect(guardrailMessage("above-comfortable", "purchase price")).toContain("comfortable range");
  });
});

describe("GUARDRAIL_LABELS", () => {
  it("covers every band", () => {
    expect(GUARDRAIL_LABELS["comfortable"]).toBe("Within comfortable range");
    expect(GUARDRAIL_LABELS["beyond-limit"]).toBe("Beyond walk-away limit");
    expect(GUARDRAIL_LABELS["missing-info"]).toBe("Missing information");
  });
});
