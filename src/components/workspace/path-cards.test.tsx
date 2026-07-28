import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PathSelectionCards } from "./path-cards";

/**
 * These render the pure presentational card group to static markup (no DOM),
 * asserting the *semantics* that give the component its behaviour: real grouped
 * radios (keyboard navigation + focus), a visible focus ring, tone-correct
 * accents, and responsive stacking — the things the design brief calls out.
 */
function render(value: Parameters<typeof PathSelectionCards>[0]["value"]) {
  return renderToStaticMarkup(<PathSelectionCards value={value} onChange={() => {}} />);
}

describe("PathSelectionCards", () => {
  it("offers exactly the buyer and homeowner paths as grouped radios", () => {
    const html = render(null);
    const radios = html.match(/type="radio"/g) ?? [];
    expect(radios).toHaveLength(2);
    // One radio group (shared name) → arrow-key navigation for free.
    expect(html).toContain('name="homescope-path"');
    expect(html).toContain('value="buying"');
    expect(html).toContain('value="owning"');
    // A group is announced to assistive tech.
    expect(html).toContain("Choose your HomeScope path");
  });

  it("explains what each path contains", () => {
    const html = render(null);
    for (const feature of [
      "Journey planning",
      "Homes and visits",
      "Offer preparation",
      "Maintenance",
      "Warranties",
      "Recurring tasks and notes",
    ]) {
      expect(html).toContain(feature);
    }
    expect(html).toContain("I’m buying a home");
    expect(html).toContain("I own a home");
  });

  it("shows a keyboard focus ring and no div-only click handlers", () => {
    const html = render(null);
    expect(html).toContain("focus-within:ring");
    // The choices are inputs/labels, not clickable divs.
    expect(html).not.toMatch(/<div[^>]*onclick/i);
  });

  it("uses the mint/teal accent for buyer and amber/gold for homeowner", () => {
    const html = render(null);
    expect(html).toMatch(/text-accent|bg-accent/);
    expect(html).toMatch(/text-caution|bg-caution/);
  });

  it("stacks to one column on mobile and two on larger screens", () => {
    const html = render(null);
    expect(html).toContain("grid-cols-1");
    expect(html).toContain("md:grid-cols-2");
  });

  it("marks the selected path's radio as checked (and nothing when none)", () => {
    const inputTags = (html: string) =>
      (html.match(/<input[^>]*>/g) ?? []).reduce<Record<string, string>>((acc, tag) => {
        const value = tag.match(/value="([^"]+)"/)?.[1];
        if (value) acc[value] = tag;
        return acc;
      }, {});

    const selected = inputTags(render("owning"));
    expect(selected.owning).toContain("checked");
    expect(selected.buying).not.toContain("checked");

    const none = inputTags(render(null));
    expect(none.owning).not.toContain("checked");
    expect(none.buying).not.toContain("checked");
  });
});
