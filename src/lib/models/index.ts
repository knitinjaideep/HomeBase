import { z } from "zod";
import { SCHEMA_VERSION } from "./common";
import {
  appSettingsSchema,
  financialProfileSchema,
  householdProfileSchema,
  homePreferencesSchema,
} from "./profile";
import { propertySchema, propertyVisitSchema } from "./property";
import { lenderQuoteSchema, mortgageScenarioSchema } from "./finance";
import { checklistSchema, checklistTaskSchema, townResearchSchema } from "./planning";
import {
  attendingTransitionSchema,
  journeyActionStateSchema,
  journeyDecisionSchema,
  journeyStageStateSchema,
  mortgageApprovalSchema,
} from "./journey";
import { professionalSchema } from "./professional";
import { resourceSchema } from "./resource";
import { documentRecordSchema } from "./document";
import { dealSchema } from "./deal";
import { noteSchema } from "./note";
import { ownedHomeSchema } from "./home";
import { maintenanceItemSchema } from "./maintenance";
import { repairProjectSchema } from "./repair";

export * from "./common";
export * from "./profile";
export * from "./property";
export * from "./finance";
export * from "./planning";
export * from "./journey";
export * from "./professional";
export * from "./resource";
export * from "./document";
export * from "./deal";
export * from "./household";
export * from "./workspace";
export * from "./note";
export * from "./home";
export * from "./maintenance";
export * from "./repair";

/**
 * The complete backup envelope for export/import. Every array is validated with
 * Zod on import so a malformed or hostile file cannot corrupt the database.
 *
 * Tables added after v1 are optional with an empty-array default so a backup
 * taken from an older version still imports cleanly.
 */
export const backupSchema = z.object({
  app: z.literal("HomeScope"),
  schemaVersion: z.number(),
  exportedAt: z.string(),
  data: z.object({
    householdProfile: z.array(householdProfileSchema),
    financialProfile: z.array(financialProfileSchema),
    homePreferences: z.array(homePreferencesSchema),
    appSettings: z.array(appSettingsSchema),
    properties: z.array(propertySchema),
    visits: z.array(propertyVisitSchema),
    scenarios: z.array(mortgageScenarioSchema),
    lenderQuotes: z.array(lenderQuoteSchema),
    checklists: z.array(checklistSchema),
    tasks: z.array(checklistTaskSchema),
    towns: z.array(townResearchSchema),

    journeyStages: z.array(journeyStageStateSchema).default([]),
    journeyActions: z.array(journeyActionStateSchema).default([]),
    journeyDecisions: z.array(journeyDecisionSchema).default([]),
    attendingTransition: z.array(attendingTransitionSchema).default([]),
    mortgageApprovals: z.array(mortgageApprovalSchema).default([]),
    professionals: z.array(professionalSchema).default([]),
    resources: z.array(resourceSchema).default([]),
    documents: z.array(documentRecordSchema).default([]),
    deals: z.array(dealSchema).default([]),
    notes: z.array(noteSchema).default([]),
    ownedHome: z.array(ownedHomeSchema).default([]),
    maintenanceItems: z.array(maintenanceItemSchema).default([]),
    repairProjects: z.array(repairProjectSchema).default([]),
  }),
});
export type Backup = z.infer<typeof backupSchema>;
export type BackupData = Backup["data"];

export const CURRENT_SCHEMA_VERSION = SCHEMA_VERSION;
