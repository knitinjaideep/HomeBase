import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BuyerOnboardingForm } from "./buyer-onboarding-form";

function render(initial?: Parameters<typeof BuyerOnboardingForm>[0]["initial"]) {
  return renderToStaticMarkup(
    <BuyerOnboardingForm initial={initial} onSubmit={() => {}} onBack={() => {}} />,
  );
}

describe("BuyerOnboardingForm", () => {
  it("asks the two compact questions as accessible radio groups", () => {
    const html = render();
    expect(html).toContain("Buying experience");
    expect(html).toContain("Buying arrangement");
    expect(html).toContain('name="buyer-experience"');
    expect(html).toContain('name="buyer-arrangement"');
    for (const value of ["first-time", "repeat", "solo", "partner", "group"]) {
      expect(html).toContain(`value="${value}"`);
    }
  });

  it("defaults to first-time + solo and reflects those in the checked radios", () => {
    const html = render();
    const tag = (v: string) => html.match(new RegExp(`<input[^>]*value="${v}"[^>]*>`))?.[0] ?? "";
    expect(tag("first-time")).toContain("checked");
    expect(tag("repeat")).not.toContain("checked");
    expect(tag("solo")).toContain("checked");
  });

  it("keeps participant names optional and hidden until it's a shared purchase", () => {
    // Solo (default) → no participant field.
    expect(render()).not.toContain("buyer-participants");
    // Partner → an optional, clearly non-binding field appears.
    const html = render({ arrangement: "partner" });
    expect(html).toContain("buyer-participants");
    expect(html).toContain("optional");
    expect(html).toContain("No invites or accounts are created");
  });

  it("has focus-visible styling on the choices (keyboard focus states)", () => {
    expect(render()).toContain("focus-within:ring");
  });
});
