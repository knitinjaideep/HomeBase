/**
 * Owned home, maintenance items, and repair projects — a single self-
 * contained domain file, following the same two-layer shape as
 * `lib/workspace/service.ts` (the existing precedent for "a domain gets its
 * own file rather than growing repo.ts"):
 *
 *   • Core functions take an explicit `SupabaseClient` + `householdId`, so
 *     the completion/recurrence logic is unit-testable against an in-memory
 *     fake with no real network (see service.test.ts).
 *   • Thin app wrappers resolve the browser client + active household the
 *     way `repo.ts` does (`createClient()` + `getCurrentHouseholdId()`) and
 *     invalidate the relevant table(s) so mounted `useQuery` reads refetch.
 *
 * Row Level Security (0021_homebase_policies.sql) is the real access gate;
 * nothing here trusts a client-supplied id beyond the already-resolved
 * active household.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { getCurrentHouseholdId } from "@/lib/household/current";
import { invalidateTable } from "@/lib/data/invalidation";
import { newId, now } from "@/lib/util";
import {
  MAINTENANCE_ITEMS_TABLE,
  OWNED_HOME_TABLE,
  REPAIR_PROJECTS_TABLE,
  maintenanceCompletionSchema,
  maintenanceItemSchema,
  noteSchema,
  ownedHomeSchema,
  repairProjectSchema,
  type MaintenanceCompletion,
  type MaintenanceItem,
  type OwnedHome,
  type RepairProject,
} from "@/lib/models";
import { computeNextDueDate } from "./schedule";

// ---- Generic row helpers (client-injected, mirrors repo.ts's shape) --------

async function loadRow<T>(
  client: SupabaseClient,
  table: string,
  schema: { parse: (v: unknown) => T },
  householdId: string,
  id: string,
): Promise<T | null> {
  const { data, error } = await client.from(table).select("*").eq("householdId", householdId).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? schema.parse(data) : null;
}

async function insertRow<T extends object>(
  client: SupabaseClient,
  table: string,
  householdId: string,
  row: T,
): Promise<T> {
  const { error } = await client.from(table).insert({ ...row, householdId });
  if (error) throw new Error(error.message);
  return row;
}

async function patchRow(
  client: SupabaseClient,
  table: string,
  householdId: string,
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await client.from(table).update(patch).eq("householdId", householdId).eq("id", id);
  if (error) throw new Error(error.message);
}

async function deleteRow(client: SupabaseClient, table: string, householdId: string, id: string): Promise<void> {
  const { error } = await client.from(table).delete().eq("householdId", householdId).eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- Owned home (singleton) -------------------------------------------------

export async function loadOwnedHomeCore(client: SupabaseClient, householdId: string): Promise<OwnedHome | null> {
  const { data, error } = await client.from(OWNED_HOME_TABLE).select("*").eq("householdId", householdId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? ownedHomeSchema.parse(data) : null;
}

/** Read-then-write upsert for the owned-home singleton, mirroring `workspace/service.ts`'s `saveSingleton`. */
export async function saveOwnedHomeCore(
  client: SupabaseClient,
  householdId: string,
  patch: Partial<OwnedHome>,
): Promise<void> {
  const { data: existing, error: readError } = await client
    .from(OWNED_HOME_TABLE)
    .select("id")
    .eq("householdId", householdId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);

  if (existing) {
    const { error } = await client.from(OWNED_HOME_TABLE).update(patch).eq("householdId", householdId);
    if (error) throw new Error(error.message);
    return;
  }

  const ts = now();
  const row = ownedHomeSchema.parse({ id: newId(), createdAt: ts, updatedAt: ts, ...patch });
  const { error } = await client.from(OWNED_HOME_TABLE).insert({ ...row, householdId });
  if (error) throw new Error(error.message);
}

// ---- Maintenance items -------------------------------------------------------

export function newMaintenanceItem(input: Partial<MaintenanceItem> & { title: string }): MaintenanceItem {
  const ts = now();
  return maintenanceItemSchema.parse({ id: newId(), createdAt: ts, updatedAt: ts, ...input });
}

