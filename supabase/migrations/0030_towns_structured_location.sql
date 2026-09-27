-- HomeScope — structured town selection
--
-- "towns" already holds one row per town the household researches, with a
-- "designation" (considering / primary / backup / ruled-out). The Towns Journey
-- activity now records where each town is, so it can be reused by search, school
-- and commute features instead of living as a bare name.
--
--   state      two-letter US state, '' when unknown (older rows)
--   "refId"    canonical id from the app's bundled town reference list
--              (e.g. 'nj-princeton'); null for custom locations and older rows
--   "isCustom" true when the household typed a location that is not in the list
--   priority   optional 1-based order within its designation; null = unranked
--
-- Additive and backward-compatible: existing rows get the defaults, RLS and the
-- table-level grants on "towns" are unchanged, and nothing is dropped or
-- rewritten. Earlier selections stored in homePreferences."primaryTowns" /
-- "backupTowns" are left untouched; the app adopts them when the activity is saved.

alter table towns
  add column if not exists state text not null default '',
  add column if not exists "refId" text,
  add column if not exists "isCustom" boolean not null default false,
  add column if not exists priority integer;
