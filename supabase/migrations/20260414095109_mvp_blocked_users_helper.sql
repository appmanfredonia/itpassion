-- ItPassion MVP - helper blocchi tra utenti

create or replace function public.are_users_blocked(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as
$$
  select
    a is not null
    and b is not null
    and a <> b
    and exists (
      select 1
      from public.blocked_users bu
      where (bu.blocker_id = a and bu.blocked_id = b)
         or (bu.blocker_id = b and bu.blocked_id = a)
    );
$$;

revoke all on function public.are_users_blocked(uuid, uuid) from public;
grant execute on function public.are_users_blocked(uuid, uuid) to authenticated;
