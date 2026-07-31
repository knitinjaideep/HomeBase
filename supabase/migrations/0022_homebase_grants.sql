-- HomeScope — HomeBase grants
--
-- Explicit Data API grants for "ownedHome", "maintenanceItems",
-- "repairProjects", following 0014/0017's "grant explicitly, to
-- authenticated only" discipline. RLS (0021) remains the actual
-- access-control layer; this grant only lets `authenticated` reach it.
-- (0004's `alter default privileges` already covers any brand-new table
-- automatically, but every prior feature migration has still granted
-- explicitly rather than relying on that alone — followed here too.)

grant select, insert, update, delete on "ownedHome", "maintenanceItems", "repairProjects"
  to authenticated, service_role;
