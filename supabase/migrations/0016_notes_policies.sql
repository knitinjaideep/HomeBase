-- HomeScope — Notes policies
--
-- RLS for `notes`, identical in shape to the workspace-mode tables in 0013:
-- every operation scoped to the caller's household via
-- is_household_member("householdId"), narrowed to `authenticated`.

create policy "notes_select" on notes for select
  to authenticated
  using (public.is_household_member("householdId"));
create policy "notes_insert" on notes for insert
  to authenticated
  with check (public.is_household_member("householdId"));
create policy "notes_update" on notes for update
  to authenticated
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "notes_delete" on notes for delete
  to authenticated
  using (public.is_household_member("householdId"));
