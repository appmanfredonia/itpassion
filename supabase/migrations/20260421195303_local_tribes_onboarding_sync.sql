create table if not exists public.local_tribes (
  id uuid primary key default gen_random_uuid(),
  passion_slug text not null references public.passions(slug) on delete cascade,
  province text not null,
  province_key text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint local_tribes_unique unique (province_key, passion_slug)
);

create table if not exists public.local_tribe_memberships (
  tribe_id uuid not null references public.local_tribes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (tribe_id, user_id)
);

create index if not exists local_tribes_province_key_idx
  on public.local_tribes(province_key);
create index if not exists local_tribes_passion_slug_idx
  on public.local_tribes(passion_slug);
create index if not exists local_tribe_memberships_user_id_idx
  on public.local_tribe_memberships(user_id);

alter table public.local_tribes enable row level security;
alter table public.local_tribe_memberships enable row level security;

create or replace function public.normalize_local_tribe_province_key(value text)
returns text
language sql
immutable
as
$$
  select nullif(
    regexp_replace(lower(trim(coalesce(value, ''))), '\s+', ' ', 'g'),
    ''
  );
$$;

create or replace function public.sync_user_local_tribes(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as
$$
declare
  v_province text;
  v_province_key text;
  v_membership_count integer := 0;
begin
  if auth.uid() is not null
     and auth.uid() <> p_user_id
     and auth.role() <> 'service_role' then
    raise exception 'not allowed';
  end if;

  if auth.uid() is null
     and coalesce(auth.role(), '') not in ('', 'service_role') then
    raise exception 'not allowed';
  end if;

  select
    users.province,
    public.normalize_local_tribe_province_key(users.province)
  into v_province, v_province_key
  from public.users
  where users.id = p_user_id;

  if not found or v_province_key is null then
    delete from public.local_tribe_memberships
    where user_id = p_user_id;

    return 0;
  end if;

  insert into public.local_tribes (province, province_key, passion_slug)
  select distinct
    v_province,
    v_province_key,
    user_passions.passion_slug
  from public.user_passions
  where user_passions.user_id = p_user_id
  on conflict (province_key, passion_slug)
  do update
  set province = excluded.province,
      updated_at = timezone('utc', now());

  with target_tribes as (
    select local_tribes.id
    from public.local_tribes
    join public.user_passions
      on user_passions.passion_slug = local_tribes.passion_slug
    where user_passions.user_id = p_user_id
      and local_tribes.province_key = v_province_key
  )
  delete from public.local_tribe_memberships
  where user_id = p_user_id
    and not exists (
      select 1
      from target_tribes
      where target_tribes.id = local_tribe_memberships.tribe_id
    );

  with target_tribes as (
    select local_tribes.id
    from public.local_tribes
    join public.user_passions
      on user_passions.passion_slug = local_tribes.passion_slug
    where user_passions.user_id = p_user_id
      and local_tribes.province_key = v_province_key
  )
  insert into public.local_tribe_memberships (tribe_id, user_id)
  select target_tribes.id, p_user_id
  from target_tribes
  on conflict (tribe_id, user_id) do nothing;

  select count(*)
  into v_membership_count
  from public.local_tribe_memberships
  where user_id = p_user_id;

  return v_membership_count;
end;
$$;

revoke all on function public.sync_user_local_tribes(uuid) from public;
grant execute on function public.sync_user_local_tribes(uuid) to authenticated;
grant execute on function public.sync_user_local_tribes(uuid) to service_role;

do
$$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'local_tribes'
      and policyname = 'local_tribes_select_authenticated'
  ) then
    create policy local_tribes_select_authenticated
      on public.local_tribes
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'local_tribe_memberships'
      and policyname = 'local_tribe_memberships_select_own'
  ) then
    create policy local_tribe_memberships_select_own
      on public.local_tribe_memberships
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end
$$;

do
$$
declare
  profile_row record;
begin
  for profile_row in
    select users.id
    from public.users
  loop
    perform public.sync_user_local_tribes(profile_row.id);
  end loop;
end
$$;
