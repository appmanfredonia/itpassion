-- ItPassion MVP - profili e interazioni social base

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  bio text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint users_username_format check (username ~ '^[a-z0-9_.]{3,24}$')
);

create table if not exists public.follows (
  follower_id uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

create table if not exists public.likes (
  post_id uuid not null,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null,
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint comments_content_not_empty check (char_length(trim(content)) > 0)
);

create table if not exists public.saved_posts (
  post_id uuid not null,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, user_id)
);

create index if not exists users_username_idx on public.users(username);
create index if not exists follows_follower_created_idx on public.follows(follower_id, created_at desc);
create index if not exists follows_following_created_idx on public.follows(following_id, created_at desc);
create index if not exists likes_post_created_idx on public.likes(post_id, created_at desc);
create index if not exists comments_post_created_idx on public.comments(post_id, created_at desc);
create index if not exists comments_user_created_idx on public.comments(user_id, created_at desc);
create index if not exists saved_posts_user_created_idx on public.saved_posts(user_id, created_at desc);

alter table public.users enable row level security;
alter table public.follows enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.saved_posts enable row level security;

do
$$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'users'
      and policyname = 'users_select_authenticated'
  ) then
    create policy users_select_authenticated
      on public.users
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'users'
      and policyname = 'users_insert_own'
  ) then
    create policy users_insert_own
      on public.users
      for insert
      to authenticated
      with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'users'
      and policyname = 'users_update_own'
  ) then
    create policy users_update_own
      on public.users
      for update
      to authenticated
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'follows'
      and policyname = 'follows_select_authenticated'
  ) then
    create policy follows_select_authenticated
      on public.follows
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'follows'
      and policyname = 'follows_insert_own'
  ) then
    create policy follows_insert_own
      on public.follows
      for insert
      to authenticated
      with check (auth.uid() = follower_id and follower_id <> following_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'follows'
      and policyname = 'follows_delete_own'
  ) then
    create policy follows_delete_own
      on public.follows
      for delete
      to authenticated
      using (auth.uid() = follower_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'likes'
      and policyname = 'likes_select_authenticated'
  ) then
    create policy likes_select_authenticated
      on public.likes
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'likes'
      and policyname = 'likes_insert_own'
  ) then
    create policy likes_insert_own
      on public.likes
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'likes'
      and policyname = 'likes_delete_own'
  ) then
    create policy likes_delete_own
      on public.likes
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'comments'
      and policyname = 'comments_select_authenticated'
  ) then
    create policy comments_select_authenticated
      on public.comments
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'comments'
      and policyname = 'comments_insert_own'
  ) then
    create policy comments_insert_own
      on public.comments
      for insert
      to authenticated
      with check (auth.uid() = user_id and char_length(trim(content)) > 0);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'comments'
      and policyname = 'comments_delete_own'
  ) then
    create policy comments_delete_own
      on public.comments
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'saved_posts'
      and policyname = 'saved_posts_select_own'
  ) then
    create policy saved_posts_select_own
      on public.saved_posts
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'saved_posts'
      and policyname = 'saved_posts_insert_own'
  ) then
    create policy saved_posts_insert_own
      on public.saved_posts
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'saved_posts'
      and policyname = 'saved_posts_delete_own'
  ) then
    create policy saved_posts_delete_own
      on public.saved_posts
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end
$$;
