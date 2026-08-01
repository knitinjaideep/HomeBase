-- HomeScope — Documents redesign: expiration/tags/file columns, 4 new
-- owner-mode categories, and a private Storage bucket for real file upload.
--
-- Additive only, same shape as 0020_homebase_schema.sql's documents change:
-- every new column is nullable or defaults, so existing rows are unaffected
-- and no backfill is needed. This is a deliberate reversal of documents'
-- original "index only, no files" design (see lib/models/document.ts) — the
-- app now stores the file itself, not just a reference to where it lives.
-- "storedLocation" (the physical-original note) is kept alongside it rather
-- than replaced, since a household may have only a paper original.
--
-- Category taxonomy stays additive too: every one of the 25 existing values
-- is preserved unchanged. The 4 new values fill genuine gaps in owner-mode
-- coverage (appliance/system docs, repair & renovation paperwork, HOA/condo,
-- utilities) that the existing 5 owner categories (warranty, receipt,
-- manual, photo, home-record) didn't cover. Grouping categories under the
-- section headings a buyer/homeowner actually sees is a UI-layer concern
-- (see src/lib/documents/categories.ts), not a schema concern — no existing
-- category is renamed or removed, so there is no data migration risk.

alter table documents
  add column "expirationDate" text,
  add column tags text[] not null default '{}',
  add column "filePath" text,
  add column "fileName" text,
  add column "fileSize" bigint,
  add column "fileMimeType" text;

create index documents_expiration_date_idx on documents("expirationDate");

alter table documents drop constraint documents_category_check;
alter table documents add constraint documents_category_check check (category in (
  'identification', 'income', 'employment', 'attending-contract', 'taxes', 'bank-statements',
  'investment-statements', 'credit', 'preapproval', 'lender-quotes', 'buyer-agreement',
  'property-disclosures', 'offer', 'contract', 'attorney-review', 'inspection', 'appraisal',
  'insurance', 'loan-estimate', 'closing-disclosure', 'closing-documents',
  'warranty', 'receipt', 'manual', 'photo', 'home-record',
  'appliances-systems', 'repairs-renovations', 'hoa-condo', 'utilities'
));

-- ---------------------------------------------------------------------------
-- Storage: one private bucket for document files. 25MB cap and a restricted
-- MIME allowlist (documents/images only, no executables). Objects are
-- addressed as "{householdId}/{documentId}/{fileName}" — RLS for this bucket
-- (0025) checks household membership against the first path segment.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  26214400,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/heic',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
on conflict (id) do nothing;
