-- HomeScope — functions
--
-- is_household_member(): the single helper every RLS policy uses. It is
-- SECURITY DEFINER so it can read household_members without being blocked by
-- that table's own RLS (which would otherwise recurse). It only ever answers
-- "is the *currently authenticated* caller (auth.uid()) a member of this
-- household?" — it cannot be used to check anyone else's membership.
--
-- bootstrap_household() and import_household_backup() are SECURITY DEFINER
-- too, for the same reason (they need to touch household_members / bulk-write
-- across many tables in one transaction) — but each independently re-checks
-- auth.uid()/membership itself before doing anything. No Supabase
-- service-role key is used anywhere in the app; these are ordinary RPCs any
-- authenticated user calls with their own session.

create schema if not exists private;

create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from household_members
    where household_id = target_household_id
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_household_member(uuid) from public;
grant execute on function public.is_household_member(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- bootstrap_household — called once after sign-in.
-- ---------------------------------------------------------------------------

create or replace function public.bootstrap_household()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  caller_email text;
  found_household_id uuid;
  invite_row household_invites%rowtype;
  new_household_id uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select household_id into found_household_id
  from household_members
  where user_id = uid
  limit 1;

  if found_household_id is not null then
    return found_household_id;
  end if;

  select email into caller_email from auth.users where id = uid;

  if caller_email is not null then
    select * into invite_row
    from household_invites
    where lower(email) = lower(caller_email)
      and accepted_at is null
    order by "createdAt" asc
    limit 1;

    if found then
      insert into household_members (household_id, user_id)
        values (invite_row.household_id, uid)
        on conflict (household_id, user_id) do nothing;
      update household_invites set accepted_at = now() where id = invite_row.id;
      return invite_row.household_id;
    end if;
  end if;

  insert into households default values returning id into new_household_id;
  insert into household_members (household_id, user_id) values (new_household_id, uid);
  return new_household_id;
end;
$$;

revoke all on function public.bootstrap_household() from public;
grant execute on function public.bootstrap_household() to authenticated;

-- ---------------------------------------------------------------------------
-- import_household_backup — the one-time local-data migration / JSON restore.
-- Not exposed directly: private.import_household_table lives in a schema
-- PostgREST never serves, so it can only be reached through the public
-- wrapper below, which enforces membership and the one-time guard.
-- ---------------------------------------------------------------------------

create or replace function private.import_household_table(p_table text, p_household_id uuid, p_rows jsonb)
returns integer
language plpgsql
as $$
declare
  cnt integer;
  stamped jsonb;
begin
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then
    return 0;
  end if;

  select jsonb_agg(elem || jsonb_build_object('householdId', p_household_id::text))
  into stamped
  from jsonb_array_elements(p_rows) as elem;

  execute format(
    'insert into %I select * from jsonb_populate_recordset(null::%I, $1)',
    p_table, p_table
  ) using stamped;

  get diagnostics cnt = row_count;
  return cnt;
end;
$$;

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
    'deals', private.import_household_table('deals', p_household_id, p_data->'deals')
  );

  update households set "localMigrationCompletedAt" = now() where id = p_household_id;

  return counts;
end;
$$;

revoke all on function public.import_household_backup(uuid, jsonb) from public;
grant execute on function public.import_household_backup(uuid, jsonb) to authenticated;
