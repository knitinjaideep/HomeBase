-- HomeScope — canonical geographies (U.S. Census-backed locations)
--
-- Shared, read-only reference data: every place and county subdivision the app
-- can offer in the location search. Populated by `npm run sync:geographies`
-- (see README → "Geography data") from the Census Bureau 2025 Geography
-- Information API. Not household data: any signed-in user may read it, only the
-- service role (the sync command) may write it — so there are deliberately no
-- insert/update/delete policies, and no grant to `anon`.
--
-- Identity is the Census GEOID, never the name:
--   place              GEOID = state FIPS (2) + place FIPS (5)
--   county subdivision GEOID = state FIPS (2) + county FIPS (3) + subdivision FIPS (5)
-- Column names follow the rest of the schema (quoted camelCase).
--
-- Also links a household's "towns" row to its geography ("geographyId") and
-- remembers the county for display. Both additive; existing rows are untouched.
-- "towns"."refId" (added in 0030 for a bundled list that no longer exists) is
-- left in place and is no longer used.

create table geographies (
  id uuid primary key default gen_random_uuid(),
  "censusGeographyType" text not null check ("censusGeographyType" in ('place', 'county_subdivision')),
  "censusGeographyLevel" text not null check ("censusGeographyLevel" in ('160', '060')),
  "censusGeoid" text,
  "stateFips" text not null,
  "countyFips" text,
  "placeFips" text,
  "countySubdivisionFips" text,
  -- Official Census NAME, e.g. "Princeton borough, New Jersey"
  name text not null,
  -- Lowercase, punctuation-free, legal descriptor removed: "princeton"
  "normalizedName" text not null,
  -- "Princeton, NJ"
  "displayName" text not null,
  "stateName" text not null,
  "stateAbbreviation" text not null,
  "countyName" text,
  source text not null default 'census' check (source in ('census', 'custom')),
  "sourceVintage" text not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  -- A Census-backed row always has a GEOID; a custom row never gets a fake one.
  check ((source = 'census') = ("censusGeoid" is not null)),
  unique ("censusGeographyLevel", "censusGeoid")
);

-- Search is a case-insensitive prefix match on the normalized name within a state.
create index geographies_state_name_idx on geographies ("stateAbbreviation", "normalizedName" text_pattern_ops);
create index geographies_name_idx on geographies ("normalizedName" text_pattern_ops);
create index geographies_type_idx on geographies ("censusGeographyType");

alter table geographies enable row level security;

create policy "geographies_select" on geographies for select to authenticated using (true);

grant select on geographies to authenticated;
grant select, insert, update, delete on geographies to service_role;

alter table towns
  add column if not exists "geographyId" uuid references geographies(id) on delete set null,
  add column if not exists county text not null default '';

create index if not exists towns_geography_id_idx on towns ("geographyId");
