import { describe, it, expect } from "vitest";
import {
  getDefaultRouteForMode,
  getNavigationForMode,
  isNavItemActive,
  isRouteAvailableForMode,
} from "./navigation";
import type { ResolvedMode } from "./resolver";

const MODES: ResolvedMode[] = ["buying", "owning"];

describe("getNavigationForMode", () => {
  it("gives buyers the existing Journey/Homes/Notes/Toolkit destinations, unchanged", () => {
    const items = getNavigationForMode("buying").map((i) => i.label);
    expect(items).toEqual(["Journey", "Homes", "Notes", "Toolkit"]);
  });

  it("gives homeowners HomeBase/Maintenance/Notes, with no buyer-only surfaces", () => {
    const items = getNavigationForMode("owning").map((i) => i.label);
    expect(items).toEqual(["HomeBase", "Maintenance", "Notes"]);
    for (const buyerOnly of ["Journey", "Homes", "Toolkit"]) {
      expect(items).not.toContain(buyerOnly);
    }
  });

  it("falls back to the buyer shape when mode is unselected (defensive default)", () => {
    expect(getNavigationForMode("unselected")).toEqual(getNavigationForMode("buying"));
  });

  it("both modes share the Notes destination", () => {
    const buyerHrefs = getNavigationForMode("buying").map((i) => i.href);
    const ownerHrefs = getNavigationForMode("owning").map((i) => i.href);
    expect(buyerHrefs).toContain("/notes");
    expect(ownerHrefs).toContain("/notes");
  });
});

describe("getDefaultRouteForMode", () => {
  it("sends a buyer to /journey", () => {
    expect(getDefaultRouteForMode("buying")).toBe("/journey");
  });

  it("sends a homeowner to /homebase", () => {
    expect(getDefaultRouteForMode("owning")).toBe("/homebase");
  });

  it("falls back to /journey when unselected", () => {
    expect(getDefaultRouteForMode("unselected")).toBe("/journey");
  });
});

describe("isRouteAvailableForMode", () => {
  it("blocks a homeowner from buyer-only routes: journey, homes, and their sub-routes", () => {
    for (const path of ["/journey", "/journey/find-strategy", "/properties", "/properties/abc", "/visit/abc"]) {
      expect(isRouteAvailableForMode(path, "owning")).toBe(false);
    }
  });

  it("blocks a buyer from homeowner-only routes: homebase and maintenance", () => {
    for (const path of ["/homebase", "/maintenance", "/maintenance/schedule"]) {
      expect(isRouteAvailableForMode(path, "buying")).toBe(false);
    }
  });

  it("keeps buyer-only routes available to buyers", () => {
    for (const path of ["/journey", "/properties", "/compare", "/finances", "/lenders", "/professionals", "/resources", "/timeline", "/toolkit"]) {
      expect(isRouteAvailableForMode(path, "buying")).toBe(true);
    }
  });

  it("keeps homeowner-only routes available to homeowners", () => {
    expect(isRouteAvailableForMode("/homebase", "owning")).toBe(true);
    expect(isRouteAvailableForMode("/maintenance", "owning")).toBe(true);
  });

  it("keeps shared routes available regardless of mode", () => {
    for (const path of ["/notes", "/settings", "/paths"]) {
      for (const mode of MODES) {
        expect(isRouteAvailableForMode(path, mode)).toBe(true);
      }
    }
  });

  it("does not false-positive on an unrelated route that merely starts with the same letters", () => {
    // /journeys (no slash) must not match the /journey prefix.
    expect(isRouteAvailableForMode("/journeys", "owning")).toBe(true);
  });

  it("treats unselected like buying for route availability (WorkspaceGate never reaches this check while unselected)", () => {
    expect(isRouteAvailableForMode("/journey", "unselected")).toBe(true);
    expect(isRouteAvailableForMode("/homebase", "unselected")).toBe(false);
  });
});

describe("no-redirect-loop invariant", () => {
  it("each mode's default route is always available in that same mode", () => {
    for (const mode of MODES) {
      expect(isRouteAvailableForMode(getDefaultRouteForMode(mode), mode)).toBe(true);
    }
  });
});

describe("isNavItemActive", () => {
  it("matches a plain item only on its own href", () => {
    const item = { href: "/homebase", label: "HomeBase" };
    expect(isNavItemActive("/homebase", item)).toBe(true);
    expect(isNavItemActive("/homebase/anything", item)).toBe(true);
    expect(isNavItemActive("/maintenance", item)).toBe(false);
  });

  it("matches a hub item (Toolkit) across all of its prefixes", () => {
    const toolkit = getNavigationForMode("buying").find((i) => i.label === "Toolkit")!;
    for (const path of ["/toolkit", "/compare", "/finances/scenario-1", "/lenders", "/professionals", "/resources", "/timeline?tab=documents"]) {
      // query strings aren't part of pathname in real usage; strip for this assertion
      expect(isNavItemActive(path.split("?")[0], toolkit)).toBe(true);
    }
    expect(isNavItemActive("/journey", toolkit)).toBe(false);
  });

  it("matches Homes across /properties and /visit", () => {
    const homes = getNavigationForMode("buying").find((i) => i.label === "Homes")!;
    expect(isNavItemActive("/properties", homes)).toBe(true);
    expect(isNavItemActive("/properties/abc", homes)).toBe(true);
    expect(isNavItemActive("/visit/abc", homes)).toBe(true);
    expect(isNavItemActive("/journey", homes)).toBe(false);
  });
});
