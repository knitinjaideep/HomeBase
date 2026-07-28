-- HomeScope — fix digest() pgcrypto resolution in the invite functions
--
-- Same root cause as 0009's gen_random_bytes() fix: 0006 called digest()
-- unqualified in generate_family_invite() and redeem_family_invite(). Both
-- pin search_path = public, but pgcrypto lives in the `extensions` schema on
-- this Supabase project, so the unqualified call fails with
-- "function digest(text, unknown) does not exist". Fully-qualifying each
-- digest() call as extensions.digest() resolves it.
--
-- (Separate from 0009 because 0009 was already applied to the remote before
-- this bug surfaced; an applied migration must not be edited in place.)

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
    values (target_household_id, uid, encode(extensions.digest(code, 'sha256'), 'hex'), now() + interval '24 hours');

  return code;
end;
$$;

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
  hash := encode(extensions.digest(normalized, 'sha256'), 'hex');

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
