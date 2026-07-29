import { z } from "zod";
import { baseEntitySchema } from "./common";

/**
 * What kind of household record a note is optionally attached to.
 * `ownedHome` / `maintenanceItem` / `repairProject` have no backing table yet
 * (owner mode's `/homebase` and `/maintenance` are still placeholders — see
 * docs/WORKSPACE_MODE.md) — they exist here so a note can already be tagged
 * with the right category, with no `contextId` to point at until those
 * features ship.
 */
export const noteContextTypeSchema = z.enum([
  "journeyStage",
  "property",
  "propertyVisit",
  "deal",
  "ownedHome",
  "maintenanceItem",
  "repairProject",
  "document",
  "professional",
]);
export type NoteContextType = z.infer<typeof noteContextTypeSchema>;

export const noteTypeSchema = z.enum(["general", "question", "observation", "decision", "follow-up"]);
export type NoteType = z.infer<typeof noteTypeSchema>;

/**
 * A freeform note, shared across buyer and homeowner mode alike. Optionally
 * linked to one piece of household data via `contextType`/`contextId` —
 * `contextType: null` means a general workspace note, not attached to
 * anything (what every note was before this field existed). `contextId` is a
 * plain string, not a validated foreign key: it is polymorphic (it can name
 * a row in several different tables depending on `contextType`), so whether
 * it still resolves to something real is checked at read time, not enforced
 * by the schema — see `resolveNoteContext` in lib/notes/context.ts. That is
 * deliberate: if the thing a note pointed to is later deleted, the note
 * itself must never be deleted or corrupted, only shown as unresolved.
 */
export const noteSchema = baseEntitySchema.extend({
  title: z.string().default(""),
  body: z.string().min(1),
  pinned: z.boolean().default(false),
  archived: z.boolean().default(false),
  noteType: noteTypeSchema.default("general"),
  contextType: noteContextTypeSchema.nullable().default(null),
  contextId: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
  /** Optional free-text "who wrote this" — e.g. prefilled from the signed-in member's email. */
  authorLabel: z.string().default(""),
});
export type Note = z.infer<typeof noteSchema>;
