-- HomeScope — fix private.generate_invite_code() pgcrypto resolution
--
-- 0006 called gen_random_bytes(16) unqualified. On this Supabase project
-- pgcrypto's functions live in the `extensions` schema (Supabase's default),
-- not `public`. private.generate_invite_code() has no search_path of its
-- own, so it inherits search_path = 'public' from its caller,
-- public.generate_family_invite() (which sets search_path = public), and the
-- unqualified call fails with "function gen_random_bytes(integer) does not
-- exist". Fully-qualifying the call avoids guessing at search_path order.
--
-- NOTE: generate_family_invite()/redeem_family_invite() have the same bug on
-- their digest() calls; that fix lives in 0010 (this migration was already
-- applied by the time the digest() bug surfaced, so it could not be amended).

create or replace function private.generate_invite_code()
returns text
language plpgsql
as $$
declare
  alphabet text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  raw bytea := extensions.gen_random_bytes(16);
  chars text := '';
  i int;
begin
  for i in 0..15 loop
    chars := chars || substr(alphabet, (get_byte(raw, i) % 32) + 1, 1);
  end loop;
  return substr(chars, 1, 4) || '-' || substr(chars, 5, 4) || '-' || substr(chars, 9, 4) || '-' || substr(chars, 13, 4);
end;
$$;
