alter table public.tribe_rituals
  add column if not exists place text,
  add column if not exists max_participants integer;

do
$$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tribe_rituals_place_length'
  ) then
    alter table public.tribe_rituals
      add constraint tribe_rituals_place_length
      check (place is null or char_length(trim(place)) between 2 and 120);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'tribe_rituals_max_participants_range'
  ) then
    alter table public.tribe_rituals
      add constraint tribe_rituals_max_participants_range
      check (max_participants is null or max_participants between 2 and 500);
  end if;
end
$$;

create table if not exists public.tribe_ritual_participants (
  ritual_id uuid not null references public.tribe_rituals(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (ritual_id, user_id)
);

create index if not exists tribe_ritual_participants_user_id_idx
  on public.tribe_ritual_participants(user_id);

alter table public.tribe_ritual_participants enable row level security;

do
$$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tribe_ritual_participants'
      and policyname = 'tribe_ritual_participants_select_members'
  ) then
    create policy tribe_ritual_participants_select_members
      on public.tribe_ritual_participants
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.tribe_rituals rituals
          join public.local_tribe_memberships memberships
            on memberships.tribe_id = rituals.tribe_id
          where rituals.id = tribe_ritual_participants.ritual_id
            and memberships.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tribe_ritual_participants'
      and policyname = 'tribe_ritual_participants_insert_own'
  ) then
    create policy tribe_ritual_participants_insert_own
      on public.tribe_ritual_participants
      for insert
      to authenticated
      with check (
        user_id = auth.uid()
        and exists (
          select 1
          from public.tribe_rituals rituals
          join public.local_tribe_memberships memberships
            on memberships.tribe_id = rituals.tribe_id
          where rituals.id = tribe_ritual_participants.ritual_id
            and memberships.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tribe_ritual_participants'
      and policyname = 'tribe_ritual_participants_delete_own'
  ) then
    create policy tribe_ritual_participants_delete_own
      on public.tribe_ritual_participants
      for delete
      to authenticated
      using (user_id = auth.uid());
  end if;
end
$$;
