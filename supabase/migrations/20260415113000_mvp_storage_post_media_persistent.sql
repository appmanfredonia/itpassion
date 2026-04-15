-- ItPassion MVP - configurazione Storage persistente per bucket post-media
-- Idempotente: puo essere eseguita piu volte senza effetti collaterali.

-- 1) Bucket post-media: pubblico, limite 40MB, nessun filtro MIME wildcard
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-media',
  'post-media',
  true,
  41943040,
  null
)
on conflict (id)
do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2) Policy select / insert / delete riallineate in modo deterministico
drop policy if exists storage_post_media_select_authenticated on storage.objects;
create policy storage_post_media_select_authenticated
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'post-media');

drop policy if exists storage_post_media_insert_own on storage.objects;
create policy storage_post_media_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists storage_post_media_delete_own on storage.objects;
create policy storage_post_media_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
