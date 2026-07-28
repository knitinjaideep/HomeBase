-- HomeScope — Notes schema (shared across buyer and homeowner mode)
--
-- A small, freeform notes table. Deliberately mode-neutral (no stage/category
-- reference like `documents` has) so it can safely be a shared nav
-- destination for both HomeScope paths — see docs/WORKSPACE_MODE.md's
-- navigation section. Follows the exact conventions of `documents` in
-- 0001_schema.sql: household-scoped, cascade on household delete, the shared
-- set_updated_at trigger. RLS is enabled here; policies live in 0016,
-- grants in 0017.

create table notes (
  id uuid primary key default gen_random_uuid(),
  "householdId" uuid not null references households(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  title text not null default '',
  body text not null default '',
  pinned boolean not null default false
);
create index notes_household_id_idx on notes("householdId");

alter table notes enable row level security;

create trigger set_updated_at before update on notes
  for each row execute function public.set_updated_at();
