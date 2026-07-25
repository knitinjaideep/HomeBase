/**
 * Write helpers. Every mutation stamps `updatedAt` and persists immediately —
 * there is no explicit "save" step for stored records. New records are created
 * through the Zod schemas so defaults are always applied.
 */

import { getDb } from "./db";
import { newId, now } from "./util";
import {
  attendingTransitionSchema,
  checklistSchema,
  checklistTaskSchema,
  dealSchema,
  documentRecordSchema,
  journeyActionStateSchema,
  journeyDecisionSchema,
  journeyStageStateSchema,
  lenderQuoteSchema,
  mortgageApprovalSchema,
  mortgageScenarioSchema,
  professionalSchema,
  propertySchema,
  propertyVisitSchema,
  resourceSchema,
  townResearchSchema,
  type AppSettings,
  type AttendingTransition,
  type Checklist,
  type ChecklistTask,
  type Deal,
  type DocumentRecord,
  type FinancialProfile,
  type HomePreferences,
  type HouseholdProfile,
  type JourneyActionState,
  type JourneyDecision,
  type JourneyStageState,
  type JourneyStatus,
  type LenderQuote,
  type MortgageApproval,
  type MortgageScenario,
  type Professional,
  type Property,
  type PropertyVisit,
  type Resource,
  type TownResearch,
  SINGLETON_ID,
} from "./models";

// ---- Singletons -----------------------------------------------------------

export async function updateHousehold(patch: Partial<HouseholdProfile>): Promise<void> {
  await getDb().householdProfile.update(SINGLETON_ID, { ...patch, updatedAt: now() });
}
export async function updateFinancial(patch: Partial<FinancialProfile>): Promise<void> {
  await getDb().financialProfile.update(SINGLETON_ID, { ...patch, updatedAt: now() });
}
export async function updatePreferences(patch: Partial<HomePreferences>): Promise<void> {
  await getDb().homePreferences.update(SINGLETON_ID, { ...patch, updatedAt: now() });
}
export async function updateSettings(patch: Partial<AppSettings>): Promise<void> {
  await getDb().appSettings.update(SINGLETON_ID, { ...patch, updatedAt: now() });
}

// ---- Properties -----------------------------------------------------------

/** Build a full Property from partial input, applying schema defaults. */
export function newProperty(input: Partial<Property> & { address: string }): Property {
  const ts = now();
  return propertySchema.parse({
    id: newId(),
    createdAt: ts,
    updatedAt: ts,
    dateAdded: ts.slice(0, 10),
    schools: {},
    ratings: {},
    finance: {},
    ...input,
  });
}

export async function createProperty(
  input: Partial<Property> & { address: string },
): Promise<Property> {
  const property = newProperty(input);
  await getDb().properties.put(property);
  return property;
}

export async function saveProperty(property: Property): Promise<void> {
  await getDb().properties.put({ ...property, updatedAt: now() });
}

export async function updateProperty(id: string, patch: Partial<Property>): Promise<void> {
  await getDb().properties.update(id, { ...patch, updatedAt: now() });
}

export async function archiveProperty(id: string): Promise<void> {
  await getDb().properties.update(id, { isArchived: true, archivedAt: now(), updatedAt: now() });
}

export async function restoreProperty(id: string): Promise<void> {
  await getDb().properties.update(id, { isArchived: false, archivedAt: null, updatedAt: now() });
}

export async function deleteProperty(id: string): Promise<void> {
  const db = getDb();
  await db.transaction("rw", [db.properties, db.visits], async () => {
    await db.visits.where("propertyId").equals(id).delete();
    await db.properties.delete(id);
  });
}

export async function removeSampleProperties(): Promise<number> {
  const db = getDb();
  const samples = await db.properties.filter((p) => p.isSample).toArray();
  await db.transaction("rw", [db.properties, db.visits], async () => {
    for (const s of samples) {
      await db.visits.where("propertyId").equals(s.id).delete();
      await db.properties.delete(s.id);
    }
  });
  return samples.length;
}

// ---- Visits ---------------------------------------------------------------

export function newVisit(propertyId: string): PropertyVisit {
  const ts = now();
  return propertyVisitSchema.parse({
    id: newId(),
    createdAt: ts,
    updatedAt: ts,
    propertyId,
    visitDate: ts.slice(0, 10),
    buyer1Review: {},
    buyer2Review: {},
  });
}

