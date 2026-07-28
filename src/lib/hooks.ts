"use client";

import type { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useHouseholdContext } from "@/lib/household/context";
import { listHouseholdInvites, listHouseholdMembers } from "@/lib/household/api";
import { useQuery } from "@/lib/data/use-query";
import {
  appSettingsSchema,
  attendingTransitionSchema,
  checklistSchema,
  checklistTaskSchema,
  dealSchema,
  documentRecordSchema,
  financialProfileSchema,
  homePreferencesSchema,
  householdProfileSchema,
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
} from "@/lib/models";

/**
 * Reactive reads, Supabase-backed. Each returns `undefined` until the first
 * fetch resolves, then refetches on window focus and after any mutation to
 * the same table (see `lib/data/use-query.ts` / `lib/data/invalidation.ts`)
 * — that refetch-on-relevant-event is the whole cross-device sync mechanism.
 */

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

/**
 * The Input generic must be pinned (not left to default to Output) or
 * TypeScript infers T from Zod's Input position for schemas with
 * `.default()` fields, which is optional-everywhere — the wrong type. See
 * the fields' Output type — `T` itself — is all that ever gets used here.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySchema<T> = z.ZodType<T, z.ZodTypeDef, any>;

/** One row per household, keyed by householdId instead of the old fixed SINGLETON_ID. */
function useSingleton<T>(table: string, schema: AnySchema<T>) {
  const { householdId } = useHouseholdContext();
  return useQuery(
    async () => {
      const { data, error } = await createClient()
        .from(table)
        .select("*")
        .eq("householdId", householdId)
        .maybeSingle();
      const row = unwrap({ data, error });
      return row ? schema.parse(row) : undefined;
    },
    { deps: [householdId], watch: [table] },
  );
}

function useCollection<T>(table: string, schema: AnySchema<T>) {
  const { householdId } = useHouseholdContext();
  return useQuery(
    async () => {
      const { data, error } = await createClient().from(table).select("*").eq("householdId", householdId);
      return schema.array().parse(unwrap({ data, error }));
    },
    { deps: [householdId], watch: [table] },
  );
}

function useFilteredCollection<T>(
  table: string,
  schema: AnySchema<T>,
  column: string,
  value: string | undefined,
) {
  const { householdId } = useHouseholdContext();
  return useQuery(
    async () => {
      if (!value) return [] as T[];
      const { data, error } = await createClient()
        .from(table)
        .select("*")
        .eq("householdId", householdId)
        .eq(column, value);
      return schema.array().parse(unwrap({ data, error }));
    },
    { deps: [householdId, column, value], watch: [table], enabled: !!value },
  );
}

function useRow<T>(table: string, schema: AnySchema<T>, id: string | undefined) {
  const { householdId } = useHouseholdContext();
  return useQuery(
    async () => {
      if (!id) return undefined;
      const { data, error } = await createClient()
        .from(table)
        .select("*")
        .eq("householdId", householdId)
        .eq("id", id)
        .maybeSingle();
      const row = unwrap({ data, error });
      return row ? schema.parse(row) : undefined;
    },
    { deps: [householdId, id], watch: [table], enabled: !!id },
  );
}

// ---- Singletons -------------------------------------------------------

export function useSettings() {
  return useSingleton("appSettings", appSettingsSchema);
}

export function useHousehold() {
  return useSingleton("buyerProfile", householdProfileSchema);
}

export function useFinancial() {
  return useSingleton("financialProfile", financialProfileSchema);
}

export function usePreferences() {
  return useSingleton("homePreferences", homePreferencesSchema);
}

export function useAttendingTransition() {
  return useSingleton("attendingTransition", attendingTransitionSchema);
}

// ---- Properties & visits ------------------------------------------------

export function useProperties() {
  return useCollection("properties", propertySchema);
}

export function useProperty(id: string | undefined) {
  return useRow("properties", propertySchema, id);
}

export function useVisitsForProperty(propertyId: string | undefined) {
  return useFilteredCollection("propertyVisits", propertyVisitSchema, "propertyId", propertyId);
}

export function useAllVisits() {
  return useCollection("propertyVisits", propertyVisitSchema);
}

// ---- Finances -------------------------------------------------------------

export function useScenarios() {
  return useCollection("mortgageScenarios", mortgageScenarioSchema);
}

export function useLenderQuotes() {
  return useCollection("lenderQuotes", lenderQuoteSchema);
}

// ---- Checklists & towns -----------------------------------------------

export function useChecklists() {
  return useCollection("checklists", checklistSchema);
}

export function useTasks() {
  return useCollection("checklistTasks", checklistTaskSchema);
}

export function useTowns() {
  return useCollection("towns", townResearchSchema);
}

// ---- Journey ----------------------------------------------------------

export function useJourneyStages() {
  return useCollection("journeyStages", journeyStageStateSchema);
}

export function useJourneyActions() {
  return useCollection("journeyActions", journeyActionStateSchema);
}

export function useJourneyDecisions() {
  return useCollection("journeyDecisions", journeyDecisionSchema);
}

export function useApprovals() {
  return useCollection("mortgageApprovals", mortgageApprovalSchema);
}

// ---- Professionals, resources, documents, deals ------------------------

export function useProfessionals() {
  return useCollection("professionals", professionalSchema);
}

export function useProfessional(id: string | undefined) {
  return useRow("professionals", professionalSchema, id);
}

export function useResources() {
  return useCollection("resources", resourceSchema);
}

export function useDocuments() {
  return useCollection("documents", documentRecordSchema);
}

export function useDeals() {
  return useCollection("deals", dealSchema);
}

export function useDealForProperty(propertyId: string | undefined) {
  const rows = useFilteredCollection("deals", dealSchema, "propertyId", propertyId);
  return rows?.[0];
}

// ---- Household membership & invites ---------------------------------------
// Bespoke, not the useCollection/useRow factories above: these read through
// SECURITY DEFINER RPCs / a household_invites select (see lib/household/api.ts),
// not a plain `.from(table).eq("householdId", ...)` read.

export function useHouseholdMembers() {
  const { householdId } = useHouseholdContext();
  return useQuery(() => listHouseholdMembers(), { deps: [householdId], watch: ["householdMembers"] });
}

export function useHouseholdInvites() {
  const { householdId } = useHouseholdContext();
  return useQuery(() => listHouseholdInvites(householdId), {
    deps: [householdId],
    watch: ["householdInvites"],
  });
}
