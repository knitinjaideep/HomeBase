-- HomeScope — household v2 schema (Stage A: family invites + active household)
--
-- Three changes:
--   1. household_members gets a display-only role (owner/member) — not yet
--      permission-gated anywhere, just shown in the UI. See 0006 for who
--      becomes 'owner' (the household creator) vs 'member' (everyone who
--      joins via an invite).
--   2. household_invites is restructured from an email-preauthorization list
--      (nothing ever wrote to it — see 0006's comment) into a code-based,
--      hashed, one-time, expiring invitation. `email` is kept (nullable) and
--      unused rather than dropped — there is nothing in it to lose, but
--      dropping a column is unnecessary risk for zero benefit.
--   3. user_preferences is new: the minimal "which of my household
--      memberships is active right now" pointer described in the plan.
--      Deliberately ungranted (no GRANT to authenticated) — every read and
--      write goes through the SECURITY DEFINER functions in 0006, so there
--      is nothing for a client to reach directly. RLS is still enabled with
--      zero policies as a second, redundant layer.

alter table household_members
  add column role text not null default 'member' check (role in ('owner', 'member'));

alter table household_invites
  alter column email drop not null;
alter table household_invites
  rename column accepted_at to redeemed_at;
alter table household_invites
  add column code_hash text,
  add column redeemed_by uuid references auth.users(id),
  add column revoked_at timestamptz,
  add column expires_at timestamptz;

drop index if exists household_invites_email_idx;
create unique index household_invites_code_hash_idx on household_invites(code_hash);

create table user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_household_id uuid references households(id) on delete set null,
  "updatedAt" timestamptz not null default now()
);

alter table user_preferences enable row level security;
-- No policies, no grants (see 0008): this table is reachable only through
-- SECURITY DEFINER functions, never directly by the Data API.
