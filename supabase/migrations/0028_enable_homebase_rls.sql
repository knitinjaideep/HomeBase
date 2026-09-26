-- HomeScope — enable RLS on HomeBase tables
--
-- 0020_homebase_schema.sql's header comment claimed "RLS is enabled here,"
-- but never actually ran `enable row level security` on "ownedHome",
-- "maintenanceItems", or "repairProjects" — unlike every other
-- household-owned table (see 0003, 0005, 0012, 0015). 0021 then added the
-- four household-scoped policies per table and 0022 granted
-- select/insert/update/delete to `authenticated`. Because RLS was never
-- turned on, Postgres never evaluated those policies: any authenticated
-- user could read and write every household's rows in these three tables
-- (flagged by Supabase's Security Advisor as "RLS Disabled in Public" /
-- "Policy Exists RLS Disabled"). This migration only flips the missing
-- switch; policies and grants are unchanged.

alter table "ownedHome" enable row level security;
alter table "maintenanceItems" enable row level security;
alter table "repairProjects" enable row level security;
