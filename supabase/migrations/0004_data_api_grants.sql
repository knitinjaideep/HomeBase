-- HomeScope — explicit Data API grants
--
-- 0001-0003 created 23 tables, enabled RLS on all of them, and defined
-- policies — but never issued a single GRANT. Under the classic Supabase
-- default (blanket `alter default privileges ... grant all ... to anon,
-- authenticated, service_role` run once at project provisioning), that was
-- invisible: every new table in `public` silently inherited full CRUD for
-- every API-facing role, and RLS was the only real gate.
--
-- This project does not have that blanket default. With zero table-level
-- grants, Postgres denies `authenticated` (and `anon`) before RLS policies
-- are ever evaluated — that's the "API DISABLED" badge in Database >
-- Policies, and the browser's 403s on every table, appSettings included.
--
-- Fix: grant explicitly, per table, to `authenticated` only. `anon` gets
-- nothing — this app has no public data, and its only anon-key use is the
-- Auth API (email OTP / magic link), which is handled by GoTrue, not
-- PostgREST, and needs no table grants. `service_role` is granted the same
-- as authenticated for reproducibility/consistency with a standard Supabase
-- project (it already bypasses RLS at the role level), even though the app
-- itself never ships that key to the browser or calls it from anywhere —
-- see 0002_functions.sql's comment to that effect.

grant usage on schema public to authenticated, service_role;

-- households / household_members / household_invites — narrower than the
-- 20 application tables because they're not plain CRUD resources:
-- households is only ever created by bootstrap_household() (SECURITY
-- DEFINER), never a direct client insert, so no insert/delete grant; same
-- reasoning for household_members. household_invites has no update policy
-- (invites are created, read, and deleted — never edited in place), so no
-- update grant.

grant select, update on households to authenticated, service_role;
grant select on household_members to authenticated, service_role;
grant select, insert, delete on household_invites to authenticated, service_role;

-- The 20 household-owned application tables — each has select/insert/
-- update/delete policies in 0003_policies.sql, so each gets full CRUD grants
-- here. RLS (is_household_member) remains the actual access-control layer;
-- this just lets `authenticated` reach that layer at all.

grant select, insert, update, delete on
  "buyerProfile",
  "financialProfile",
  "homePreferences",
  "appSettings",
  properties,
  "propertyVisits",
  "mortgageScenarios",
  "lenderQuotes",
  checklists,
  "checklistTasks",
  towns,
  "journeyStages",
  "journeyActions",
  "journeyDecisions",
  "attendingTransition",
  professionals,
  "mortgageApprovals",
  resources,
  documents,
  deals
to authenticated, service_role;

