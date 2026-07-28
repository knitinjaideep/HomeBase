-- HomeScope — household v2 functions (Stage A: family invites + active household)
--
-- All SECURITY DEFINER, all pin search_path, all derive identity solely from
-- auth.uid() — same pattern as is_household_member()/bootstrap_household()/
-- import_household_backup() in 0002_functions.sql. No function here accepts
-- a client-supplied user id.
--
-- bootstrap_household() keeps its existing name and () -> uuid signature but
-- changes behavior: it no longer creates a household when the caller has no
-- membership — it returns null instead, and the app shows an onboarding
-- screen (create vs. join). Household creation is now the separate, explicit
-- create_household(). Keeping the name unchanged lets the app deploy ahead
-- of this migration without breaking (see README "Database change workflow"
-- / docs/SUPABASE_SETUP.md for the exact reasoning).

create or replace function public.bootstrap_household()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  active_id uuid;
  fallback_id uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select active_household_id into active_id from user_preferences where user_id = uid;

  if active_id is not null and exists (
    select 1 from household_members where household_id = active_id and user_id = uid
  ) then
    return active_id;
  end if;

  -- No valid stored preference. Fall back to the caller's own memberships:
  -- normally there's exactly one; if there happen to be several (e.g. an old
  -- accidental household plus a newly-joined real one, mid-repair), pick the
  -- most recently joined and remember it as active going forward. Zero
  -- memberships means the caller has no household yet — return null so the
  -- app shows onboarding instead of guessing.
  select household_id into fallback_id
  from household_members
  where user_id = uid
  order by "createdAt" desc
  limit 1;

  if fallback_id is null then
    return null;
  end if;

  insert into user_preferences (user_id, active_household_id, "updatedAt")
    values (uid, fallback_id, now())
    on conflict (user_id) do update
      set active_household_id = excluded.active_household_id, "updatedAt" = now();

  return fallback_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- create_household — the explicit onboarding action. Sole non-invite path a
-- household is ever created; the caller becomes its owner.
-- ---------------------------------------------------------------------------

create or replace function public.create_household(p_name text default 'Our Household')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_household_id uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into households (name)
    values (coalesce(nullif(trim(p_name), ''), 'Our Household'))
    returning id into new_household_id;

  insert into household_members (household_id, user_id, role)
    values (new_household_id, uid, 'owner');

  insert into user_preferences (user_id, active_household_id, "updatedAt")
    values (uid, new_household_id, now())
    on conflict (user_id) do update
      set active_household_id = excluded.active_household_id, "updatedAt" = now();

  return new_household_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Invite codes — private.generate_invite_code() picks 16 characters from a
-- 32-symbol alphabet (5, `0/O/1/I/L` excluded) via gen_random_bytes(), giving
-- 80 bits of entropy. 256 is evenly divisible by 32, so `% 32` introduces no
-- modulo bias. Formatted XXXX-XXXX-XXXX-XXXX for readability. Lives in the
-- `private` schema (never exposed to PostgREST) — only reachable through
-- generate_family_invite() below.
-- ---------------------------------------------------------------------------

create or replace function private.generate_invite_code()
returns text
language plpgsql
as $$
declare
  alphabet text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  raw bytea := gen_random_bytes(16);
  chars text := '';
  i int;
begin
  for i in 0..15 loop
    chars := chars || substr(alphabet, (get_byte(raw, i) % 32) + 1, 1);
  end loop;
  return substr(chars, 1, 4) || '-' || substr(chars, 5, 4) || '-' || substr(chars, 9, 4) || '-' || substr(chars, 13, 4);
end;
$$;

-- ---------------------------------------------------------------------------
-- generate_family_invite — any existing member may invite (not owner-only;
-- see the plan's "Decisions" section — this is a 2-person household app and
-- locking out the non-owner spouse would be a real usability regression).
-- Returns the plaintext code exactly once; only its sha256 is ever stored.
-- ---------------------------------------------------------------------------

create or replace function public.generate_family_invite()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  target_household_id uuid;
  code text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  target_household_id := public.bootstrap_household();
  if target_household_id is null then
    raise exception 'You must belong to a household before inviting someone';
  end if;

  code := private.generate_invite_code();

  insert into household_invites (household_id, created_by, code_hash, expires_at)
    values (target_household_id, uid, encode(digest(code, 'sha256'), 'hex'), now() + interval '24 hours');

  return code;
end;
$$;

-- ---------------------------------------------------------------------------
-- redeem_family_invite — race-safe via a single atomic UPDATE ... RETURNING:
-- under Postgres's row-level locking, only one concurrent caller's UPDATE
-- can match `redeemed_at IS NULL`; the loser sees zero rows updated and
-- raises. Invalid/expired/revoked/already-redeemed all raise the same
-- generic message, so a failed attempt never reveals which reason applied.
-- ---------------------------------------------------------------------------

create or replace function public.redeem_family_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  normalized text;
  hash text;
  target_household_id uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  normalized := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if normalized = '' then
    raise exception 'Invalid, expired, or already-used invitation code';
  end if;
  hash := encode(digest(normalized, 'sha256'), 'hex');

  update household_invites
    set redeemed_at = now(), redeemed_by = uid
    where code_hash = hash
      and revoked_at is null
      and redeemed_at is null
      and expires_at > now()
    returning household_id into target_household_id;

  if target_household_id is null then
    raise exception 'Invalid, expired, or already-used invitation code';
  end if;

  insert into household_members (household_id, user_id, role)
    values (target_household_id, uid, 'member')
    on conflict (household_id, user_id) do nothing;

  insert into user_preferences (user_id, active_household_id, "updatedAt")
    values (uid, target_household_id, now())
    on conflict (user_id) do update
      set active_household_id = excluded.active_household_id, "updatedAt" = now();

  return target_household_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- revoke_family_invite — any member of the invite's household may revoke a
-- still-pending (not yet redeemed) invite.
-- ---------------------------------------------------------------------------

create or replace function public.revoke_family_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  invite_household_id uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select household_id into invite_household_id from household_invites where id = p_invite_id;

  if invite_household_id is null or not public.is_household_member(invite_household_id) then
    raise exception 'Invitation not found';
  end if;

  update household_invites
    set revoked_at = now()
    where id = p_invite_id and redeemed_at is null and revoked_at is null;
end;
$$;

-- ---------------------------------------------------------------------------
-- list_household_members — the one place the app ever sees another member's
-- email. Reads auth.users, which is otherwise never exposed to the client;
-- safe only because this function is SECURITY DEFINER and scopes strictly to
-- the caller's own active household.
-- ---------------------------------------------------------------------------

create or replace function public.list_household_members()
returns table("userId" uuid, email text, role text, "joinedAt" timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select hm.user_id as "userId", u.email::text, hm.role, hm."createdAt" as "joinedAt"
  from household_members hm
  join auth.users u on u.id = hm.user_id
  where hm.household_id = (
    select active_household_id from user_preferences where user_id = auth.uid()
  )
  order by hm."createdAt" asc;
$$;

revoke all on function public.create_household(text) from public;
revoke all on function public.generate_family_invite() from public;
revoke all on function public.redeem_family_invite(text) from public;
revoke all on function public.revoke_family_invite(uuid) from public;
revoke all on function public.list_household_members() from public;
