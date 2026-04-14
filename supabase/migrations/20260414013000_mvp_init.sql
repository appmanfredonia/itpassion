-- ItPassion MVP - auth + onboarding passioni

create table if not exists public.passions (
  slug text primary key,
  name text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_passions (
  user_id uuid not null references auth.users(id) on delete cascade,
  passion_slug text not null references public.passions(slug) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, passion_slug)
);

create index if not exists user_passions_user_id_idx on public.user_passions(user_id);
create index if not exists user_passions_passion_slug_idx on public.user_passions(passion_slug);

alter table public.passions enable row level security;
alter table public.user_passions enable row level security;

do
$$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'passions'
      and policyname = 'passions_select_authenticated'
  ) then
    create policy passions_select_authenticated
      on public.passions
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'passions'
      and policyname = 'passions_insert_authenticated'
  ) then
    create policy passions_insert_authenticated
      on public.passions
      for insert
      to authenticated
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_passions'
      and policyname = 'user_passions_select_own'
  ) then
    create policy user_passions_select_own
      on public.user_passions
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_passions'
      and policyname = 'user_passions_insert_own'
  ) then
    create policy user_passions_insert_own
      on public.user_passions
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_passions'
      and policyname = 'user_passions_delete_own'
  ) then
    create policy user_passions_delete_own
      on public.user_passions
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end
$$;
