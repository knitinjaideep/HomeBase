-- HomeScope — Notes grants
--
-- Explicit Data API grant for `notes`, following 0014's "grant explicitly,
-- to authenticated only" discipline. RLS (0016) remains the actual
-- access-control layer; this grant only lets `authenticated` reach it.

grant select, insert, update, delete on notes to authenticated, service_role;
