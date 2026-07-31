import { z } from "zod";
import { baseEntitySchema, moneySchema, prioritySchema } from "./common";

export const repairStatusSchema = z.enum(["planned", "in-progress", "completed", "cancelled"]);
export type RepairStatus = z.infer<typeof repairStatusSchema>;

/**
 * A simple repair/project record — deliberately no dependencies, Gantt
 * charts, complex budgets, or team permissions (see CLAUDE.md's "avoid
 * project-management features"). Linked notes/documents go through the
 * existing polymorphic mechanisms (contextType "repairProject" /
 * documents.relatedRepairProjectId), not embedded fields here.
 */
export const repairProjectSchema = baseEntitySchema.extend({
  title: z.string().min(1),
  description: z.string().default(""),
  status: repairStatusSchema.default("planned"),
  priority: prioritySchema.default("medium"),
  startDate: z.string().nullable().default(null),
  completionDate: z.string().nullable().default(null),
  estimatedCost: moneySchema.default(null),
  actualCost: moneySchema.default(null),
  notes: z.string().default(""),
});
export type RepairProject = z.infer<typeof repairProjectSchema>;

export const REPAIR_PROJECTS_TABLE = "repairProjects";
