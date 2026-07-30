import type { Checklist } from "@/lib/models";
import { createChecklist } from "@/lib/repo";

/**
 * Household-added checklist items per journey stage, reusing the existing
 * Checklist/ChecklistTask tables (see Timeline) instead of a new schema.
 * Tagged via `category` so they never need a database migration — `kind`
 * stays "template" (the only value besides "timeline" the DB allows) and
 * `category` is unconstrained text.
 */
export const JOURNEY_CHECKLIST_CATEGORY_PREFIX = "journey:";

export function journeyChecklistCategory(stageId: string): string {
  return `${JOURNEY_CHECKLIST_CATEGORY_PREFIX}${stageId}`;
}

export function findStageChecklist(checklists: Checklist[], stageId: string): Checklist | undefined {
  return checklists.find((c) => c.category === journeyChecklistCategory(stageId));
}

/** Created lazily the first time a household adds a custom item to this stage. */
export async function ensureStageChecklist(stageId: string, stageTitle: string): Promise<Checklist> {
  return createChecklist({
    title: `${stageTitle} — your items`,
    kind: "template",
    category: journeyChecklistCategory(stageId),
    order: 0,
  });
}
