-- HomeScope — workspace mode grants (buyer / homeowner domain foundation)
--
-- Explicit Data API grants for the two new tables, following 0004's
-- "grant explicitly, per table, to authenticated only" discipline. 0004 also
-- set `alter default privileges ... grant ... to authenticated, service_role`,
-- so tables created by the migration role already inherit these grants — but
-- we state them explicitly anyway (re-granting is harmless) so the access
-- model stays legible from the migrations alone rather than depending on a
-- default privilege set several files away. RLS (0013) remains the actual
-- access-control layer; these grants only let `authenticated` reach it.
--
-- households needs no new grant for "activeMode": its existing
-- select/update grant (0004) already covers the column.

grant select, insert, update, delete on
  "buyerModeProfile",
  "ownerModeProfile"
to authenticated, service_role;
