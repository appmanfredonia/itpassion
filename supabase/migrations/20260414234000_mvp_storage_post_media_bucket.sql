-- ItPassion MVP - bucket Storage per media post

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-media',
  'post-media',
  true,
  41943040,
  array[
    'image/*',
    'video/*'
  ]
)
on conflict (id)
do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do
$$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'storage_post_media_select_authenticated'
  ) then
    create policy storage_post_media_select_authenticated
      on storage.objects
      for select
      to authenticated
      using (bucket_id = 'post-media');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'storage_post_media_insert_own'
  ) then
    create policy storage_post_media_insert_own
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'post-media'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'storage_post_media_delete_own'
  ) then
    create policy storage_post_media_delete_own
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'post-media'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end
$$;
