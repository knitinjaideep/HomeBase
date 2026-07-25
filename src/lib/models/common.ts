import { z } from "zod";

/** Current data schema version. Bump when a migration is introduced. */
export const SCHEMA_VERSION = 2;

/** A stable unique id (crypto.randomUUID). */
export const idSchema = z.string().min(1);

/** ISO-8601 timestamp string. Stored as strings so exports are human-readable. */
export const isoDateSchema = z.string();

/** A 1–5 rating, or null when not yet rated. */
export const ratingSchema = z.number().int().min(1).max(5).nullable();

/** A dollar amount that may be unknown (null). Kept as a plain number otherwise. */
export const moneySchema = z.number().nullable();

/** Fields every stored entity carries. */
export const baseEntitySchema = z.object({
  id: idSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});

/** Who is responsible for a task. buyer1/buyer2 are displayed with configured names. */
export const ownerSchema = z.enum([
  "buyer1",
  "buyer2",
  "both",
  "agent",
  "attorney",
  "lender",
  "inspector",
  "other",
]);
export type Owner = z.infer<typeof ownerSchema>;

/** Priority levels for tasks. */
export const prioritySchema = z.enum(["low", "medium", "high"]);
export type Priority = z.infer<typeof prioritySchema>;

/** Task lifecycle status. */
export const taskStatusSchema = z.enum(["todo", "in-progress", "blocked", "done", "skipped"]);
export type TaskStatus = z.infer<typeof taskStatusSchema>;
