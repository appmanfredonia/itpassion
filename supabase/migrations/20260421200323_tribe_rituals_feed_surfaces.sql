create table if not exists public.tribe_rituals (
  id uuid primary key default gen_random_uuid(),
  tribe_id uuid not null references public.local_tribes(id) on delete cascade,
  creator_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  city text,
  scheduled_for timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint tribe_rituals_title_not_empty check (char_length(trim(title)) between 3 and 120),
  constraint tribe_rituals_description_length check (description is null or char_length(description) <= 600),
  constraint tribe_rituals_city_length check (city is null or char_length(trim(city)) <= 80)
);

create index if not exists tribe_rituals_tribe_id_idx
  on public.tribe_rituals(tribe_id);
create index if not exists tribe_rituals_scheduled_for_idx
  on public.tribe_rituals(scheduled_for asc);
create index if not exists tribe_rituals_creator_id_idx
  on public.tribe_rituals(creator_id);

alter table public.tribe_rituals enable row level security;

do
$$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tribe_rituals'
      and policyname = 'tribe_rituals_select_members'
  ) then
    create policy tribe_rituals_select_members
      on public.tribe_rituals
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.local_tribe_memberships memberships
          where memberships.tribe_id = tribe_rituals.tribe_id
            and memberships.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tribe_rituals'
      and policyname = 'tribe_rituals_insert_members'
  ) then
    create policy tribe_rituals_insert_members
      on public.tribe_rituals
      for insert
      to authenticated
      with check (
        creator_id = auth.uid()
        and exists (
          select 1
          from public.local_tribe_memberships memberships
          where memberships.tribe_id = tribe_rituals.tribe_id
            and memberships.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tribe_rituals'
      and policyname = 'tribe_rituals_update_own'
  ) then
    create policy tribe_rituals_update_own
      on public.tribe_rituals
      for update
      to authenticated
      using (creator_id = auth.uid())
      with check (
        creator_id = auth.uid()
        and exists (
          select 1
          from public.local_tribe_memberships memberships
          where memberships.tribe_id = tribe_rituals.tribe_id
            and memberships.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tribe_rituals'
      and policyname = 'tribe_rituals_delete_own'
  ) then
    create policy tribe_rituals_delete_own
      on public.tribe_rituals
      for delete
      to authenticated
      using (creator_id = auth.uid());
  end if;
end
$$;
