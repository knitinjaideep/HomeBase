import { describe, it, expect } from "vitest";
import { resolvePathGate } from "./onboarding-gate";
import { resolveWorkspace } from "./resolver";
import type { HomeWorkspace } from "@/lib/models";

function workspace(activeMode: HomeWorkspace["activeMode"]): HomeWorkspace {
  return {
    id: "hh1",
    name: "Our Household",
    activeMode,
    createdAt: "2026-07-28T00:00:00.000Z",
    updatedAt: "2026-07-28T00:00:00.000Z",
  };
}

describe("resolvePathGate", () => {
  it("stays on loading until the workspace resolves", () => {
    expect(resolvePathGate(undefined)).toBe("loading");
  });

  it("sends a brand-new (mode-less) user to path selection", () => {
    expect(resolvePathGate(resolveWorkspace(workspace(null)))).toBe("path-selection");
  });

  it("lets a returning buyer straight into the app", () => {
    expect(resolvePathGate(resolveWorkspace(workspace("buying")))).toBe("app");
  });

  it("lets a returning homeowner straight into the app", () => {
    expect(resolvePathGate(resolveWorkspace(workspace("owning")))).toBe("app");
  });
});
