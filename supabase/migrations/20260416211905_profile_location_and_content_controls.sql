alter table public.users
  add column if not exists city text,
  add column if not exists province text,
  add column if not exists region text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

create index if not exists users_province_idx on public.users(province);
create index if not exists users_region_idx on public.users(region);

do
$$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'posts'
      and policyname = 'posts_update_own'
  ) then
    create policy posts_update_own
      on public.posts
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'comments'
      and policyname = 'comments_update_own'
  ) then
    create policy comments_update_own
      on public.comments
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id and char_length(trim(content)) > 0);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'post_media'
      and policyname = 'post_media_delete_own'
  ) then
    create policy post_media_delete_own
      on public.post_media
      for delete
      to authenticated
      using (
        exists (
          select 1
          from public.posts p
          where p.id = post_media.post_id
            and p.user_id = auth.uid()
        )
      );
  end if;
end
$$;
