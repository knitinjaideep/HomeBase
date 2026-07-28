import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { OwnerOnboardingForm } from "./owner-onboarding-form";

function render(initial?: Parameters<typeof OwnerOnboardingForm>[0]["initial"]) {
  return renderToStaticMarkup(
    <OwnerOnboardingForm initial={initial} onSubmit={() => {}} onBack={() => {}} />,
  );
}

describe("OwnerOnboardingForm", () => {
  it("asks only property type and ownership stage as accessible radio groups", () => {
    const html = render();
    expect(html).toContain("Property type");
    expect(html).toContain("Ownership stage");
    expect(html).toContain('name="owner-property-type"');
    expect(html).toContain('name="owner-ownership-stage"');
    for (const value of [
      "single-family",
      "condo-townhouse",
      "other",
      "new-owner",
      "established-owner",
    ]) {
      expect(html).toContain(`value="${value}"`);
    }
  });

  it("defaults to single-family + new homeowner", () => {
    const html = render();
    const tag = (v: string) => html.match(new RegExp(`<input[^>]*value="${v}"[^>]*>`))?.[0] ?? "";
    expect(tag("single-family")).toContain("checked");
    expect(tag("new-owner")).toContain("checked");
  });

  it("keeps the move-in date optional and skippable", () => {
    const html = render();
    expect(html).toContain('type="date"');
    expect(html).toContain("optional");
    expect(html).toContain("skip this");
  });

  it("has focus-visible styling on the choices (keyboard focus states)", () => {
    expect(render()).toContain("focus-within:ring");
  });
});
