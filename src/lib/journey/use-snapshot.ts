"use client";

import {
  useApprovals,
  useAttendingTransition,
  useDeals,
  useDocuments,
  useFinancial,
  useHousehold,
  useJourneyActions,
  useJourneyDecisions,
  useJourneyStages,
  useLenderQuotes,
  usePreferences,
  useProfessionals,
  useProperties,
  useResources,
  useTowns,
  useAllVisits,
} from "@/lib/hooks";
import type { JourneySnapshot } from "./snapshot";

/**
 * Assemble the whole journey snapshot from the reactive Dexie hooks. Returns
 * `undefined` until the essential singletons have loaded, so callers can show a
 * single loading state. Optional tables default to empty arrays.
 */
export function useJourneySnapshot(): JourneySnapshot | undefined {
  const household = useHousehold();
  const financial = useFinancial();
  const preferences = usePreferences();
  const properties = useProperties();
  const visits = useAllVisits();
  const lenderQuotes = useLenderQuotes();
  const towns = useTowns();
  const stageStates = useJourneyStages();
  const actions = useJourneyActions();
  const decisions = useJourneyDecisions();
  const attending = useAttendingTransition();
  const approvals = useApprovals();
  const professionals = useProfessionals();
  const resources = useResources();
  const documents = useDocuments();
  const deals = useDeals();

  if (!household || !financial || !preferences || !properties) return undefined;

  return {
    household,
    financial,
    preferences,
    properties,
    visits: visits ?? [],
    lenderQuotes: lenderQuotes ?? [],
    towns: towns ?? [],
    stageStates: stageStates ?? [],
    actions: actions ?? [],
    decisions: decisions ?? [],
    attending: attending ?? undefined,
    approvals: approvals ?? [],
    professionals: professionals ?? [],
    resources: resources ?? [],
    documents: documents ?? [],
    deals: deals ?? [],
    today: new Date(),
  };
}