export async function saveVisit(visit: PropertyVisit): Promise<void> {
  await getDb().visits.put({ ...visit, updatedAt: now() });
}

export async function deleteVisit(id: string): Promise<void> {
  await getDb().visits.delete(id);
}

// ---- Scenarios ------------------------------------------------------------

export async function createScenario(
  input: Omit<MortgageScenario, "id" | "createdAt" | "updatedAt">,
): Promise<MortgageScenario> {
  const ts = now();
  const scenario = mortgageScenarioSchema.parse({ ...input, id: newId(), createdAt: ts, updatedAt: ts });
  await getDb().scenarios.put(scenario);
  return scenario;
}

export async function saveScenario(scenario: MortgageScenario): Promise<void> {
  await getDb().scenarios.put({ ...scenario, updatedAt: now() });
}

export async function duplicateScenario(id: string): Promise<void> {
  const original = await getDb().scenarios.get(id);
  if (!original) return;
  const ts = now();
  await getDb().scenarios.put({
    ...original,
    id: newId(),
    name: `${original.name} (copy)`,
    createdAt: ts,
    updatedAt: ts,
  });
}

export async function deleteScenario(id: string): Promise<void> {
  await getDb().scenarios.delete(id);
}

// ---- Lender quotes --------------------------------------------------------

export async function createLenderQuote(
  input: Partial<LenderQuote> & { lender: string },
): Promise<LenderQuote> {
  const ts = now();
  const quote = lenderQuoteSchema.parse({ ...input, id: newId(), createdAt: ts, updatedAt: ts });
  await getDb().lenderQuotes.put(quote);
  return quote;
}

export async function saveLenderQuote(quote: LenderQuote): Promise<void> {
  await getDb().lenderQuotes.put({ ...quote, updatedAt: now() });
}

export async function deleteLenderQuote(id: string): Promise<void> {
  await getDb().lenderQuotes.delete(id);
}

// ---- Checklists & tasks ---------------------------------------------------

export async function createChecklist(
  input: Partial<Checklist> & { title: string },
): Promise<Checklist> {
  const ts = now();
  const checklist = checklistSchema.parse({ ...input, id: newId(), createdAt: ts, updatedAt: ts });
  await getDb().checklists.put(checklist);
  return checklist;
}

export async function deleteChecklist(id: string): Promise<void> {
  const db = getDb();
  await db.transaction("rw", [db.checklists, db.tasks], async () => {
    await db.tasks.where("checklistId").equals(id).delete();
    await db.checklists.delete(id);
  });
}

export async function addTask(
  input: Partial<ChecklistTask> & { checklistId: string; title: string },
): Promise<ChecklistTask> {
  const ts = now();
  const task = checklistTaskSchema.parse({ ...input, id: newId(), createdAt: ts, updatedAt: ts });
  await getDb().tasks.put(task);
  return task;
}

export async function updateTask(id: string, patch: Partial<ChecklistTask>): Promise<void> {
  await getDb().tasks.update(id, { ...patch, updatedAt: now() });
}

export async function deleteTask(id: string): Promise<void> {
  await getDb().tasks.delete(id);
}

/** Clone a template checklist and its tasks into a fresh working copy. */
export async function cloneChecklist(id: string): Promise<void> {
  const db = getDb();
  const source = await db.checklists.get(id);
  if (!source) return;
  const sourceTasks = await db.tasks.where("checklistId").equals(id).toArray();
  const ts = now();
  const newChecklistId = newId();
  await db.transaction("rw", [db.checklists, db.tasks], async () => {
    await db.checklists.put({
      ...source,
      id: newChecklistId,
      title: `${source.title} (copy)`,
      createdAt: ts,
      updatedAt: ts,
    });
    for (const t of sourceTasks) {
      await db.tasks.put({
        ...t,
        id: newId(),
        checklistId: newChecklistId,
        status: "todo",
        createdAt: ts,
        updatedAt: ts,
      });
    }
  });
}

// ---- Towns ----------------------------------------------------------------

export async function createTown(input: Partial<TownResearch> & { name: string }): Promise<TownResearch> {
  const ts = now();
  const town = townResearchSchema.parse({ ...input, id: newId(), createdAt: ts, updatedAt: ts });
  await getDb().towns.put(town);
  return town;
}

export async function saveTown(town: TownResearch): Promise<void> {
  await getDb().towns.put({ ...town, updatedAt: now() });
}

export async function deleteTown(id: string): Promise<void> {
  await getDb().towns.delete(id);
}

