import { describe, it, expect } from "vitest";
import { BUYER_TOOLKIT_GROUPS, OWNER_TOOLKIT_GROUPS, toolkitGroupsForMode } from "./groups";

const BUYER_ONLY_HREF_PREFIXES = ["/finances", "/lenders", "/professionals", "/compare", "/journey", "/timeline", "/resources"];
const OWNER_ONLY_HREF_PREFIXES = ["/homebase", "/maintenance"];

function hrefs(groups: typeof BUYER_TOOLKIT_GROUPS): string[] {
  return groups.flatMap((g) => g.tools.map((t) => t.href));
}

describe("BUYER_TOOLKIT_GROUPS", () => {
  it("is organized into Money, Homes, People, and Planning — not a flat list", () => {
    expect(BUYER_TOOLKIT_GROUPS.map((g) => g.title)).toEqual(["Money", "Homes", "People", "Planning"]);
    for (const group of BUYER_TOOLKIT_GROUPS) {
      expect(group.tools.length).toBeGreaterThan(0);
    }
  });

  it("never links to an owner-only surface", () => {
    for (const href of hrefs(BUYER_TOOLKIT_GROUPS)) {
      for (const prefix of OWNER_ONLY_HREF_PREFIXES) {
        expect(href.startsWith(prefix)).toBe(false);
      }
    }
  });

  it("has no two tiles pointing at the exact same destination", () => {
    const all = hrefs(BUYER_TOOLKIT_GROUPS);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("OWNER_TOOLKIT_GROUPS", () => {
  it("is organized into Maintenance, Home records, and Planning — not a flat list", () => {
    expect(OWNER_TOOLKIT_GROUPS.map((g) => g.title)).toEqual(["Maintenance", "Home records", "Planning"]);
    for (const group of OWNER_TOOLKIT_GROUPS) {
      expect(group.tools.length).toBeGreaterThan(0);
    }
  });

  it("never links to a buyer-only surface", () => {
    for (const href of hrefs(OWNER_TOOLKIT_GROUPS)) {
      for (const prefix of BUYER_ONLY_HREF_PREFIXES) {
        expect(href.startsWith(prefix)).toBe(false);
      }
    }
  });

  it("has no two tiles pointing at the exact same destination", () => {
    const all = hrefs(OWNER_TOOLKIT_GROUPS);
    expect(new Set(all).size).toBe(all.length);
  });

  it("builds the new Toolkit-only notes tools on the shared notes system, not a bespoke page", () => {
    const notesHrefs = hrefs(OWNER_TOOLKIT_GROUPS).filter((h) => h.startsWith("/notes?context="));
    expect(notesHrefs.length).toBeGreaterThanOrEqual(4);
  });
});

describe("toolkitGroupsForMode", () => {
  it("gives buyers the buyer groups and owners the owner groups", () => {
    expect(toolkitGroupsForMode("buying")).toBe(BUYER_TOOLKIT_GROUPS);
    expect(toolkitGroupsForMode("owning")).toBe(OWNER_TOOLKIT_GROUPS);
  });

  it("falls back to the buyer groups when mode is unselected", () => {
    expect(toolkitGroupsForMode("unselected")).toBe(BUYER_TOOLKIT_GROUPS);
  });
});
