/**
 * Household membership/invite operations — thin `supabase.rpc()` wrappers,
 * same direct-call style `context.tsx` already uses for `bootstrap_household`.
 * Deliberately separate from `repo.ts`: that file owns household *domain*
 * data (properties, deals, ...); this owns membership/security operations,
 * which the database enforces through SECURITY DEFINER functions rather than
 * plain table CRUD (see supabase/migrations/0006).
 */

import { createClient } from "@/lib/supabase/client";
import { invalidateTable } from "@/lib/data/invalidation";
import { householdInviteSchema, householdMemberSchema, type HouseholdInvite, type HouseholdMember } from "@/lib/models";

const sb = () => createClient();

export async function createHousehold(name?: string): Promise<string> {
  const { data, error } = await sb().rpc("create_household", { p_name: name });
  if (error) throw new Error(error.message);
  return data as string;
}

/** Returns the plaintext code once. Never persisted client-side beyond the confirmation screen. */
export async function generateFamilyInvite(): Promise<string> {
  const { data, error } = await sb().rpc("generate_family_invite");
  if (error) throw new Error(error.message);
  invalidateTable("householdInvites");
  return data as string;
}

/** Strips formatting so users can paste a code however it was shared (with or without dashes/spaces). */
export function normalizeInviteCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function redeemFamilyInvite(code: string): Promise<string> {
  const { data, error } = await sb().rpc("redeem_family_invite", { p_code: normalizeInviteCode(code) });
  if (error) throw new Error(error.message);
  invalidateTable("householdMembers");
  invalidateTable("householdInvites");
  return data as string;
}

export async function revokeFamilyInvite(inviteId: string): Promise<void> {
  const { error } = await sb().rpc("revoke_family_invite", { p_invite_id: inviteId });
  if (error) throw new Error(error.message);
  invalidateTable("householdInvites");
}

export async function listHouseholdMembers(): Promise<HouseholdMember[]> {
  const { data, error } = await sb().rpc("list_household_members");
  if (error) throw new Error(error.message);
  return householdMemberSchema.array().parse(data ?? []);
}

export async function listHouseholdInvites(householdId: string): Promise<HouseholdInvite[]> {
  const { data, error } = await sb()
    .from("household_invites")
    .select("id, expiresAt:expires_at, redeemedAt:redeemed_at, revokedAt:revoked_at, createdAt")
    .eq("household_id", householdId)
    .order("createdAt", { ascending: false });
  if (error) throw new Error(error.message);
  return householdInviteSchema.array().parse(data ?? []);
}
