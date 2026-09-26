import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LocationSelector, nextActiveIndex } from "./location-selector";
import { customChoice, type TownChoice } from "@/lib/journey/towns";

const choice = (name: string, id: string, county = ""): TownChoice => ({ name, state: "NJ", county, geographyId: id, isCustom: false });
const render = (value: TownChoice[], extra: Partial<Parameters<typeof LocationSelector>[0]> = {}) =>
  renderToStaticMarkup(<LocationSelector label="primary locations" value={value} onChange={() => {}} {...extra} />);

describe("LocationSelector", () => {
  it("is an accessible combobox with the requested placeholder", () => {
    const html = render([]);
    expect(html).toContain('role="combobox"');
    expect(html).toContain('placeholder="Search for a town or city"');
    expect(html).toContain('aria-autocomplete="list"');
    expect(html).toContain("Add custom location");
  });

  it("shows multiple selections as removable cards with state, county and an accessible remove control", () => {
    const html = render([choice("Princeton", "1"), choice("West Windsor", "2"), choice("Washington Township", "3", "Morris County")]);
    expect(html).toContain("Princeton, NJ");
    expect(html).toContain("West Windsor, NJ");
    expect(html).toContain("Morris County");
    expect(html).toContain('aria-label="Remove Princeton, NJ"');
    expect(html).toContain('aria-label="Remove West Windsor, NJ"');
  });

  it("offers reordering only for primary lists with more than one location", () => {
    expect(render([choice("A", "1"), choice("B", "2")], { reorderable: true })).toContain('aria-label="Move A, NJ down"');
    expect(render([choice("A", "1")], { reorderable: true })).not.toContain("Move A");
    expect(render([choice("A", "1"), choice("B", "2")])).not.toContain("Move A");
  });

  it("labels custom locations and older unmatched names", () => {
    const custom = customChoice("Hidden Valley", "PA")!;
    const unmatched: TownChoice = { name: "Oldtown", state: "", county: "", geographyId: null, isCustom: false };
    const html = render([custom, unmatched]);
    expect(html).toContain("Custom location");
    expect(html).toContain("Not matched to a Census location");
  });
});

describe("nextActiveIndex (arrow-key navigation)", () => {
  it("moves down and up, wrapping at both ends", () => {
    expect(nextActiveIndex(-1, "ArrowDown", 3)).toBe(0);
    expect(nextActiveIndex(2, "ArrowDown", 3)).toBe(0);
    expect(nextActiveIndex(-1, "ArrowUp", 3)).toBe(2);
    expect(nextActiveIndex(0, "ArrowUp", 3)).toBe(2);
    expect(nextActiveIndex(1, "ArrowUp", 3)).toBe(0);
  });
  it("stays unselected when there are no results", () => {
    expect(nextActiveIndex(-1, "ArrowDown", 0)).toBe(-1);
  });
});
