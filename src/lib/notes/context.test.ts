import { describe, it, expect } from "vitest";
import { resolveNoteContext, inferContextFromPath, type NoteContextData } from "./context";
import type { Note } from "@/lib/models";

function note(overrides: Partial<Note>): Note {
  return {
    id: "n1",
    createdAt: "2026-07-28T00:00:00.000Z",
    updatedAt: "2026-07-28T00:00:00.000Z",
    title: "",
    body: "x",
    pinned: false,
    archived: false,
    noteType: "general",
    contextType: null,
    contextId: null,
    tags: [],
    authorLabel: "",
    ...overrides,
  };
}

const emptyData: NoteContextData = {
  properties: [],
  visits: [],
  deals: [],
  documents: [],
  professionals: [],
  maintenanceItems: [],
  repairProjects: [],
};

describe("resolveNoteContext", () => {
  it("returns null for a general note (no context)", () => {
    expect(resolveNoteContext(note({}), emptyData)).toBeNull();
  });

  it("resolves a note linked to a candidate home that still exists", () => {
    const data: NoteContextData = { ...emptyData, properties: [{ id: "p1", address: "12 Oak St" }] };
    const result = resolveNoteContext(note({ contextType: "property", contextId: "p1" }), data);
    expect(result).toEqual({ label: "12 Oak St", href: "/properties/p1", available: true });
  });

  it("marks a note as unavailable when its linked property was deleted", () => {
    // Simulates deletion: the id the note still carries is absent from the
    // (now current) household-scoped properties array. The note itself is
    // untouched by the caller — only how it renders changes.
    const result = resolveNoteContext(note({ contextType: "property", contextId: "gone" }), emptyData);
    expect(result).toEqual({ label: "Candidate home", href: null, available: false });
  });

  it("resolves a home visit using the property it belongs to", () => {
    const data: NoteContextData = {
      ...emptyData,
      properties: [{ id: "p1", address: "12 Oak St" }],
      visits: [{ id: "v1", propertyId: "p1", visitDate: "2026-06-01" }],
    };
    const result = resolveNoteContext(note({ contextType: "propertyVisit", contextId: "v1" }), data);
    expect(result?.available).toBe(true);
    expect(result?.href).toBe("/visit/p1");
    expect(result?.label).toContain("12 Oak St");
  });

  it("marks a deleted visit as unavailable rather than dropping the note", () => {
    const result = resolveNoteContext(note({ contextType: "propertyVisit", contextId: "gone" }), emptyData);
    expect(result).toEqual({ label: "Home visit", href: null, available: false });
  });

  it("treats owner-mode categories with no backing entity yet as available, category-only", () => {
    const result = resolveNoteContext(note({ contextType: "maintenanceItem" }), emptyData);
    expect(result).toEqual({ label: "Maintenance item", href: "/maintenance", available: true });
  });

  it("resolves a note linked to a real maintenance item by id", () => {
    const data: NoteContextData = {
      ...emptyData,
      maintenanceItems: [{ id: "m1", title: "Replace HVAC filter" }],
    };
    const result = resolveNoteContext(note({ contextType: "maintenanceItem", contextId: "m1" }), data);
    expect(result).toEqual({ label: "Replace HVAC filter", href: "/maintenance?item=m1", available: true });
  });

  it("marks a note as unavailable when its linked maintenance item was deleted", () => {
    const result = resolveNoteContext(note({ contextType: "maintenanceItem", contextId: "gone" }), emptyData);
    expect(result).toEqual({ label: "Maintenance item", href: null, available: false });
  });

  it("resolves a note linked to a real repair project by id", () => {
    const data: NoteContextData = {
      ...emptyData,
      repairProjects: [{ id: "r1", title: "Repaint exterior trim" }],
    };
    const result = resolveNoteContext(note({ contextType: "repairProject", contextId: "r1" }), data);
    expect(result).toEqual({ label: "Repaint exterior trim", href: "/maintenance?project=r1", available: true });
  });

  it("treats a category-only repair-project note as available with no specific record", () => {
    const result = resolveNoteContext(note({ contextType: "repairProject" }), emptyData);
    expect(result).toEqual({ label: "Repair or project", href: "/maintenance", available: true });
  });

  it.each([
    ["homeInventory", "Home inventory", "/homebase"],
    ["contractorNotes", "Contractor comparison", "/toolkit"],
    ["annualReview", "Annual home review", "/homebase"],
    ["seasonalChecklist", "Seasonal checklist", "/maintenance"],
    ["projectCostWorksheet", "Project cost worksheet", "/maintenance?tab=repairs"],
  ] as const)("resolves the %s Toolkit note context as category-only, always available", (contextType, label, href) => {
    const result = resolveNoteContext(note({ contextType, contextId: null }), emptyData);
    expect(result).toEqual({ label, href, available: true });
  });

  it("resolves a journey stage from the static guide content", () => {
    const result = resolveNoteContext(note({ contextType: "journeyStage", contextId: "offer-prep" }), emptyData);
    expect(result?.available).toBe(true);
    expect(result?.href).toBe("/journey/offer-prep");
  });

  it("never resolves an id that only exists in a different household's data", () => {
    // The whole isolation guarantee: resolveNoteContext only ever looks
    // inside the collection it's handed. A caller only ever hands it
    // already RLS-scoped data (useProperties() etc. filter by householdId
    // server-side) — this proves there is no secondary/global lookup this
    // function could use to reach outside that collection.
    const otherHouseholdsData: NoteContextData = {
      ...emptyData,
      properties: [{ id: "not-mine", address: "Someone else's house" }],
    };
    const result = resolveNoteContext(note({ contextType: "property", contextId: "mine" }), otherHouseholdsData);
    expect(result?.available).toBe(false);
    expect(result?.label).not.toContain("Someone else's house");
  });
});

describe("inferContextFromPath", () => {
  it("infers a candidate home from a property detail route", () => {
    expect(inferContextFromPath("/properties/p1", { id: "p1" })).toEqual({ type: "property", id: "p1" });
  });

  it("infers a home visit category from the visit route (no id — the page supplies it)", () => {
    expect(inferContextFromPath("/visit/p1", { id: "p1" })).toEqual({ type: "propertyVisit", id: null });
  });

  it("infers a journey stage from the stage route", () => {
    expect(inferContextFromPath("/journey/offer-prep", { stageId: "offer-prep" })).toEqual({
      type: "journeyStage",
      id: "offer-prep",
    });
  });

  it("infers owned home on the homebase placeholder", () => {
    expect(inferContextFromPath("/homebase", {})).toEqual({ type: "ownedHome", id: null });
  });

  it("infers a maintenance category on the maintenance placeholder", () => {
    expect(inferContextFromPath("/maintenance", {})).toEqual({ type: "maintenanceItem", id: null });
  });

  it("infers nothing (general) on shared or unrelated pages", () => {
    expect(inferContextFromPath("/notes", {})).toBeNull();
    expect(inferContextFromPath("/settings", {})).toBeNull();
    expect(inferContextFromPath("/professionals", {})).toBeNull();
  });
});
