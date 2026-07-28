import { describe, it, expect } from "vitest";
import type { HomeWorkspace } from "@/lib/models";
import { isBuying, isOwning, resolveMode, resolveWorkspace } from "./resolver";

function workspace(activeMode: HomeWorkspace["activeMode"]): HomeWorkspace {
  return {
    id: "hh1",
    name: "Our Household",
    activeMode,
    createdAt: "2026-07-28T00:00:00.000Z",
    updatedAt: "2026-07-28T00:00:00.000Z",
  };
}

describe("resolveMode", () => {
  it("maps null/undefined to 'unselected'", () => {
    expect(resolveMode(null)).toBe("unselected");
    expect(resolveMode(undefined)).toBe("unselected");
  });

  it("passes through a selected mode unchanged", () => {
    expect(resolveMode("buying")).toBe("buying");
    expect(resolveMode("owning")).toBe("owning");
  });
});

describe("resolveWorkspace", () => {
  it("existing-user migration: a workspace with no mode needs path selection", () => {
    // Existing accounts have activeMode = NULL after the migration (no backfill).
    const view = resolveWorkspace(workspace(null));
    expect(view.mode).toBe("unselected");
    expect(view.isModeSelected).toBe(false);
    expect(view.needsPathSelection).toBe(true);
  });

  it("resolves a BUYING workspace", () => {
    const view = resolveWorkspace(workspace("buying"));
    expect(view.mode).toBe("buying");
    expect(view.isModeSelected).toBe(true);
    expect(view.needsPathSelection).toBe(false);
    expect(isBuying(view)).toBe(true);
    expect(isOwning(view)).toBe(false);
  });

  it("resolves an OWNING workspace", () => {
    const view = resolveWorkspace(workspace("owning"));
    expect(view.mode).toBe("owning");
    expect(view.isModeSelected).toBe(true);
    expect(view.needsPathSelection).toBe(false);
    expect(isOwning(view)).toBe(true);
    expect(isBuying(view)).toBe(false);
  });

  it("carries the underlying workspace through unchanged", () => {
    const w = workspace("buying");
    expect(resolveWorkspace(w).workspace).toBe(w);
  });
});
