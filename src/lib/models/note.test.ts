import { describe, it, expect } from "vitest";
import { noteSchema } from "./note";

function base() {
  return { id: "n1", createdAt: "2026-07-28T00:00:00.000Z", updatedAt: "2026-07-28T00:00:00.000Z" };
}

describe("noteSchema", () => {
  it("defaults title to empty and pinned to false", () => {
    const note = noteSchema.parse({ ...base(), body: "Ask the plumber about the water heater." });
    expect(note.title).toBe("");
    expect(note.pinned).toBe(false);
  });

  it("requires a non-empty body", () => {
    expect(() => noteSchema.parse({ ...base(), body: "" })).toThrow();
    expect(() => noteSchema.parse({ ...base() })).toThrow();
  });

  it("keeps a provided title and pinned flag", () => {
    const note = noteSchema.parse({ ...base(), title: "Plumber", body: "Call back Tuesday.", pinned: true });
    expect(note.title).toBe("Plumber");
    expect(note.pinned).toBe(true);
  });

  it("defaults the new fields for a plain general note", () => {
    const note = noteSchema.parse({ ...base(), body: "Remember to ask about the roof age." });
    expect(note.archived).toBe(false);
    expect(note.noteType).toBe("general");
    expect(note.contextType).toBeNull();
    expect(note.contextId).toBeNull();
    expect(note.tags).toEqual([]);
    expect(note.authorLabel).toBe("");
  });

  it("links a note to a candidate home", () => {
    const note = noteSchema.parse({
      ...base(),
      body: "Loved the backyard.",
      contextType: "property",
      contextId: "prop-1",
    });
    expect(note.contextType).toBe("property");
    expect(note.contextId).toBe("prop-1");
  });

  it("links a note to an owned home category with no specific id yet", () => {
    const note = noteSchema.parse({
      ...base(),
      body: "Check the furnace filter monthly.",
      contextType: "ownedHome",
    });
    expect(note.contextType).toBe("ownedHome");
    expect(note.contextId).toBeNull();
  });

  it("accepts a question note type", () => {
    const note = noteSchema.parse({
      ...base(),
      body: "Is the roof original to the house?",
      noteType: "question",
    });
    expect(note.noteType).toBe("question");
  });

  it("rejects an unrecognized context type", () => {
    expect(() =>
      noteSchema.parse({ ...base(), body: "x", contextType: "not-a-real-context" }),
    ).toThrow();
  });

  it("keeps tags and an author label", () => {
    const note = noteSchema.parse({
      ...base(),
      body: "Ask the inspector about the sump pump.",
      tags: ["inspection", "follow-up"],
      authorLabel: "nitin.kotcherlakota@gmail.com",
    });
    expect(note.tags).toEqual(["inspection", "follow-up"]);
    expect(note.authorLabel).toBe("nitin.kotcherlakota@gmail.com");
  });
});
