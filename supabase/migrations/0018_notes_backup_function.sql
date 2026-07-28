-- HomeScope — extend import_household_backup() to cover Notes
--
-- `notes` (0015) is now part of the backup envelope (see
-- src/lib/backup.ts's backupSchema/CLOUD_TABLES), so a JSON restore must also
-- replace/import it — otherwise exporting a backup would capture notes but
-- restoring one would silently drop them. `create or replace function` on the
-- exact function from 0002_functions.sql, additive only: one new `delete`
-- line and one new entry in the returned counts. Everything else is
-- byte-for-byte the same as the current definition.

create or replace function public.import_household_backup(p_household_id uuid, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  counts jsonb;
begin
  if not public.is_household_member(p_household_id) then
    raise exception 'Not a member of this household';
  end if;

  -- This function is intentionally reusable for both the one-time local-data
  -- migration AND the ordinary Settings -> Data -> Import-a-backup-file
  -- restore, so it does not itself guard against being called more than
  -- once. The migration-specific "only once" rule is enforced at the
  -- application level using households."localMigrationCompletedAt" (checked
  -- before the banner is shown, set after a successful migration import) —
  -- see src/lib/migration.ts. A manual restore is deliberately always
  -- allowed; the client already confirms "this replaces everything" first.

  -- Replace whatever data the household already has with the
  -- imported data (never a merge — mirrors the existing local import's
  -- "replaces all current data" behavior).
  delete from notes where "householdId" = p_household_id;
  delete from deals where "householdId" = p_household_id;
  delete from documents where "householdId" = p_household_id;
  delete from resources where "householdId" = p_household_id;
  delete from "attendingTransition" where "householdId" = p_household_id;
  delete from "journeyDecisions" where "householdId" = p_household_id;
  delete from "journeyActions" where "householdId" = p_household_id;
  delete from "journeyStages" where "householdId" = p_household_id;
  delete from towns where "householdId" = p_household_id;
  delete from "checklistTasks" where "householdId" = p_household_id;
  delete from checklists where "householdId" = p_household_id;
  delete from "mortgageApprovals" where "householdId" = p_household_id;
  delete from professionals where "householdId" = p_household_id;
  delete from "lenderQuotes" where "householdId" = p_household_id;
  delete from "mortgageScenarios" where "householdId" = p_household_id;
  delete from "propertyVisits" where "householdId" = p_household_id;
  delete from properties where "householdId" = p_household_id;
  delete from "appSettings" where "householdId" = p_household_id;
  delete from "homePreferences" where "householdId" = p_household_id;
  delete from "financialProfile" where "householdId" = p_household_id;
  delete from "buyerProfile" where "householdId" = p_household_id;

  counts := jsonb_build_object(
    'householdProfile', private.import_household_table('buyerProfile', p_household_id, p_data->'householdProfile'),
    'financialProfile', private.import_household_table('financialProfile', p_household_id, p_data->'financialProfile'),
    'homePreferences', private.import_household_table('homePreferences', p_household_id, p_data->'homePreferences'),
    'appSettings', private.import_household_table('appSettings', p_household_id, p_data->'appSettings'),
    'properties', private.import_household_table('properties', p_household_id, p_data->'properties'),
    'visits', private.import_household_table('propertyVisits', p_household_id, p_data->'visits'),
    'scenarios', private.import_household_table('mortgageScenarios', p_household_id, p_data->'scenarios'),
    'professionals', private.import_household_table('professionals', p_household_id, p_data->'professionals'),
    'lenderQuotes', private.import_household_table('lenderQuotes', p_household_id, p_data->'lenderQuotes'),
    'mortgageApprovals', private.import_household_table('mortgageApprovals', p_household_id, p_data->'mortgageApprovals'),
    'checklists', private.import_household_table('checklists', p_household_id, p_data->'checklists'),
    'tasks', private.import_household_table('checklistTasks', p_household_id, p_data->'tasks'),
    'towns', private.import_household_table('towns', p_household_id, p_data->'towns'),
    'journeyStages', private.import_household_table('journeyStages', p_household_id, p_data->'journeyStages'),
    'journeyActions', private.import_household_table('journeyActions', p_household_id, p_data->'journeyActions'),
    'journeyDecisions', private.import_household_table('journeyDecisions', p_household_id, p_data->'journeyDecisions'),
    'attendingTransition', private.import_household_table('attendingTransition', p_household_id, p_data->'attendingTransition'),
    'resources', private.import_household_table('resources', p_household_id, p_data->'resources'),
    'documents', private.import_household_table('documents', p_household_id, p_data->'documents'),
    'deals', private.import_household_table('deals', p_household_id, p_data->'deals'),
    'notes', private.import_household_table('notes', p_household_id, p_data->'notes')
  );

  update households set "localMigrationCompletedAt" = now() where id = p_household_id;

  return counts;
end;
$$;
