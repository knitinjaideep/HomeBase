/**
 * Write helpers, Supabase-backed. Every mutation writes straight to Postgres
 * (Row Level Security enforces that it can only touch the caller's own
 * household — see `supabase/migrations/0003_policies.sql`) and then calls
 * `invalidateTable()` so every mounted component reading that table
 * refetches. New records are still built through the Zod schemas so
 * defaults are always applied, exactly as before.
 *
 * `getCurrentHouseholdId()` reads the household id set once by
 * `HouseholdProvider` after sign-in — the same lazy-singleton pattern this
 * file already used for `getDb()` before the Supabase migration, just for
 * the current household instead of the local database handle.
 */

import { createClient } from "./supabase/client";
import { getCurrentHouseholdId } from "./household/current";
import { invalidateTable, invalidateTables } from "./data/invalidation";
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
  noteSchema,
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
  type Note,
  type Professional,
  type Property,
  type PropertyVisit,
  type Resource,
  type TownResearch,
} from "./models";

const sb = () => createClient();

async function insertRow<T extends object>(table: string, row: T): Promise<T> {
  const householdId = getCurrentHouseholdId();
  const { error } = await sb()
    .from(table)
    .insert({ ...row, householdId });
  if (error) throw new Error(error.message);
  invalidateTable(table);
  return row;
}

async function insertRows<T extends object>(table: string, rows: T[]): Promise<T[]> {
  if (rows.length === 0) return rows;
  const householdId = getCurrentHouseholdId();
  const { error } = await sb()
    .from(table)
    .insert(rows.map((row) => ({ ...row, householdId })));
  if (error) throw new Error(error.message);
  invalidateTable(table);
  return rows;
}

/** Insert-or-replace by id — mirrors the old Dexie `.put()` used throughout. */
async function upsertRow<T extends { id: string }>(table: string, row: T): Promise<void> {
  const householdId = getCurrentHouseholdId();
  const { error } = await sb()
    .from(table)
    .upsert({ ...row, householdId, updatedAt: now() }, { onConflict: "id" });
  if (error) throw new Error(error.message);
  invalidateTable(table);
}

async function patchRow(table: string, id: string, patch: Record<string, unknown>): Promise<void> {
  const householdId = getCurrentHouseholdId();
  const { error } = await sb().from(table).update(patch).eq("householdId", householdId).eq("id", id);
  if (error) throw new Error(error.message);
  invalidateTable(table);
}

async function patchSingleton(table: string, patch: Record<string, unknown>): Promise<void> {
  const householdId = getCurrentHouseholdId();
  const { error } = await sb().from(table).update(patch).eq("householdId", householdId);
  if (error) throw new Error(error.message);
  invalidateTable(table);
}

async function removeRow(table: string, id: string): Promise<void> {
  const householdId = getCurrentHouseholdId();
  const { error } = await sb().from(table).delete().eq("householdId", householdId).eq("id", id);
  if (error) throw new Error(error.message);
  invalidateTable(table);
}

// ---- Singletons -------------------------------------------------------

export async function updateHousehold(patch: Partial<HouseholdProfile>): Promise<void> {
  await patchSingleton("buyerProfile", patch);
}
export async function updateFinancial(patch: Partial<FinancialProfile>): Promise<void> {
  await patchSingleton("financialProfile", patch);
}
export async function updatePreferences(patch: Partial<HomePreferences>): Promise<void> {
  await patchSingleton("homePreferences", patch);
}
export async function updateSettings(patch: Partial<AppSettings>): Promise<void> {
  await patchSingleton("appSettings", patch);
}

// ---- Properties -------------------------------------------------------

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
  await insertRow("properties", property);
  return property;
}

export async function saveProperty(property: Property): Promise<void> {
  await upsertRow("properties", property);
}

export async function updateProperty(id: string, patch: Partial<Property>): Promise<void> {
  await patchRow("properties", id, patch);
}

export async function archiveProperty(id: string): Promise<void> {
  await patchRow("properties", id, { isArchived: true, archivedAt: now() });
}

export async function restoreProperty(id: string): Promise<void> {
  await patchRow("properties", id, { isArchived: false, archivedAt: null });
}

/** Property deletion cascades to its visits and deal at the database level. */
export async function deleteProperty(id: string): Promise<void> {
  await removeRow("properties", id);
  invalidateTables(["propertyVisits", "deals"]);
}

