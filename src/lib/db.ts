import Dexie, { type EntityTable } from "dexie";
import type {
  AppSettings,
  AttendingTransition,
  Checklist,
  ChecklistTask,
  Deal,
  DocumentRecord,
  FinancialProfile,
  HomePreferences,
  HouseholdProfile,
  JourneyActionState,
  JourneyDecision,
  JourneyStageState,
  LenderQuote,
  MortgageApproval,
  MortgageScenario,
  Professional,
  Property,
  PropertyVisit,
  Resource,
  TownResearch,
} from "./models";

/**
 * HomeScope's local database. Everything lives in the browser (IndexedDB) —
 * there is no server and no network transmission of any of this data.
 */
export class HomeScopeDB extends Dexie {
  householdProfile!: EntityTable<HouseholdProfile, "id">;
  financialProfile!: EntityTable<FinancialProfile, "id">;
  homePreferences!: EntityTable<HomePreferences, "id">;
  appSettings!: EntityTable<AppSettings, "id">;
  properties!: EntityTable<Property, "id">;
  visits!: EntityTable<PropertyVisit, "id">;
  scenarios!: EntityTable<MortgageScenario, "id">;
  lenderQuotes!: EntityTable<LenderQuote, "id">;
  checklists!: EntityTable<Checklist, "id">;
  tasks!: EntityTable<ChecklistTask, "id">;
  towns!: EntityTable<TownResearch, "id">;

  // Journey guide (v2)
  journeyStages!: EntityTable<JourneyStageState, "id">;
  journeyActions!: EntityTable<JourneyActionState, "id">;
  journeyDecisions!: EntityTable<JourneyDecision, "id">;
  attendingTransition!: EntityTable<AttendingTransition, "id">;
  mortgageApprovals!: EntityTable<MortgageApproval, "id">;
  professionals!: EntityTable<Professional, "id">;
  resources!: EntityTable<Resource, "id">;
  documents!: EntityTable<DocumentRecord, "id">;
  deals!: EntityTable<Deal, "id">;

  constructor() {
    super("homescope");

    this.version(1).stores({
      householdProfile: "id",
      financialProfile: "id",
      homePreferences: "id",
      appSettings: "id",
      properties: "id, status, town, isArchived, dateAdded",
      visits: "id, propertyId, visitDate",
      scenarios: "id, propertyId, name",
      lenderQuotes: "id, loanType, lender",
      checklists: "id, kind, category, order",
      tasks: "id, checklistId, status, dueDate, relatedPropertyId",
      towns: "id, name, isPrimary",
    });

    // v2 — the guided journey. Adds the journey tables and re-indexes towns on
    // `designation`, which replaced the boolean `isPrimary`.
    this.version(2)
      .stores({
        towns: "id, name, designation",
        journeyStages: "id",
        journeyActions: "id, stageId, status, dueDate",
        journeyDecisions: "id, stageId",
        attendingTransition: "id",
        mortgageApprovals: "id, lender, kind",
        professionals: "id, role, selectionStatus",
        resources: "id, status, publisherKind",
        documents: "id, category, status, relatedStageId, relatedPropertyId",
        deals: "id, propertyId",
      })
      .upgrade(async (tx) => {
        await tx
          .table("towns")
          .toCollection()
          .modify((town: TownResearch & { isPrimary?: boolean }) => {
            town.designation = town.isPrimary ? "primary" : "considering";
            delete town.isPrimary;
          });
      });
  }
}

let dbInstance: HomeScopeDB | null = null;

/** Lazily construct the DB so it is only touched in the browser. */
export function getDb(): HomeScopeDB {
  if (!dbInstance) {
    dbInstance = new HomeScopeDB();
  }
  return dbInstance;
}
