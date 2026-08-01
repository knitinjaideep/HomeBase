-- HomeScope — RLS for the "documents" Storage bucket (0024).
--
-- storage.objects already has RLS enabled by the platform for every
-- project; this only adds the policies for the new bucket. Same
-- membership check every other table's policies use
-- (public.is_household_member), applied to the object path's first
-- segment rather than a "householdId" column, since storage.objects has no
-- such column — see the "{householdId}/{documentId}/{fileName}" convention
-- in src/lib/documents/storage.ts. No separate grants migration: Storage's
-- base authenticated/anon grants on storage.objects are managed by the
-- platform itself, not by application migrations — RLS is the real gate
-- here, same as every other feature's grants file already notes.

create policy "documents_bucket_select" on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents'
    and public.is_household_member(((storage.foldername(name))[1])::uuid)
  );

create policy "documents_bucket_insert" on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and public.is_household_member(((storage.foldername(name))[1])::uuid)
  );

create policy "documents_bucket_update" on storage.objects for update
  to authenticated
  using (
    bucket_id = 'documents'
    and public.is_household_member(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'documents'
    and public.is_household_member(((storage.foldername(name))[1])::uuid)
  );

create policy "documents_bucket_delete" on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'documents'
    and public.is_household_member(((storage.foldername(name))[1])::uuid)
  );
