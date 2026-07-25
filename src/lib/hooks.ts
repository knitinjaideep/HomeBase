"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "./db";
import { SINGLETON_ID } from "./models";

/** Reactive reads. Each returns `undefined` until the first query resolves. */

export function useSettings() {
  return useLiveQuery(() => getDb().appSettings.get(SINGLETON_ID));
}

export function useHousehold() {
  return useLiveQuery(() => getDb().householdProfile.get(SINGLETON_ID));
}

export function useFinancial() {
  return useLiveQuery(() => getDb().financialProfile.get(SINGLETON_ID));
}

export function usePreferences() {
  return useLiveQuery(() => getDb().homePreferences.get(SINGLETON_ID));
}

export function useProperties() {
  return useLiveQuery(() => getDb().properties.toArray());
}

export function useProperty(id: string | undefined) {
  return useLiveQuery(() => (id ? getDb().properties.get(id) : undefined), [id]);
}

export function useVisitsForProperty(propertyId: string | undefined) {
  return useLiveQuery(
    () => (propertyId ? getDb().visits.where("propertyId").equals(propertyId).toArray() : []),
    [propertyId],
  );
}

export function useAllVisits() {
  return useLiveQuery(() => getDb().visits.toArray());
}

export function useScenarios() {
  return useLiveQuery(() => getDb().scenarios.toArray());
}

export function useLenderQuotes() {
  return useLiveQuery(() => getDb().lenderQuotes.toArray());
}

export function useChecklists() {
  return useLiveQuery(() => getDb().checklists.toArray());
}

export function useTasks() {
  return useLiveQuery(() => getDb().tasks.toArray());
}

export function useTowns() {
  return useLiveQuery(() => getDb().towns.toArray());
}

// ---- Journey --------------------------------------------------------------

export function useJourneyStages() {
  return useLiveQuery(() => getDb().journeyStages.toArray());
}

export function useJourneyActions() {
  return useLiveQuery(() => getDb().journeyActions.toArray());
}

export function useJourneyDecisions() {
  return useLiveQuery(() => getDb().journeyDecisions.toArray());
}

export function useAttendingTransition() {
  return useLiveQuery(() => getDb().attendingTransition.get(SINGLETON_ID));
}

export function useApprovals() {
  return useLiveQuery(() => getDb().mortgageApprovals.toArray());
}

export function useProfessionals() {
  return useLiveQuery(() => getDb().professionals.toArray());
}

export function useProfessional(id: string | undefined) {
  return useLiveQuery(() => (id ? getDb().professionals.get(id) : undefined), [id]);
}

export function useResources() {
  return useLiveQuery(() => getDb().resources.toArray());
}

export function useDocuments() {
  return useLiveQuery(() => getDb().documents.toArray());
}

export function useDeals() {
  return useLiveQuery(() => getDb().deals.toArray());
}

export function useDealForProperty(propertyId: string | undefined) {
  return useLiveQuery(
    () => (propertyId ? getDb().deals.where("propertyId").equals(propertyId).first() : undefined),
    [propertyId],
  );
}
