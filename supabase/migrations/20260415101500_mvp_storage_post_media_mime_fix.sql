-- ItPassion MVP - fix upload media: rimuove il filtro MIME wildcard non compatibile
-- con Storage e mantiene il limite file lato bucket.

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
