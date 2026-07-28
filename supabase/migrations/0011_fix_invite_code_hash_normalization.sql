-- HomeScope — fix invite code hash normalization mismatch
--
-- 0006's generate_family_invite() stored encode(digest(code, 'sha256')) where
-- `code` is the dash-formatted string returned by generate_invite_code()
-- ("XXXX-XXXX-XXXX-XXXX"). But redeem_family_invite() strips all non-
-- alphanumerics from the user-entered code before hashing (and the client
-- normalizes the same way in api.ts), so it always hashes the dash-less form.
-- The two hashes never match -> every redemption failed with the generic
-- "Invalid, expired, or already-used invitation code". No invite was ever
-- redeemable.
--
-- Fix: hash the NORMALIZED code at generation time so it matches redemption.
-- redeem_family_invite() is already correct and is left unchanged. The dash-
-- formatted code is still returned to the caller for display/sharing.
--
-- Note: invites created before this migration have the old (dash-formatted)
-- hash and remain unredeemable — generate a fresh code after this is applied.

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
    values (
      target_household_id,
      uid,
      encode(extensions.digest(upper(regexp_replace(code, '[^A-Za-z0-9]', '', 'g')), 'sha256'), 'hex'),
      now() + interval '24 hours'
    );

  return code;
end;
$$;
