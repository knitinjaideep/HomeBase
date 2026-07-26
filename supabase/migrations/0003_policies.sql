-- HomeScope — Row Level Security policies
--
-- Every table holding household data is scoped through is_household_member()
-- (defined in 0002_functions.sql). households/household_members get their own
-- narrower policies below; household creation and membership changes only
-- happen through bootstrap_household() (SECURITY DEFINER), never a direct
-- client insert, so there are no insert/delete policies on those two tables.

alter table households enable row level security;

create policy "households_select" on households for select
  using (public.is_household_member(id));
create policy "households_update" on households for update
  using (public.is_household_member(id))
  with check (public.is_household_member(id));

alter table household_members enable row level security;

create policy "household_members_select" on household_members for select
  using (public.is_household_member(household_id));

alter table household_invites enable row level security;

create policy "household_invites_select" on household_invites for select
  using (
    public.is_household_member(household_id)
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
create policy "household_invites_insert" on household_invites for insert
  with check (public.is_household_member(household_id) and created_by = auth.uid());
create policy "household_invites_delete" on household_invites for delete
  using (public.is_household_member(household_id));

-- ---------------------------------------------------------------------------
-- Household-owned application data — select/insert/update/delete gated on
-- membership of the row's own householdId. Generated consistently for all 20
-- tables (verify with the same is_household_member helper everywhere).
-- ---------------------------------------------------------------------------

alter table "buyerProfile" enable row level security;

create policy "buyer_profile_select" on "buyerProfile" for select
  using (public.is_household_member("householdId"));
create policy "buyer_profile_insert" on "buyerProfile" for insert
  with check (public.is_household_member("householdId"));
create policy "buyer_profile_update" on "buyerProfile" for update
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "buyer_profile_delete" on "buyerProfile" for delete
  using (public.is_household_member("householdId"));

alter table "financialProfile" enable row level security;

create policy "financial_profile_select" on "financialProfile" for select
  using (public.is_household_member("householdId"));
create policy "financial_profile_insert" on "financialProfile" for insert
  with check (public.is_household_member("householdId"));
create policy "financial_profile_update" on "financialProfile" for update
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "financial_profile_delete" on "financialProfile" for delete
  using (public.is_household_member("householdId"));

alter table "homePreferences" enable row level security;

create policy "home_preferences_select" on "homePreferences" for select
  using (public.is_household_member("householdId"));
create policy "home_preferences_insert" on "homePreferences" for insert
  with check (public.is_household_member("householdId"));
create policy "home_preferences_update" on "homePreferences" for update
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "home_preferences_delete" on "homePreferences" for delete
  using (public.is_household_member("householdId"));

alter table "appSettings" enable row level security;

create policy "app_settings_select" on "appSettings" for select
  using (public.is_household_member("householdId"));
create policy "app_settings_insert" on "appSettings" for insert
  with check (public.is_household_member("householdId"));
create policy "app_settings_update" on "appSettings" for update
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "app_settings_delete" on "appSettings" for delete
  using (public.is_household_member("householdId"));

alter table properties enable row level security;

create policy "properties_select" on properties for select
  using (public.is_household_member("householdId"));
create policy "properties_insert" on properties for insert
  with check (public.is_household_member("householdId"));
create policy "properties_update" on properties for update
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "properties_delete" on properties for delete
  using (public.is_household_member("householdId"));

alter table "propertyVisits" enable row level security;

create policy "property_visits_select" on "propertyVisits" for select
  using (public.is_household_member("householdId"));
create policy "property_visits_insert" on "propertyVisits" for insert
  with check (public.is_household_member("householdId"));
create policy "property_visits_update" on "propertyVisits" for update
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "property_visits_delete" on "propertyVisits" for delete
  using (public.is_household_member("householdId"));

alter table "mortgageScenarios" enable row level security;

create policy "mortgage_scenarios_select" on "mortgageScenarios" for select
  using (public.is_household_member("householdId"));
create policy "mortgage_scenarios_insert" on "mortgageScenarios" for insert
  with check (public.is_household_member("householdId"));
create policy "mortgage_scenarios_update" on "mortgageScenarios" for update
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "mortgage_scenarios_delete" on "mortgageScenarios" for delete
  using (public.is_household_member("householdId"));

alter table "lenderQuotes" enable row level security;

create policy "lender_quotes_select" on "lenderQuotes" for select
  using (public.is_household_member("householdId"));
create policy "lender_quotes_insert" on "lenderQuotes" for insert
  with check (public.is_household_member("householdId"));
create policy "lender_quotes_update" on "lenderQuotes" for update
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "lender_quotes_delete" on "lenderQuotes" for delete
  using (public.is_household_member("householdId"));

alter table checklists enable row level security;

create policy "checklists_select" on checklists for select
  using (public.is_household_member("householdId"));
create policy "checklists_insert" on checklists for insert
  with check (public.is_household_member("householdId"));
create policy "checklists_update" on checklists for update
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "checklists_delete" on checklists for delete
  using (public.is_household_member("householdId"));

alter table "checklistTasks" enable row level security;

create policy "checklist_tasks_select" on "checklistTasks" for select
  using (public.is_household_member("householdId"));
create policy "checklist_tasks_insert" on "checklistTasks" for insert
  with check (public.is_household_member("householdId"));
create policy "checklist_tasks_update" on "checklistTasks" for update
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "checklist_tasks_delete" on "checklistTasks" for delete
  using (public.is_household_member("householdId"));

alter table towns enable row level security;

create policy "towns_select" on towns for select
  using (public.is_household_member("householdId"));
create policy "towns_insert" on towns for insert
  with check (public.is_household_member("householdId"));
create policy "towns_update" on towns for update
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "towns_delete" on towns for delete
  using (public.is_household_member("householdId"));

alter table "journeyStages" enable row level security;

create policy "journey_stages_select" on "journeyStages" for select
  using (public.is_household_member("householdId"));
create policy "journey_stages_insert" on "journeyStages" for insert
  with check (public.is_household_member("householdId"));
create policy "journey_stages_update" on "journeyStages" for update
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "journey_stages_delete" on "journeyStages" for delete
  using (public.is_household_member("householdId"));

alter table "journeyActions" enable row level security;

create policy "journey_actions_select" on "journeyActions" for select
  using (public.is_household_member("householdId"));
create policy "journey_actions_insert" on "journeyActions" for insert
  with check (public.is_household_member("householdId"));
create policy "journey_actions_update" on "journeyActions" for update
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "journey_actions_delete" on "journeyActions" for delete
  using (public.is_household_member("householdId"));

alter table "journeyDecisions" enable row level security;

create policy "journey_decisions_select" on "journeyDecisions" for select
  using (public.is_household_member("householdId"));
create policy "journey_decisions_insert" on "journeyDecisions" for insert
  with check (public.is_household_member("householdId"));
create policy "journey_decisions_update" on "journeyDecisions" for update
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "journey_decisions_delete" on "journeyDecisions" for delete
  using (public.is_household_member("householdId"));

alter table "attendingTransition" enable row level security;

create policy "attending_transition_select" on "attendingTransition" for select
  using (public.is_household_member("householdId"));
create policy "attending_transition_insert" on "attendingTransition" for insert
  with check (public.is_household_member("householdId"));
create policy "attending_transition_update" on "attendingTransition" for update
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "attending_transition_delete" on "attendingTransition" for delete
  using (public.is_household_member("householdId"));

alter table professionals enable row level security;

create policy "professionals_select" on professionals for select
  using (public.is_household_member("householdId"));
create policy "professionals_insert" on professionals for insert
  with check (public.is_household_member("householdId"));
create policy "professionals_update" on professionals for update
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "professionals_delete" on professionals for delete
  using (public.is_household_member("householdId"));

alter table "mortgageApprovals" enable row level security;

create policy "mortgage_approvals_select" on "mortgageApprovals" for select
  using (public.is_household_member("householdId"));
create policy "mortgage_approvals_insert" on "mortgageApprovals" for insert
  with check (public.is_household_member("householdId"));
create policy "mortgage_approvals_update" on "mortgageApprovals" for update
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "mortgage_approvals_delete" on "mortgageApprovals" for delete
  using (public.is_household_member("householdId"));

alter table resources enable row level security;

create policy "resources_select" on resources for select
  using (public.is_household_member("householdId"));
create policy "resources_insert" on resources for insert
  with check (public.is_household_member("householdId"));
create policy "resources_update" on resources for update
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "resources_delete" on resources for delete
  using (public.is_household_member("householdId"));

alter table documents enable row level security;

create policy "documents_select" on documents for select
  using (public.is_household_member("householdId"));
create policy "documents_insert" on documents for insert
  with check (public.is_household_member("householdId"));
create policy "documents_update" on documents for update
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "documents_delete" on documents for delete
  using (public.is_household_member("householdId"));

alter table deals enable row level security;

create policy "deals_select" on deals for select
  using (public.is_household_member("householdId"));
create policy "deals_insert" on deals for insert
  with check (public.is_household_member("householdId"));
create policy "deals_update" on deals for update
  using (public.is_household_member("householdId"))
  with check (public.is_household_member("householdId"));
create policy "deals_delete" on deals for delete
  using (public.is_household_member("householdId"));
