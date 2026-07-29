import { describe, it, expect } from "vitest";
import { noteMatchesSearch, filterNotes, allTags } from "./filter";
import type { Note } from "@/lib/models";

function note(overrides: Partial<Note>): Note {
  return {
    id: "n1",
    createdAt: "2026-07-28T00:00:00.000Z",
    updatedAt: "2026-07-28T00:00:00.000Z",
    title: "",
    body: "",
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

describe("noteMatchesSearch", () => {
  it("matches everything on a blank query", () => {
    expect(noteMatchesSearch({ title: "", body: "anything" }, "")).toBe(true);
    expect(noteMatchesSearch({ title: "", body: "anything" }, "   ")).toBe(true);
  });

  it("matches the title case-insensitively", () => {
    expect(noteMatchesSearch({ title: "Plumber follow-up", body: "" }, "PLUMBER")).toBe(true);
  });

  it("matches the body case-insensitively", () => {
    expect(noteMatchesSearch({ title: "", body: "Ask about the roof age" }, "roof")).toBe(true);
  });

  it("does not match unrelated text", () => {
    expect(noteMatchesSearch({ title: "Plumber", body: "Call Tuesday" }, "electrician")).toBe(false);
  });
});

describe("filterNotes", () => {
  const notes: Note[] = [
    note({ id: "1", body: "Ask about the roof", pinned: true, tags: ["inspection"], contextType: "property", contextId: "p1" }),
    note({ id: "2", body: "General reminder", contextType: null }),
    note({ id: "3", body: "Furnace filter monthly", tags: ["maintenance"], contextType: "ownedHome" }),
    note({ id: "4", body: "Old note", archived: true }),
  ];

  it("defaults to active (non-archived) notes only", () => {
    const result = filterNotes(notes, {});
    expect(result.map((n) => n.id)).toEqual(["1", "2", "3"]);
  });

  it("shows only archived notes when requested", () => {
    const result = filterNotes(notes, { archived: true });
    expect(result.map((n) => n.id)).toEqual(["4"]);
  });

  it("filters by search text", () => {
    const result = filterNotes(notes, { query: "furnace" });
    expect(result.map((n) => n.id)).toEqual(["3"]);
  });

  it("filters by context type, including general (null)", () => {
    expect(filterNotes(notes, { contextType: "property" }).map((n) => n.id)).toEqual(["1"]);
    expect(filterNotes(notes, { contextType: null }).map((n) => n.id)).toEqual(["2"]);
  });

  it("filters by tag", () => {
    expect(filterNotes(notes, { tags: ["maintenance"] }).map((n) => n.id)).toEqual(["3"]);
  });

  it("filters pinned-only", () => {
    expect(filterNotes(notes, { pinnedOnly: true }).map((n) => n.id)).toEqual(["1"]);
  });

  it("combines filters", () => {
    const result = filterNotes(notes, { query: "roof", pinnedOnly: true });
    expect(result.map((n) => n.id)).toEqual(["1"]);
  });
});

describe("allTags", () => {
  it("returns the sorted union of tags across notes", () => {
    const notes = [note({ tags: ["b", "a"] }), note({ tags: ["c"] }), note({ tags: [] })];
    expect(allTags(notes)).toEqual(["a", "b", "c"]);
  });
});
