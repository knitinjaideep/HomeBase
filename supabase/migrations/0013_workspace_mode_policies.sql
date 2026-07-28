-- HomeScope — workspace mode policies (buyer / homeowner domain foundation)
--
-- RLS for the two new singletons, identical in shape to the existing
-- household-owned singletons in 0003 (buyerProfile / financialProfile / ...):
-- every operation is scoped to the caller's household via
-- is_household_member("householdId"), and every policy is narrowed to the
-- `authenticated` role (0004 established that intent for all app tables).
--
-- households."activeMode" needs no new policy: it is a column on households,
-- which already has households_update (0003, scoped to is_household_member)
-- and a matching UPDATE grant (0004).

create policy "buyer_mode_profile_select" on "buyerModeProfile" for select
  to authenticated
  using (public.is_household_member("householdId"));
create policy "buyer_mode_profile_insert" on "buyerModeProfile" for insert
  to authenticated
  with check (public.is_household_member("householdId"));
create policy "buyer_mode_profile_update" on "buyerModeProfile" for update
  to authenticated
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "buyer_mode_profile_delete" on "buyerModeProfile" for delete
  to authenticated
  using (public.is_household_member("householdId"));

create policy "owner_mode_profile_select" on "ownerModeProfile" for select
  to authenticated
  using (public.is_household_member("householdId"));
create policy "owner_mode_profile_insert" on "ownerModeProfile" for insert
  to authenticated
  with check (public.is_household_member("householdId"));
create policy "owner_mode_profile_update" on "ownerModeProfile" for update
  to authenticated
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "owner_mode_profile_delete" on "ownerModeProfile" for delete
  to authenticated
  using (public.is_household_member("householdId"));