// ---- Journey --------------------------------------------------------------

/**
 * Journey state rows are keyed by the *content* id (e.g. "strategy" or
 * "strategy.confirm-target-period") rather than a generated uuid, so editing
 * the guide's wording never orphans a household's progress.
 */

export async function setStageState(
  stageId: string,
  patch: Partial<JourneyStageState>,
): Promise<void> {
  const db = getDb();
  const existing = await db.journeyStages.get(stageId);
  const ts = now();
  if (existing) {
    await db.journeyStages.update(stageId, { ...patch, updatedAt: ts });
    return;
  }
  await db.journeyStages.put(
    journeyStageStateSchema.parse({ id: stageId, createdAt: ts, updatedAt: ts, ...patch }),
  );
}

export async function setActionState(
  actionId: string,
  stageId: string,
  patch: Partial<JourneyActionState>,
): Promise<void> {
  const db = getDb();
  const existing = await db.journeyActions.get(actionId);
  const ts = now();
  // Stamp the completion date the first time an action reaches "completed".
  const completion =
    patch.status === "completed"
      ? { completedAt: existing?.completedAt ?? ts }
      : patch.status !== undefined
        ? { completedAt: null }
        : {};

  if (existing) {
    await db.journeyActions.update(actionId, { ...patch, ...completion, updatedAt: ts });
    return;
  }
  await db.journeyActions.put(
    journeyActionStateSchema.parse({
      id: actionId,
      stageId,
      createdAt: ts,
      updatedAt: ts,
      ...patch,
      ...completion,
    }),
  );
}

/** Advance an action through its status without opening the editor. */
export async function cycleActionStatus(
  actionId: string,
  stageId: string,
  current: JourneyStatus,
): Promise<void> {
  const next: JourneyStatus =
    current === "completed" ? "not-started" : current === "in-progress" ? "completed" : "in-progress";
  await setActionState(actionId, stageId, { status: next });
}

export async function saveDecision(
  decisionId: string,
  stageId: string,
  patch: Partial<JourneyDecision>,
): Promise<void> {
  const db = getDb();
  const existing = await db.journeyDecisions.get(decisionId);
  const ts = now();
  if (existing) {
    await db.journeyDecisions.update(decisionId, { ...patch, updatedAt: ts });
    return;
  }
  await db.journeyDecisions.put(
    journeyDecisionSchema.parse({ id: decisionId, stageId, createdAt: ts, updatedAt: ts, ...patch }),
  );
}

export async function updateAttendingTransition(
  patch: Partial<AttendingTransition>,
): Promise<void> {
  const db = getDb();
  const existing = await db.attendingTransition.get(SINGLETON_ID);
  const ts = now();
  if (existing) {
    await db.attendingTransition.update(SINGLETON_ID, { ...patch, updatedAt: ts });
    return;
  }
  await db.attendingTransition.put(
    attendingTransitionSchema.parse({ id: SINGLETON_ID, createdAt: ts, updatedAt: ts, ...patch }),
  );
}

// ---- Mortgage approvals ---------------------------------------------------

export async function createApproval(
  input: Partial<MortgageApproval> & { lender: string },
): Promise<MortgageApproval> {
  const ts = now();
  const approval = mortgageApprovalSchema.parse({ ...input, id: newId(), createdAt: ts, updatedAt: ts });
  await getDb().mortgageApprovals.put(approval);
  return approval;
}

export async function saveApproval(approval: MortgageApproval): Promise<void> {
  await getDb().mortgageApprovals.put({ ...approval, updatedAt: now() });
}

export async function updateApproval(id: string, patch: Partial<MortgageApproval>): Promise<void> {
  await getDb().mortgageApprovals.update(id, { ...patch, updatedAt: now() });
}

export async function deleteApproval(id: string): Promise<void> {
  await getDb().mortgageApprovals.delete(id);
}

// ---- Professionals --------------------------------------------------------

export async function createProfessional(
  input: Partial<Professional> & { name: string },
): Promise<Professional> {
  const ts = now();
  const professional = professionalSchema.parse({ ...input, id: newId(), createdAt: ts, updatedAt: ts });
  await getDb().professionals.put(professional);
  return professional;
}

export async function saveProfessional(professional: Professional): Promise<void> {
  await getDb().professionals.put({ ...professional, updatedAt: now() });
}

export async function updateProfessional(id: string, patch: Partial<Professional>): Promise<void> {
  await getDb().professionals.update(id, { ...patch, updatedAt: now() });
}

