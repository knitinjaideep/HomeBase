-- HomeScope — household v2 policies (Stage A: family invites + active household)
--
-- household_invites moves from "members insert directly, redeemer matches by
-- email" to "every write goes through the SECURITY DEFINER functions in
-- 0006" — so the insert policy is dropped entirely (no direct client insert
-- is needed or wanted: generate_family_invite()/redeem_family_invite()/
-- revoke_family_invite() do every write). The email-match select policy is
-- replaced with a plain membership-scoped one, since redemption is by code
-- now, not by matching the signed-in user's email against a pending row.

drop policy "household_invites_select" on household_invites;
drop policy "household_invites_insert" on household_invites;

create policy "household_invites_select" on household_invites for select
  to authenticated
  using (public.is_household_member(household_id));

-- household_invites_delete (0003) is unchanged — still available for actual
-- row cleanup, distinct from revoke_family_invite()'s revoked_at soft-delete.

-- user_preferences (0005) intentionally gets no policies at all: it has no
-- grants either (0008), so RLS never even gets evaluated for it via the Data
-- API. Every read/write goes through 0006's SECURITY DEFINER functions.
