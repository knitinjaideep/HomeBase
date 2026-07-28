import { z } from "zod";
import { idSchema, isoDateSchema } from "./common";

/**
 * Display-only — not yet permission-gated anywhere in the app (any member
 * can invite; see supabase/migrations/0006's comment on generate_family_invite).
 */
export const householdRoleSchema = z.enum(["owner", "member"]);
export type HouseholdRole = z.infer<typeof householdRoleSchema>;

/** Returned by the list_household_members() RPC — never a direct table read. */
export const householdMemberSchema = z.object({
  userId: idSchema,
  email: z.string(),
  role: householdRoleSchema,
  joinedAt: isoDateSchema,
});
export type HouseholdMember = z.infer<typeof householdMemberSchema>;

/**
 * A pending or past family invitation, as shown in Settings. Deliberately
 * has no code/hash field — the plaintext code only ever exists as the
 * one-time return value of generateFamilyInvite(), never stored or re-read.
 */
export const householdInviteSchema = z.object({
  id: idSchema,
  expiresAt: isoDateSchema,
  redeemedAt: isoDateSchema.nullable(),
  revokedAt: isoDateSchema.nullable(),
  createdAt: isoDateSchema,
});
export type HouseholdInvite = z.infer<typeof householdInviteSchema>;
