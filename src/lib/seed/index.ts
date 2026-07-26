import type { HomeScopeDB } from "@/lib/db";
import {
  attendingTransitionSchema,
  townResearchSchema,
  SINGLETON_ID,
  type AttendingTransition,
  type Checklist,
  type ChecklistTask,
  type TownResearch,
} from "@/lib/models";
import { newId, now } from "@/lib/util";
import { seedProperties } from "./properties";
import {
  seedAppSettings,
  seedFinancialProfile,
  seedHomePreferences,
  seedHouseholdProfile,
} from "./profile";
import { TIMELINE_PHASES } from "./timeline";
import { CHECKLIST_TEMPLATES } from "./checklists";
import { seedResources } from "./resources";

export { seedProperties } from "./properties";
export {
  seedAppSettings,
  seedFinancialProfile,
  seedHomePreferences,
  seedHouseholdProfile,
} from "./profile";
export { seedResources, SEED_RESOURCES } from "./resources";

export function buildTimeline(ts: string): { checklists: Checklist[]; tasks: ChecklistTask[] } {
  const checklists: Checklist[] = [];
  const tasks: ChecklistTask[] = [];

  TIMELINE_PHASES.forEach((phase, phaseIndex) => {
    const checklistId = newId();
    checklists.push({
      id: checklistId,
      createdAt: ts,
      updatedAt: ts,
      title: phase.title,
      kind: "timeline",
      phaseStart: phase.phaseStart,
      phaseEnd: phase.phaseEnd,
      description: "",
      category: "timeline",
      order: phaseIndex,
    });
    phase.tasks.forEach((task, taskIndex) => {
      tasks.push({
        id: newId(),
        createdAt: ts,
        updatedAt: ts,
        checklistId,
        title: task.title,
        status: "todo",
        dueDate: `${phase.phaseStart}-01`,
        owner: task.owner ?? "both",
        priority: task.priority ?? "medium",
        notes: "",
        relatedPropertyId: null,
        order: taskIndex,
      });
    });
  });

  return { checklists, tasks };
}

export function buildTemplates(ts: string): { checklists: Checklist[]; tasks: ChecklistTask[] } {
  const checklists: Checklist[] = [];
  const tasks: ChecklistTask[] = [];

  CHECKLIST_TEMPLATES.forEach((tpl, tplIndex) => {
    const checklistId = newId();
    checklists.push({
      id: checklistId,
      createdAt: ts,
      updatedAt: ts,
      title: tpl.title,
      kind: "template",
      phaseStart: null,
      phaseEnd: null,
      description: tpl.description ?? "",
      category: tpl.category,
      order: tplIndex,
    });
    tpl.tasks.forEach((title, taskIndex) => {
      tasks.push({
        id: newId(),
        createdAt: ts,
        updatedAt: ts,
        checklistId,
        title,
        status: "todo",
        dueDate: null,
        owner: "both",
        priority: "medium",
        notes: "",
        relatedPropertyId: null,
        order: taskIndex,
      });
    });
  });

  return { checklists, tasks };
}

export function buildTowns(ts: string): TownResearch[] {
  // Seeded as "considering" — the guide requires an in-person research visit
  // before a town may be promoted to Primary (journey stage 9).
  const names = ["Princeton", "Summit", "Ridgewood", "Livingston", "Short Hills"];
  return names.map((name) =>
    townResearchSchema.parse({
      id: newId(),
      createdAt: ts,
      updatedAt: ts,
      name,
      designation: "considering",
      schoolSource: "Not yet verified",
    }),
  );
}

export function buildAttendingTransition(ts: string): AttendingTransition {
  return attendingTransitionSchema.parse({
    id: SINGLETON_ID,
    createdAt: ts,
    updatedAt: ts,
    searchStatus: "not-started",
    salaryIsEstimate: true,
    lenderIncomeTreatment: "not-yet-asked",
    notes: "",
  });
}

/**
 * Populate an empty database with the household's plan, sample properties, the
 * timeline, and reusable checklists. Idempotent: it only runs when there is no
 * seeded AppSettings row, so it never overwrites real data.
 */
export async function ensureSeeded(db: HomeScopeDB): Promise<void> {
  const existing = await db.appSettings.toArray();
  if (existing.length > 0 && existing[0].seeded) return;

  const ts = now();
  const timeline = buildTimeline(ts);
  const templates = buildTemplates(ts);

  await db.transaction(
    "rw",
    [
      db.householdProfile,
      db.financialProfile,
      db.homePreferences,
      db.appSettings,
      db.properties,
      db.checklists,
      db.tasks,
      db.towns,
      db.attendingTransition,
      db.resources,
    ],
    async () => {
      await db.householdProfile.put(seedHouseholdProfile(ts));
      await db.financialProfile.put(seedFinancialProfile(ts));
      await db.homePreferences.put(seedHomePreferences(ts));
      await db.appSettings.put(seedAppSettings(ts));
      await db.properties.bulkPut(seedProperties());
      await db.checklists.bulkPut([...timeline.checklists, ...templates.checklists]);
      await db.tasks.bulkPut([...timeline.tasks, ...templates.tasks]);
      await db.towns.bulkPut(buildTowns(ts));
      await db.attendingTransition.put(buildAttendingTransition(ts));
      await db.resources.bulkPut(seedResources(ts));
    },
  );
}