export async function removeSampleProperties(): Promise<number> {
  const householdId = getCurrentHouseholdId();
  const { data, error } = await sb()
    .from("properties")
    .delete()
    .eq("householdId", householdId)
    .eq("isSample", true)
    .select("id");
  if (error) throw new Error(error.message);
  invalidateTables(["properties", "propertyVisits", "deals"]);
  return (data ?? []).length;
}

// ---- Visits -------------------------------------------------------------

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
  await upsertRow("propertyVisits", visit);
}

export async function deleteVisit(id: string): Promise<void> {
  await removeRow("propertyVisits", id);
}

// ---- Scenarios ------------------------------------------------------------

export async function createScenario(
  input: Omit<MortgageScenario, "id" | "createdAt" | "updatedAt">,
): Promise<MortgageScenario> {
  const ts = now();
  const scenario = mortgageScenarioSchema.parse({ ...input, id: newId(), createdAt: ts, updatedAt: ts });
  await insertRow("mortgageScenarios", scenario);
  return scenario;
}

export async function saveScenario(scenario: MortgageScenario): Promise<void> {
  await upsertRow("mortgageScenarios", scenario);
}

export async function duplicateScenario(id: string): Promise<void> {
  const householdId = getCurrentHouseholdId();
  const { data, error } = await sb()
    .from("mortgageScenarios")
    .select("*")
    .eq("householdId", householdId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return;
  const original = mortgageScenarioSchema.parse(data);
  const ts = now();
  await insertRow("mortgageScenarios", {
    ...original,
    id: newId(),
    name: `${original.name} (copy)`,
    createdAt: ts,
    updatedAt: ts,
  });
}

export async function deleteScenario(id: string): Promise<void> {
  await removeRow("mortgageScenarios", id);
}

// ---- Lender quotes --------------------------------------------------------

export async function createLenderQuote(
  input: Partial<LenderQuote> & { lender: string },
): Promise<LenderQuote> {
  const ts = now();
  const quote = lenderQuoteSchema.parse({ ...input, id: newId(), createdAt: ts, updatedAt: ts });
  await insertRow("lenderQuotes", quote);
  return quote;
}

export async function saveLenderQuote(quote: LenderQuote): Promise<void> {
  await upsertRow("lenderQuotes", quote);
}

export async function deleteLenderQuote(id: string): Promise<void> {
  await removeRow("lenderQuotes", id);
}

// ---- Checklists & tasks ---------------------------------------------------

export async function createChecklist(
  input: Partial<Checklist> & { title: string },
): Promise<Checklist> {
  const ts = now();
  const checklist = checklistSchema.parse({ ...input, id: newId(), createdAt: ts, updatedAt: ts });
  await insertRow("checklists", checklist);
  return checklist;
}

/** Deleting a checklist cascades to its tasks at the database level. */
export async function deleteChecklist(id: string): Promise<void> {
  await removeRow("checklists", id);
  invalidateTable("checklistTasks");
}

export async function addTask(
  input: Partial<ChecklistTask> & { checklistId: string; title: string },
): Promise<ChecklistTask> {
  const ts = now();
  const task = checklistTaskSchema.parse({ ...input, id: newId(), createdAt: ts, updatedAt: ts });
  await insertRow("checklistTasks", task);
  return task;
}

export async function updateTask(id: string, patch: Partial<ChecklistTask>): Promise<void> {
  await patchRow("checklistTasks", id, patch);
}

export async function deleteTask(id: string): Promise<void> {
  await removeRow("checklistTasks", id);
}

/** Clone a template checklist and its tasks into a fresh working copy. */
export async function cloneChecklist(id: string): Promise<void> {
  const householdId = getCurrentHouseholdId();
  const client = sb();

  const { data: sourceRow, error: sourceError } = await client
    .from("checklists")
    .select("*")
    .eq("householdId", householdId)
    .eq("id", id)
    .maybeSingle();
  if (sourceError) throw new Error(sourceError.message);
  if (!sourceRow) return;
  const source = checklistSchema.parse(sourceRow);

  const { data: taskRows, error: tasksError } = await client
    .from("checklistTasks")
    .select("*")
    .eq("householdId", householdId)
    .eq("checklistId", id);
  if (tasksError) throw new Error(tasksError.message);
  const sourceTasks = checklistTaskSchema.array().parse(taskRows ?? []);

  const ts = now();
  const newChecklistId = newId();

  await insertRow("checklists", {
    ...source,
    id: newChecklistId,
    title: `${source.title} (copy)`,
    createdAt: ts,
    updatedAt: ts,
  });
  await insertRows(
    "checklistTasks",
    sourceTasks.map((t) => ({
      ...t,
      id: newId(),
      checklistId: newChecklistId,
      status: "todo" as const,
      createdAt: ts,
      updatedAt: ts,
    })),
  );
}

// ---- Towns ----------------------------------------------------------------

export async function createTown(input: Partial<TownResearch> & { name: string }): Promise<TownResearch> {
  const ts = now();
  const town = townResearchSchema.parse({ ...input, id: newId(), createdAt: ts, updatedAt: ts });
  await insertRow("towns", town);
  return town;
}

export async function saveTown(town: TownResearch): Promise<void> {
  await upsertRow("towns", town);
}

export async function deleteTown(id: string): Promise<void> {
  await removeRow("towns", id);
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
  const householdId = getCurrentHouseholdId();
  const { data: existing, error: readError } = await sb()
    .from("journeyStages")
    .select("id")
    .eq("householdId", householdId)
    .eq("id", stageId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  const ts = now();
  if (existing) {
    await patchRow("journeyStages", stageId, patch);
    return;
  }
  await insertRow(
    "journeyStages",
    journeyStageStateSchema.parse({ id: stageId, createdAt: ts, updatedAt: ts, ...patch }),
  );
}

export async function setActionState(
  actionId: string,
  stageId: string,
  patch: Partial<JourneyActionState>,
): Promise<void> {
  const householdId = getCurrentHouseholdId();
  const { data: existingRow, error: readError } = await sb()
    .from("journeyActions")
    .select("*")
    .eq("householdId", householdId)
    .eq("id", actionId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  const existing = existingRow ? journeyActionStateSchema.parse(existingRow) : null;
  const ts = now();
  // Stamp the completion date the first time an action reaches "completed".
  const completion =
    patch.status === "completed"
      ? { completedAt: existing?.completedAt ?? ts }
      : patch.status !== undefined
        ? { completedAt: null }
        : {};

  if (existing) {
    await patchRow("journeyActions", actionId, { ...patch, ...completion });
    return;
  }
  await insertRow(
    "journeyActions",
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
  const householdId = getCurrentHouseholdId();
  const { data: existing, error: readError } = await sb()
    .from("journeyDecisions")
    .select("id")
    .eq("householdId", householdId)
    .eq("id", decisionId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  const ts = now();
  if (existing) {
    await patchRow("journeyDecisions", decisionId, patch);
    return;
  }
  await insertRow(
    "journeyDecisions",
    journeyDecisionSchema.parse({ id: decisionId, stageId, createdAt: ts, updatedAt: ts, ...patch }),
  );
}

export async function updateAttendingTransition(patch: Partial<AttendingTransition>): Promise<void> {
  const householdId = getCurrentHouseholdId();
  const { data: existing, error: readError } = await sb()
    .from("attendingTransition")
    .select("id")
    .eq("householdId", householdId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  const ts = now();
  if (existing) {
    await patchSingleton("attendingTransition", patch);
    return;
  }
  await insertRow(
    "attendingTransition",
    attendingTransitionSchema.parse({ id: newId(), createdAt: ts, updatedAt: ts, ...patch }),
  );
}

// ---- Mortgage approvals ---------------------------------------------------

export async function createApproval(
  input: Partial<MortgageApproval> & { lender: string },
): Promise<MortgageApproval> {
  const ts = now();
  const approval = mortgageApprovalSchema.parse({ ...input, id: newId(), createdAt: ts, updatedAt: ts });
  await insertRow("mortgageApprovals", approval);
  return approval;
}

export async function saveApproval(approval: MortgageApproval): Promise<void> {
  await upsertRow("mortgageApprovals", approval);
}

export async function updateApproval(id: string, patch: Partial<MortgageApproval>): Promise<void> {
  await patchRow("mortgageApprovals", id, patch);
}

export async function deleteApproval(id: string): Promise<void> {
  await removeRow("mortgageApprovals", id);
}

// ---- Professionals --------------------------------------------------------

export async function createProfessional(
  input: Partial<Professional> & { name: string },
): Promise<Professional> {
  const ts = now();
  const professional = professionalSchema.parse({ ...input, id: newId(), createdAt: ts, updatedAt: ts });
  await insertRow("professionals", professional);
  return professional;
}

export async function saveProfessional(professional: Professional): Promise<void> {
  await upsertRow("professionals", professional);
}

export async function updateProfessional(id: string, patch: Partial<Professional>): Promise<void> {
  await patchRow("professionals", id, patch);
}

export async function deleteProfessional(id: string): Promise<void> {
  await removeRow("professionals", id);
}

/**
 * Mark one professional as selected for a role. Others in the same role move to
 * "not-selected" rather than being deleted — the comparison stays on the record.
 */
export async function selectProfessional(id: string): Promise<void> {
  const householdId = getCurrentHouseholdId();
  const client = sb();
  const { data: chosenRow, error: readError } = await client
    .from("professionals")
    .select("*")
    .eq("householdId", householdId)
    .eq("id", id)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!chosenRow) return;
  const chosen = professionalSchema.parse(chosenRow);
  const ts = now();

  const { error: demoteError } = await client
    .from("professionals")
    .update({ selectionStatus: "not-selected" })
    .eq("householdId", householdId)
    .eq("role", chosen.role)
    .eq("selectionStatus", "selected")
    .neq("id", id);
  if (demoteError) throw new Error(demoteError.message);

  await patchRow("professionals", id, { selectionStatus: "selected", selectedAt: ts });
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
  await insertRow("resources", resource);
  return resource;
}

export async function saveResource(resource: Resource): Promise<void> {
  await upsertRow("resources", resource);
}

export async function updateResource(id: string, patch: Partial<Resource>): Promise<void> {
  await patchRow("resources", id, patch);
}

export async function deleteResource(id: string): Promise<void> {
  await removeRow("resources", id);
}

/**
 * Restore any seeded resources the household has deleted, back to their shipped
 * state. Only re-adds missing ones (matched by URL) — it never overwrites edits
 * the household made to a resource they kept.
 */
export async function restoreSeededResources(): Promise<number> {
  const { seedResources } = await import("./seed/resources");
  const householdId = getCurrentHouseholdId();
  const { data, error } = await sb().from("resources").select("url").eq("householdId", householdId);
  if (error) throw new Error(error.message);
  const haveUrls = new Set((data ?? []).map((r: { url: string }) => r.url));
  const missing = seedResources(now()).filter((r) => !haveUrls.has(r.url));
  if (missing.length > 0) await insertRows("resources", missing);
  return missing.length;
}

/** "Report outdated link" — flags it for review without losing the reference. */
export async function reportResourceOutdated(id: string, note: string): Promise<void> {
  const householdId = getCurrentHouseholdId();
  const { data: existing, error } = await sb()
    .from("resources")
    .select("notes")
    .eq("householdId", householdId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
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
  await insertRow("documents", doc);
  return doc;
}

export async function updateDocument(id: string, patch: Partial<DocumentRecord>): Promise<void> {
  await patchRow("documents", id, patch);
}

export async function deleteDocument(id: string): Promise<void> {
  await removeRow("documents", id);
}

// ---- Notes (shared across buyer and homeowner mode) -----------------------

export async function createNote(input: Partial<Note> & { body: string }): Promise<Note> {
  const ts = now();
  const note = noteSchema.parse({ ...input, id: newId(), createdAt: ts, updatedAt: ts });
  await insertRow("notes", note);
  return note;
}

export async function updateNote(id: string, patch: Partial<Note>): Promise<void> {
  await patchRow("notes", id, patch);
}

export async function deleteNote(id: string): Promise<void> {
  await removeRow("notes", id);
}

// ---- Deals (per-property, stages 12–18) -----------------------------------

/** Fetch the deal for a property, creating an empty one on first use. */
export async function ensureDeal(propertyId: string): Promise<Deal> {
  const householdId = getCurrentHouseholdId();
  const { data: existingRow, error } = await sb()
    .from("deals")
    .select("*")
    .eq("householdId", householdId)
    .eq("propertyId", propertyId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (existingRow) return dealSchema.parse(existingRow);
  const ts = now();
  const deal = dealSchema.parse({ id: newId(), propertyId, createdAt: ts, updatedAt: ts });
  await insertRow("deals", deal);
  return deal;
}

export async function saveDeal(deal: Deal): Promise<void> {
  await upsertRow("deals", deal);
}

export async function updateDeal(propertyId: string, patch: Partial<Deal>): Promise<void> {
  const deal = await ensureDeal(propertyId);
  await upsertRow("deals", { ...deal, ...patch });
}

export async function deleteDeal(id: string): Promise<void> {
  await removeRow("deals", id);
}
