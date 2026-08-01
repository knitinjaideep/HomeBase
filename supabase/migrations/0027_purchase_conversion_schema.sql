-- HomeScope — buyer-to-homeowner conversion
--
-- Adds a terminal 'purchased' status to properties (the candidate-home
-- table) and an explicit, nullable relationship from "ownedHome" (the
-- homeowner singleton, 0020) back to the property it was promoted from.
-- Deliberately does not merge the two tables or copy data between them —
-- visits, notes, the deal record, and documents all keep pointing at the
-- same property id they always did; only the property's status changes and
-- "ownedHome" gains a pointer to it. See src/lib/purchase/service.ts.

alter table properties drop constraint properties_status_check;
alter table properties add constraint properties_status_check check (status in (
  'saved','researching','tour-scheduled','visited','interested','shortlisted',
  'possible-offer','offer-submitted','rejected','under-contract','purchased','eliminated','archived'
));

alter table "ownedHome" add column "sourcePropertyId" uuid references properties(id) on delete set null;
create index "ownedHome_sourcePropertyId_idx" on "ownedHome"("sourcePropertyId");