-- So the next new table doesn't reintroduce this exact bug: any future
-- table created in `public` by the role running migrations gets the same
-- default CRUD grants automatically. (Scoped to tables only — sequences
-- aren't used; every PK here is gen_random_uuid().)

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Policy scope: every policy in 0003_policies.sql was declared with no `TO`
-- clause, which in Postgres defaults to `TO public` — i.e. every role,
-- including anon. In practice this was harmless (is_household_member()
-- checks auth.uid(), which is null for anon, so the row filter always
-- excluded anon) and anon had no table grant to reach it anyway — but it's
-- relying on that null check rather than stating the intent directly, and
-- it's what item 6 of this audit asked to close. Narrowing every policy to
-- `TO authenticated` is a metadata-only change (no policy logic changes).
-- ---------------------------------------------------------------------------

alter policy "households_select" on households to authenticated;
alter policy "households_update" on households to authenticated;
alter policy "household_members_select" on household_members to authenticated;
alter policy "household_invites_select" on household_invites to authenticated;
alter policy "household_invites_insert" on household_invites to authenticated;
alter policy "household_invites_delete" on household_invites to authenticated;
alter policy "buyer_profile_select" on "buyerProfile" to authenticated;
alter policy "buyer_profile_insert" on "buyerProfile" to authenticated;
alter policy "buyer_profile_update" on "buyerProfile" to authenticated;
alter policy "buyer_profile_delete" on "buyerProfile" to authenticated;
alter policy "financial_profile_select" on "financialProfile" to authenticated;
alter policy "financial_profile_insert" on "financialProfile" to authenticated;
alter policy "financial_profile_update" on "financialProfile" to authenticated;
alter policy "financial_profile_delete" on "financialProfile" to authenticated;
alter policy "home_preferences_select" on "homePreferences" to authenticated;
alter policy "home_preferences_insert" on "homePreferences" to authenticated;
alter policy "home_preferences_update" on "homePreferences" to authenticated;
alter policy "home_preferences_delete" on "homePreferences" to authenticated;
alter policy "app_settings_select" on "appSettings" to authenticated;
alter policy "app_settings_insert" on "appSettings" to authenticated;
alter policy "app_settings_update" on "appSettings" to authenticated;
alter policy "app_settings_delete" on "appSettings" to authenticated;
alter policy "properties_select" on properties to authenticated;
alter policy "properties_insert" on properties to authenticated;
alter policy "properties_update" on properties to authenticated;
alter policy "properties_delete" on properties to authenticated;
alter policy "property_visits_select" on "propertyVisits" to authenticated;
alter policy "property_visits_insert" on "propertyVisits" to authenticated;
alter policy "property_visits_update" on "propertyVisits" to authenticated;
alter policy "property_visits_delete" on "propertyVisits" to authenticated;
alter policy "mortgage_scenarios_select" on "mortgageScenarios" to authenticated;
alter policy "mortgage_scenarios_insert" on "mortgageScenarios" to authenticated;
alter policy "mortgage_scenarios_update" on "mortgageScenarios" to authenticated;
alter policy "mortgage_scenarios_delete" on "mortgageScenarios" to authenticated;
alter policy "lender_quotes_select" on "lenderQuotes" to authenticated;
alter policy "lender_quotes_insert" on "lenderQuotes" to authenticated;
alter policy "lender_quotes_update" on "lenderQuotes" to authenticated;
alter policy "lender_quotes_delete" on "lenderQuotes" to authenticated;
alter policy "checklists_select" on checklists to authenticated;
alter policy "checklists_insert" on checklists to authenticated;
alter policy "checklists_update" on checklists to authenticated;
alter policy "checklists_delete" on checklists to authenticated;
alter policy "checklist_tasks_select" on "checklistTasks" to authenticated;
alter policy "checklist_tasks_insert" on "checklistTasks" to authenticated;
alter policy "checklist_tasks_update" on "checklistTasks" to authenticated;
alter policy "checklist_tasks_delete" on "checklistTasks" to authenticated;
alter policy "towns_select" on towns to authenticated;
alter policy "towns_insert" on towns to authenticated;
alter policy "towns_update" on towns to authenticated;
alter policy "towns_delete" on towns to authenticated;
alter policy "journey_stages_select" on "journeyStages" to authenticated;
alter policy "journey_stages_insert" on "journeyStages" to authenticated;
alter policy "journey_stages_update" on "journeyStages" to authenticated;
alter policy "journey_stages_delete" on "journeyStages" to authenticated;
alter policy "journey_actions_select" on "journeyActions" to authenticated;
alter policy "journey_actions_insert" on "journeyActions" to authenticated;
alter policy "journey_actions_update" on "journeyActions" to authenticated;
alter policy "journey_actions_delete" on "journeyActions" to authenticated;
alter policy "journey_decisions_select" on "journeyDecisions" to authenticated;
alter policy "journey_decisions_insert" on "journeyDecisions" to authenticated;
alter policy "journey_decisions_update" on "journeyDecisions" to authenticated;
alter policy "journey_decisions_delete" on "journeyDecisions" to authenticated;
alter policy "attending_transition_select" on "attendingTransition" to authenticated;
alter policy "attending_transition_insert" on "attendingTransition" to authenticated;
alter policy "attending_transition_update" on "attendingTransition" to authenticated;
alter policy "attending_transition_delete" on "attendingTransition" to authenticated;
alter policy "professionals_select" on professionals to authenticated;
alter policy "professionals_insert" on professionals to authenticated;
alter policy "professionals_update" on professionals to authenticated;
alter policy "professionals_delete" on professionals to authenticated;
alter policy "mortgage_approvals_select" on "mortgageApprovals" to authenticated;
alter policy "mortgage_approvals_insert" on "mortgageApprovals" to authenticated;
alter policy "mortgage_approvals_update" on "mortgageApprovals" to authenticated;
alter policy "mortgage_approvals_delete" on "mortgageApprovals" to authenticated;
alter policy "resources_select" on resources to authenticated;
alter policy "resources_insert" on resources to authenticated;
alter policy "resources_update" on resources to authenticated;
alter policy "resources_delete" on resources to authenticated;
alter policy "documents_select" on documents to authenticated;
alter policy "documents_insert" on documents to authenticated;
alter policy "documents_update" on documents to authenticated;
alter policy "documents_delete" on documents to authenticated;
alter policy "deals_select" on deals to authenticated;
alter policy "deals_insert" on deals to authenticated;
alter policy "deals_update" on deals to authenticated;
alter policy "deals_delete" on deals to authenticated;