export async function createMaintenanceItemCore(
  client: SupabaseClient,
  householdId: string,
  input: Partial<MaintenanceItem> & { title: string },
): Promise<MaintenanceItem> {
  return insertRow(client, MAINTENANCE_ITEMS_TABLE, householdId, newMaintenanceItem(input));
}

export async function updateMaintenanceItemCore(
  client: SupabaseClient,
  householdId: string,
  id: string,
  patch: Partial<MaintenanceItem>,
): Promise<void> {
  await patchRow(client, MAINTENANCE_ITEMS_TABLE, householdId, id, patch);
}

export async function deleteMaintenanceItemCore(client: SupabaseClient, householdId: string, id: string): Promise<void> {
  await deleteRow(client, MAINTENANCE_ITEMS_TABLE, householdId, id);
}

export interface MaintenanceCompletionInput {
  completedDate: string;
  whatWasDone?: string;
  cost?: number | null;
  performedBy?: string;
  /** If non-empty, becomes a real Note (contextType "maintenanceItem") rather than a second free-text field. */
  note?: string;
}

/**
 * Records a completion, computes the next due date via deterministic
 * recurrence (schedule.ts), and moves status: a recurring item stays
 * "active" (its next occurrence is now scheduled); a one-time item becomes
 * "completed". Optionally creates a linked Note when `note` is non-empty —
 * this is the shared-notes-system reuse the feature is built around, rather
 * than a second freeform journal on the completion entry itself.
 */
export async function completeMaintenanceItemCore(
  client: SupabaseClient,
  householdId: string,
  id: string,
  input: MaintenanceCompletionInput,
): Promise<MaintenanceItem> {
  const item = await loadRow(client, MAINTENANCE_ITEMS_TABLE, maintenanceItemSchema, householdId, id);
  if (!item) throw new Error(`Maintenance item ${id} not found`);

  let noteId: string | null = null;
  const noteText = input.note?.trim();
  if (noteText) {
    const ts = now();
    const note = noteSchema.parse({
      id: newId(),
      createdAt: ts,
      updatedAt: ts,
      body: noteText,
      contextType: "maintenanceItem",
      contextId: id,
    });
    await insertRow(client, "notes", householdId, note);
    noteId = note.id;
  }

  const completion: MaintenanceCompletion = maintenanceCompletionSchema.parse({
    id: newId(),
    completedDate: input.completedDate,
    whatWasDone: input.whatWasDone ?? "",
    cost: input.cost ?? null,
    performedBy: input.performedBy ?? "",
    noteId,
  });

  const patch: Partial<MaintenanceItem> = {
    completionHistory: [...item.completionHistory, completion],
    lastCompletedDate: input.completedDate,
    dueDate: computeNextDueDate(input.completedDate, item.recurrenceMonths),
    status: item.recurrenceMonths != null ? "active" : "completed",
  };
  await patchRow(client, MAINTENANCE_ITEMS_TABLE, householdId, id, patch);
  return { ...item, ...patch };
}

export async function skipMaintenanceItemCore(client: SupabaseClient, householdId: string, id: string): Promise<void> {
  await patchRow(client, MAINTENANCE_ITEMS_TABLE, householdId, id, { status: "skipped" });
}

export async function archiveMaintenanceItemCore(client: SupabaseClient, householdId: string, id: string): Promise<void> {
  await patchRow(client, MAINTENANCE_ITEMS_TABLE, householdId, id, { status: "archived" });
}

// ---- Repair projects ---------------------------------------------------------

export function newRepairProject(input: Partial<RepairProject> & { title: string }): RepairProject {
  const ts = now();
  return repairProjectSchema.parse({ id: newId(), createdAt: ts, updatedAt: ts, ...input });
}

export async function createRepairProjectCore(
  client: SupabaseClient,
  householdId: string,
  input: Partial<RepairProject> & { title: string },
): Promise<RepairProject> {
  return insertRow(client, REPAIR_PROJECTS_TABLE, householdId, newRepairProject(input));
}

export async function updateRepairProjectCore(
  client: SupabaseClient,
  householdId: string,
  id: string,
  patch: Partial<RepairProject>,
): Promise<void> {
  await patchRow(client, REPAIR_PROJECTS_TABLE, householdId, id, patch);
}

