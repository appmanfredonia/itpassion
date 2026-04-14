-- ItPassion MVP - feed e creazione contenuti

create extension if not exists pgcrypto;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  passion_slug text not null references public.passions(slug) on delete restrict,
  content_type text not null check (content_type in ('text', 'image', 'video')),
  text_content text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  media_url text not null,
  media_kind text not null check (media_kind in ('image', 'video')),
  created_at timestamptz not null default timezone('utc', now())
);

-- FK verso posts aggiunte qui per rispettare l'ordine di creazione su db pulito.
do
$$
begin
  if to_regclass('public.likes') is not null
    and not exists (
      select 1
      from pg_constraint
      where conname = 'likes_post_id_fkey'
        and conrelid = 'public.likes'::regclass
    ) then
    alter table public.likes
      add constraint likes_post_id_fkey
      foreign key (post_id)
      references public.posts(id)
      on delete cascade;
  end if;

  if to_regclass('public.comments') is not null
    and not exists (
      select 1
      from pg_constraint
      where conname = 'comments_post_id_fkey'
        and conrelid = 'public.comments'::regclass
    ) then
    alter table public.comments
      add constraint comments_post_id_fkey
      foreign key (post_id)
      references public.posts(id)
      on delete cascade;
  end if;

  if to_regclass('public.saved_posts') is not null
    and not exists (
      select 1
      from pg_constraint
      where conname = 'saved_posts_post_id_fkey'
        and conrelid = 'public.saved_posts'::regclass
    ) then
    alter table public.saved_posts
      add constraint saved_posts_post_id_fkey
      foreign key (post_id)
      references public.posts(id)
      on delete cascade;
  end if;
end
$$;

create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists posts_user_id_created_at_idx on public.posts(user_id, created_at desc);
create index if not exists posts_passion_slug_created_at_idx on public.posts(passion_slug, created_at desc);
create index if not exists post_media_post_id_idx on public.post_media(post_id);

alter table public.posts enable row level security;
alter table public.post_media enable row level security;

do
$$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'posts'
      and policyname = 'posts_select_authenticated'
  ) then
    create policy posts_select_authenticated
      on public.posts
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'posts'
      and policyname = 'posts_insert_own'
  ) then
    create policy posts_insert_own
      on public.posts
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'posts'
      and policyname = 'posts_delete_own'
  ) then
    create policy posts_delete_own
      on public.posts
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'post_media'
      and policyname = 'post_media_select_authenticated'
  ) then
    create policy post_media_select_authenticated
      on public.post_media
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'post_media'
      and policyname = 'post_media_insert_own'
  ) then
    create policy post_media_insert_own
      on public.post_media
      for insert
      to authenticated
      with check (
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
