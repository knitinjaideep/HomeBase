-- HomeScope — HomeBase policies
--
-- RLS for "ownedHome", "maintenanceItems", "repairProjects", identical shape
-- to 0016_notes_policies.sql: every operation scoped to the caller's
-- household via is_household_member("householdId"), narrowed to
-- `authenticated`. No documents policy changes needed — the existing
-- documents_select/insert/update/delete policies (0003) already cover the
-- two new nullable columns added in 0020.

create policy "owned_home_select" on "ownedHome" for select
  to authenticated
  using (public.is_household_member("householdId"));
create policy "owned_home_insert" on "ownedHome" for insert
  to authenticated
  with check (public.is_household_member("householdId"));
create policy "owned_home_update" on "ownedHome" for update
  to authenticated
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "owned_home_delete" on "ownedHome" for delete
  to authenticated
  using (public.is_household_member("householdId"));

create policy "maintenance_items_select" on "maintenanceItems" for select
  to authenticated
  using (public.is_household_member("householdId"));
create policy "maintenance_items_insert" on "maintenanceItems" for insert
  to authenticated
  with check (public.is_household_member("householdId"));
create policy "maintenance_items_update" on "maintenanceItems" for update
  to authenticated
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "maintenance_items_delete" on "maintenanceItems" for delete
  to authenticated
  using (public.is_household_member("householdId"));

create policy "repair_projects_select" on "repairProjects" for select
  to authenticated
  using (public.is_household_member("householdId"));
create policy "repair_projects_insert" on "repairProjects" for insert
  to authenticated
  with check (public.is_household_member("householdId"));
create policy "repair_projects_update" on "repairProjects" for update
  to authenticated
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "repair_projects_delete" on "repairProjects" for delete
  to authenticated
  using (public.is_household_member("householdId"));
