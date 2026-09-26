-- HomeScope — structured activity answers
--
-- Activities can now collect structured answers (see
-- src/components/journey/activity-forms). Answers that are reused elsewhere
-- (commute limit, towns, price range, bedrooms…) stay in their domain tables
-- ("homePreferences", "financialProfile", towns…). Answers that only belong to
-- one activity are stored here, as one JSON object per activity, validated in
-- the app with a per-activity Zod schema.
--
-- Additive and backward-compatible: existing rows get '{}', RLS and grants on
-- "journeyStages" are unchanged (its table-level grants cover the new column),
-- and nothing is dropped or rewritten.

alter table "journeyStages"
  add column if not exists responses jsonb not null default '{}'::jsonb;
