-- HomeScope — Notes: optional context linking, note type, tags, archive
--
-- Extends the existing `notes` table (0015) rather than creating a second
-- notes system. Additive only — every new column has a default, so existing
-- rows read correctly with no backfill (a pre-existing note simply has
-- "contextType" null, i.e. a general workspace note, which is exactly what
-- it already was).
--
-- "contextId" is `text`, not `uuid`: a note can link to a journey stage,
-- whose id is a content slug like "offer-prep.walk-away", not a uuid, so one
-- column has to accommodate both. There is deliberately no foreign key on
-- "contextId" — it is polymorphic (it can point at properties, propertyVisits,
-- deals, documents, or professionals depending on "contextType"), and
-- Postgres has no single-column FK that spans multiple target tables.
-- Resolving whether the linked object still exists — and rendering "original
-- context unavailable" if it does not — happens at the application layer
-- (see src/lib/notes/context.ts), so a note is never deleted or corrupted by
-- the thing it referenced being deleted elsewhere. This mirrors the existing
-- `documents."relatedPropertyId" ... on delete set null` precedent
-- (documents already survive property deletion), generalized to a column
-- that can't use a real FK.
--
-- No RLS or grants changes needed: the existing "notes_select/insert/update/
-- delete" policies (0016) and the table-level grant (0017) already cover
-- every column on this table, including the new ones.

alter table notes
  add column archived boolean not null default false,
  add column "noteType" text not null default 'general'
    check ("noteType" in ('general', 'question', 'observation', 'decision', 'follow-up')),
  add column "contextType" text
    check ("contextType" in (
      'journeyStage', 'property', 'propertyVisit', 'deal',
      'ownedHome', 'maintenanceItem', 'repairProject', 'document', 'professional'
    )),
  add column "contextId" text,
  add column tags text[] not null default '{}',
  add column "authorLabel" text not null default '';

create index notes_context_idx on notes("householdId", "contextType", "contextId");
create index notes_archived_idx on notes("householdId", archived);
