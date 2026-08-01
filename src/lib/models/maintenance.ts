import { z } from "zod";
import { baseEntitySchema, idSchema, isoDateSchema, moneySchema, prioritySchema } from "./common";

/**
 * A maintenance item's lifecycle status. Deliberately does NOT include
 * "upcoming"/"due" as persisted values — whether something is upcoming, due
 * soon, or overdue is purely a function of `dueDate` vs. today's date, and
 * this codebase has no cron/scheduled-job infrastructure that could flip a
 * stored status as time passes. That urgency is computed at render time
 * only — see `getMaintenanceUrgency` in lib/maintenance/schedule.ts.
 */
export const maintenanceStatusSchema = z.enum(["active", "completed", "skipped", "archived"]);
export type MaintenanceStatus = z.infer<typeof maintenanceStatusSchema>;

/**
 * One completion-history entry, embedded on the maintenance item (mirrors
 * the `deals.negotiationLog` embedded-jsonb-array precedent — no separate
 * "maintenance log" table). `noteId` optionally links to a real Note
 * (contextType "maintenanceItem") created via the shared notes system when
 * the user writes something in the completion form's "Note" field — the
 * structured fields here (date/what/cost/who) stay separate from that
 * freeform elaboration, so nothing duplicates the notes feature.
 */
export const maintenanceCompletionSchema = z.object({
  id: idSchema,
  completedDate: isoDateSchema,
  whatWasDone: z.string().default(""),
  cost: moneySchema.default(null),
  performedBy: z.string().default(""),
  noteId: z.string().nullable().default(null),
});
export type MaintenanceCompletion = z.infer<typeof maintenanceCompletionSchema>;

/**
 * A lightweight, recurring-or-one-time maintenance item. `recurrenceMonths`
 * is the only recurrence knob — a deterministic "every N months" (see
 * schedule.ts's addMonthsToISODate), never AI-inferred. `null` means
 * one-time.
 */
export const maintenanceItemSchema = baseEntitySchema.extend({
  title: z.string().min(1),
  areaOrSystem: z.string().default(""),
  description: z.string().default(""),
  status: maintenanceStatusSchema.default("active"),
  priority: prioritySchema.default("medium"),
  dueDate: z.string().nullable().default(null),
  recurrenceMonths: z.number().int().positive().nullable().default(null),
  lastCompletedDate: z.string().nullable().default(null),
  completionHistory: z.array(maintenanceCompletionSchema).default([]),
});
export type MaintenanceItem = z.infer<typeof maintenanceItemSchema>;

export const MAINTENANCE_ITEMS_TABLE = "maintenanceItems";