export async function deleteProfessional(id: string): Promise<void> {
  await getDb().professionals.delete(id);
}

/**
 * Mark one professional as selected for a role. Others in the same role move to
 * "not-selected" rather than being deleted — the comparison stays on the record.
 */
export async function selectProfessional(id: string): Promise<void> {
  const db = getDb();
  const chosen = await db.professionals.get(id);
  if (!chosen) return;
  const ts = now();
  const peers = await db.professionals.where("role").equals(chosen.role).toArray();
  await db.transaction("rw", [db.professionals], async () => {
    for (const p of peers) {
      if (p.id === id) continue;
      if (p.selectionStatus !== "selected") continue;
      await db.professionals.update(p.id, { selectionStatus: "not-selected", updatedAt: ts });
    }
    await db.professionals.update(id, {
      selectionStatus: "selected",
      selectedAt: ts,
      updatedAt: ts,
    });
  });
}

// ---- Resources ------------------------------------------------------------

export async function createResource(
  input: Partial<Resource> & { title: string },
): Promise<Resource> {
  const ts = now();
  const resource = resourceSchema.parse({
    dateAdded: ts.slice(0, 10),
    ...input,
    id: newId(),
    createdAt: ts,
    updatedAt: ts,
  });
  await getDb().resources.put(resource);
  return resource;
}

export async function saveResource(resource: Resource): Promise<void> {
  await getDb().resources.put({ ...resource, updatedAt: now() });
}

export async function updateResource(id: string, patch: Partial<Resource>): Promise<void> {
  await getDb().resources.update(id, { ...patch, updatedAt: now() });
}

export async function deleteResource(id: string): Promise<void> {
  await getDb().resources.delete(id);
}

/**
 * Restore any seeded resources the household has deleted, back to their shipped
 * state. Only re-adds missing ones (matched by URL) — it never overwrites edits
 * the household made to a resource they kept.
 */
export async function restoreSeededResources(): Promise<number> {
  const { seedResources } = await import("./seed/resources");
  const db = getDb();
  const existing = await db.resources.toArray();
  const haveUrls = new Set(existing.map((r) => r.url));
  const missing = seedResources(now()).filter((r) => !haveUrls.has(r.url));
  if (missing.length > 0) await db.resources.bulkPut(missing);
  return missing.length;
}

/** "Report outdated link" — flags it for review without losing the reference. */
export async function reportResourceOutdated(id: string, note: string): Promise<void> {
  const existing = await getDb().resources.get(id);
  if (!existing) return;
  const stamp = `Reported outdated ${now().slice(0, 10)}${note ? `: ${note}` : "."}`;
  await updateResource(id, {
    status: "outdated",
    notes: existing.notes ? `${existing.notes}\n${stamp}` : stamp,
  });
}

// ---- Documents ------------------------------------------------------------

export async function createDocument(
  input: Partial<DocumentRecord> & { name: string },
): Promise<DocumentRecord> {
  const ts = now();
  const doc = documentRecordSchema.parse({ ...input, id: newId(), createdAt: ts, updatedAt: ts });
  await getDb().documents.put(doc);
  return doc;
}

export async function updateDocument(id: string, patch: Partial<DocumentRecord>): Promise<void> {
  await getDb().documents.update(id, { ...patch, updatedAt: now() });
}

export async function deleteDocument(id: string): Promise<void> {
  await getDb().documents.delete(id);
}

// ---- Deals (per-property, stages 12–18) -----------------------------------

/** Fetch the deal for a property, creating an empty one on first use. */
export async function ensureDeal(propertyId: string): Promise<Deal> {
  const db = getDb();
  const existing = await db.deals.where("propertyId").equals(propertyId).first();
  if (existing) return existing;
  const ts = now();
  const deal = dealSchema.parse({ id: newId(), propertyId, createdAt: ts, updatedAt: ts });
  await db.deals.put(deal);
  return deal;
}

export async function saveDeal(deal: Deal): Promise<void> {
  await getDb().deals.put({ ...deal, updatedAt: now() });
}

export async function updateDeal(propertyId: string, patch: Partial<Deal>): Promise<void> {
  const deal = await ensureDeal(propertyId);
  await getDb().deals.put({ ...deal, ...patch, updatedAt: now() });
}

export async function deleteDeal(id: string): Promise<void> {
  await getDb().deals.delete(id);
}
