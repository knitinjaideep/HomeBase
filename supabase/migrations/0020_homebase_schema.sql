-- HomeScope — HomeBase schema: owned home, maintenance items, repair projects
--
-- The homeowner-mode data model that /homebase and /maintenance were built as
-- placeholders for (see their component comments and docs/WORKSPACE_MODE.md).
-- Follows the exact conventions of 0001_schema.sql / 0015_notes_schema.sql:
-- household-scoped, cascade on household delete, camelCase quoted columns
-- matching the Zod field names exactly, the shared set_updated_at trigger
-- added per-table here (not by editing 0001's trigger-loop DO block — same
-- precedent 0015 followed for notes). RLS is enabled here; policies live in
-- 0021, grants in 0022, backup/restore wiring in 0023.

-- ---------------------------------------------------------------------------
-- ownedHome — a singleton, one row per household (matches "homePreferences"
-- in 0001). Deliberately excludes propertyType/moveInDate (already captured
-- at owner onboarding on "ownerModeProfile", see 0012_workspace_mode_schema)
-- and any photo field (an optional home photo is just a `documents` row with
-- category 'photo' — see the documents changes below).
-- ---------------------------------------------------------------------------

create table "ownedHome" (
  id uuid primary key default gen_random_uuid(),
  "householdId" uuid not null unique references households(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  name text not null default '',
  address text not null default '',
  "yearBuilt" integer,
  "purchaseDate" text,
  "purchasePrice" numeric,
  systems jsonb not null default '[]'::jsonb
);

create trigger set_updated_at before update on "ownedHome"
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- maintenanceItems — recurring-or-one-time maintenance tracking. Status is
-- never "upcoming"/"due" as a persisted value: urgency vs. dueDate is
-- computed at render time only (see src/lib/maintenance/schedule.ts) since
-- this codebase has no cron/scheduled-job infrastructure to flip a stored
-- status as time passes. completionHistory is an embedded append-only log,
-- mirroring the existing "deals"."negotiationLog" jsonb-array precedent.
-- ---------------------------------------------------------------------------

create table "maintenanceItems" (
  id uuid primary key default gen_random_uuid(),
  "householdId" uuid not null references households(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  title text not null,
  "areaOrSystem" text not null default '',
  description text not null default '',
  status text not null default 'active'
    check (status in ('active', 'completed', 'skipped', 'archived')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  "dueDate" text,
  "recurrenceMonths" integer check ("recurrenceMonths" > 0),
  "lastCompletedDate" text,
  "completionHistory" jsonb not null default '[]'::jsonb
);
create index maintenance_items_household_id_idx on "maintenanceItems"("householdId");
create index maintenance_items_status_idx on "maintenanceItems"(status);
create index maintenance_items_due_date_idx on "maintenanceItems"("dueDate");

create trigger set_updated_at before update on "maintenanceItems"
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- repairProjects — a simple repair/project record. Deliberately no
-- dependencies, Gantt charts, complex budgets, or team permissions.
-- ---------------------------------------------------------------------------

create table "repairProjects" (
  id uuid primary key default gen_random_uuid(),
  "householdId" uuid not null references households(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  title text not null,
  description text not null default '',
  status text not null default 'planned'
    check (status in ('planned', 'in-progress', 'completed', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  "startDate" text,
  "completionDate" text,
  "estimatedCost" numeric,
  "actualCost" numeric,
  notes text not null default ''
);
create index repair_projects_household_id_idx on "repairProjects"("householdId");
create index repair_projects_status_idx on "repairProjects"(status);

create trigger set_updated_at before update on "repairProjects"
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- documents — extend with optional links to a maintenance item / repair
-- project (nullable FK, "on delete set null" — matches the existing
-- "relatedPropertyId" convention: a document survives the thing it was
-- about being deleted elsewhere), and widen the category check to add the
-- owner-mode categories. Additive only: every existing category value is
-- preserved, and both new columns default to null so existing rows are
-- unaffected.
-- ---------------------------------------------------------------------------

alter table documents
  add column "relatedMaintenanceItemId" uuid references "maintenanceItems"(id) on delete set null,
  add column "relatedRepairProjectId" uuid references "repairProjects"(id) on delete set null;

create index documents_related_maintenance_item_id_idx on documents("relatedMaintenanceItemId");
create index documents_related_repair_project_id_idx on documents("relatedRepairProjectId");

alter table documents drop constraint documents_category_check;
alter table documents add constraint documents_category_check check (category in (
  'identification', 'income', 'employment', 'attending-contract', 'taxes', 'bank-statements',
  'investment-statements', 'credit', 'preapproval', 'lender-quotes', 'buyer-agreement',
  'property-disclosures', 'offer', 'contract', 'attorney-review', 'inspection', 'appraisal',
  'insurance', 'loan-estimate', 'closing-disclosure', 'closing-documents',
  'warranty', 'receipt', 'manual', 'photo', 'home-record'
));
