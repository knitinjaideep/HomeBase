import { z } from "zod";
import { baseEntitySchema, idSchema, isoDateSchema } from "./common";

/**
 * Workspace mode — the two primary HomeScope experiences. Stored on the
 * *workspace* (the `households` row), never on the user: a household shares
 * one mode across its members, and the same user could later own a second
 * workspace in the other mode. See docs/WORKSPACE_MODE.md for the full
 * rationale. Values use the codebase's lowercase enum convention (compare
 * `taskStatus`'s "in-progress", `selectionStatus`'s "not-selected").
 */
export const workspaceModeSchema = z.enum(["buying", "owning"]);
export type WorkspaceMode = z.infer<typeof workspaceModeSchema>;

/**
 * A HomeWorkspace is a typed view over a `households` row. It is deliberately
 * a 1:1 mapping of the existing container rather than a second table — the
 * household *is* the workspace. `activeMode` is nullable: an existing account
 * that predates path selection (or a brand-new one that hasn't chosen yet)
 * has `null` here, which the resolver reports as "unselected" and routes to
 * the path-selection screen (PR 2). The data model does not prevent multiple
 * workspaces later, but the initial UI resolves exactly one active workspace.
 */
export const homeWorkspaceSchema = z.object({
  id: idSchema,
  name: z.string(),
  activeMode: workspaceModeSchema.nullable(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});
export type HomeWorkspace = z.infer<typeof homeWorkspaceSchema>;

// ---- Buyer mode profile ---------------------------------------------------

/** First-time vs. repeat buyer — changes the guidance emphasis, not the tables. */
export const buyerExperienceSchema = z.enum(["first-time", "repeat"]);
export type BuyerExperience = z.infer<typeof buyerExperienceSchema>;

/**
 * Who is buying. Partner/group are *metadata only* for now — they do not
 * create separate journey tables, partner invitations, or real-time
 * collaboration (that stays the household-membership feature that already
 * exists). See docs/WORKSPACE_MODE.md.
 */
export const buyerArrangementSchema = z.enum(["solo", "partner", "group"]);
export type BuyerArrangement = z.infer<typeof buyerArrangementSchema>;

/**
 * Path-selection metadata for a workspace in BUYING mode. Distinct from the
 * legacy `buyerProfile` singleton (financial/planning figures) — this is the
 * small "how are you approaching this purchase" record captured at onboarding.
 * Like every other singleton schema here, it omits `householdId`: the repo
 * stamps it on write and Zod strips it on read.
 */
export const buyerModeProfileSchema = baseEntitySchema.extend({
  experience: buyerExperienceSchema.default("first-time"),
  arrangement: buyerArrangementSchema.default("solo"),
  /** Optional target purchase date/period (ISO date or "YYYY-MM", as elsewhere). */
  targetPurchaseDate: z.string().nullable().default(null),
  /** Optional free-text labels/names for the people involved (no accounts implied). */
  participantNames: z.array(z.string()).default([]),
  /** Stamped once the buyer completes onboarding; null until then. */
  onboardingCompletedAt: isoDateSchema.nullable().default(null),
});
export type BuyerModeProfile = z.infer<typeof buyerModeProfileSchema>;

// ---- Owner mode profile ---------------------------------------------------

export const ownerPropertyTypeSchema = z.enum(["single-family", "condo-townhouse", "other"]);
export type OwnerPropertyType = z.infer<typeof ownerPropertyTypeSchema>;

export const ownerOwnershipStageSchema = z.enum(["new-owner", "established-owner"]);
export type OwnerOwnershipStage = z.infer<typeof ownerOwnershipStageSchema>;

/**
 * Path-selection metadata for a workspace in OWNING mode. Mirrors
 * `buyerModeProfile`'s shape and conventions.
 */
export const ownerModeProfileSchema = baseEntitySchema.extend({
  propertyType: ownerPropertyTypeSchema.default("single-family"),
  ownershipStage: ownerOwnershipStageSchema.default("new-owner"),
  /** Optional move-in date (ISO date). */
  moveInDate: z.string().nullable().default(null),
  /** Stamped once the owner completes onboarding; null until then. */
  onboardingCompletedAt: isoDateSchema.nullable().default(null),
});
export type OwnerModeProfile = z.infer<typeof ownerModeProfileSchema>;

/** Table names, kept next to the schemas so the service never hardcodes strings. */
export const WORKSPACE_TABLE = "households";
export const BUYER_MODE_PROFILE_TABLE = "buyerModeProfile";
export const OWNER_MODE_PROFILE_TABLE = "ownerModeProfile";
