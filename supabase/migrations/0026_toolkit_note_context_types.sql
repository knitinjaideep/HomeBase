-- HomeScope — Toolkit redesign: 5 new note context types.
--
-- Same additive move 0019_notes_context_and_types.sql made for
-- ownedHome/maintenanceItem/repairProject before those had backing tables:
-- each of these Toolkit tools (Seasonal checklist, Home inventory notes,
-- Contractor comparison notes, Annual home review, Project cost worksheet —
-- see src/lib/toolkit/groups.ts) is a "category only, no specific record"
-- context, always used with contextId null. No backing table needed or
-- planned — see CLAUDE.md's "do not over-engineer" and the decision to
-- reuse the existing generic notes system rather than build 5 bespoke
-- pages. No RLS or grants changes needed: the existing notes_select/insert/
-- update/delete policies (0016) and table-level grant (0017) already cover
-- every value of this column.

-- The constraint name is quoted because Postgres's default naming for an
-- inline column check ("<table>_<column>_check") embeds the column's own
-- case-preserved name, and "contextType" is mixed-case.
alter table notes drop constraint "notes_contextType_check";
alter table notes add constraint "notes_contextType_check" check ("contextType" in (
  'journeyStage', 'property', 'propertyVisit', 'deal',
  'ownedHome', 'maintenanceItem', 'repairProject', 'document', 'professional',
  'homeInventory', 'contractorNotes', 'annualReview', 'seasonalChecklist', 'projectCostWorksheet'
));