export async function deleteRepairProjectCore(client: SupabaseClient, householdId: string, id: string): Promise<void> {
  await deleteRow(client, REPAIR_PROJECTS_TABLE, householdId, id);
}

export async function completeRepairProjectCore(
  client: SupabaseClient,
  householdId: string,
  id: string,
  completionDate: string,
  actualCost?: number | null,
): Promise<void> {
  const patch: Partial<RepairProject> = { status: "completed", completionDate };
  if (actualCost !== undefined) patch.actualCost = actualCost;
  await patchRow(client, REPAIR_PROJECTS_TABLE, householdId, id, patch);
}

export async function cancelRepairProjectCore(client: SupabaseClient, householdId: string, id: string): Promise<void> {
  await patchRow(client, REPAIR_PROJECTS_TABLE, householdId, id, { status: "cancelled" });
}

// ---- App wrappers -----------------------------------------------------------
// Resolve the browser client + active household and invalidate on write, so
// the corresponding `useQuery` hooks refetch.

export async function updateOwnedHome(patch: Partial<OwnedHome>): Promise<void> {
  await saveOwnedHomeCore(createClient(), getCurrentHouseholdId(), patch);
  invalidateTable(OWNED_HOME_TABLE);
}

export async function createMaintenanceItem(
  input: Partial<MaintenanceItem> & { title: string },
): Promise<MaintenanceItem> {
  const item = await createMaintenanceItemCore(createClient(), getCurrentHouseholdId(), input);
  invalidateTable(MAINTENANCE_ITEMS_TABLE);
  return item;
}

export async function updateMaintenanceItem(id: string, patch: Partial<MaintenanceItem>): Promise<void> {
  await updateMaintenanceItemCore(createClient(), getCurrentHouseholdId(), id, patch);
  invalidateTable(MAINTENANCE_ITEMS_TABLE);
}

export async function deleteMaintenanceItem(id: string): Promise<void> {
  await deleteMaintenanceItemCore(createClient(), getCurrentHouseholdId(), id);
  invalidateTable(MAINTENANCE_ITEMS_TABLE);
}

export async function completeMaintenanceItem(
  id: string,
  input: MaintenanceCompletionInput,
): Promise<MaintenanceItem> {
  const item = await completeMaintenanceItemCore(createClient(), getCurrentHouseholdId(), id, input);
  invalidateTable(MAINTENANCE_ITEMS_TABLE);
  if (input.note?.trim()) invalidateTable("notes");
  return item;
}

export async function skipMaintenanceItem(id: string): Promise<void> {
  await skipMaintenanceItemCore(createClient(), getCurrentHouseholdId(), id);
  invalidateTable(MAINTENANCE_ITEMS_TABLE);
}

export async function archiveMaintenanceItem(id: string): Promise<void> {
  await archiveMaintenanceItemCore(createClient(), getCurrentHouseholdId(), id);
  invalidateTable(MAINTENANCE_ITEMS_TABLE);
}

export async function createRepairProject(
  input: Partial<RepairProject> & { title: string },
): Promise<RepairProject> {
  const project = await createRepairProjectCore(createClient(), getCurrentHouseholdId(), input);
  invalidateTable(REPAIR_PROJECTS_TABLE);
  return project;
}

export async function updateRepairProject(id: string, patch: Partial<RepairProject>): Promise<void> {
  await updateRepairProjectCore(createClient(), getCurrentHouseholdId(), id, patch);
  invalidateTable(REPAIR_PROJECTS_TABLE);
}

export async function deleteRepairProject(id: string): Promise<void> {
  await deleteRepairProjectCore(createClient(), getCurrentHouseholdId(), id);
  invalidateTable(REPAIR_PROJECTS_TABLE);
}

export async function completeRepairProject(id: string, completionDate: string, actualCost?: number | null): Promise<void> {
  await completeRepairProjectCore(createClient(), getCurrentHouseholdId(), id, completionDate, actualCost);
  invalidateTable(REPAIR_PROJECTS_TABLE);
}

export async function cancelRepairProject(id: string): Promise<void> {
  await cancelRepairProjectCore(createClient(), getCurrentHouseholdId(), id);
  invalidateTable(REPAIR_PROJECTS_TABLE);
}
