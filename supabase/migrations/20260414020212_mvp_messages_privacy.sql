-- ItPassion MVP - messaggi 1:1 e privacy base

create extension if not exists pgcrypto;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint messages_content_not_empty check (char_length(trim(content)) > 0)
);

create table if not exists public.privacy_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  is_profile_private boolean not null default false,
  who_can_message text not null default 'everyone'
    check (who_can_message in ('everyone', 'followers', 'nobody')),
  show_online_status boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.blocked_users (
  blocker_id uuid not null references public.users(id) on delete cascade,
  blocked_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (blocker_id, blocked_id),
  constraint blocked_users_no_self check (blocker_id <> blocked_id)
);

create index if not exists conversations_created_at_idx
  on public.conversations(created_at desc);
create index if not exists conversations_created_by_idx
  on public.conversations(created_by);
create index if not exists conversation_participants_user_idx
  on public.conversation_participants(user_id, conversation_id);
create index if not exists messages_conversation_created_at_idx
  on public.messages(conversation_id, created_at desc);
create index if not exists messages_sender_created_at_idx
  on public.messages(sender_id, created_at desc);
create index if not exists blocked_users_blocked_idx
  on public.blocked_users(blocked_id);

create or replace function public.can_send_direct_message(
  sender uuid,
  recipient uuid
)
returns boolean
language sql
stable
set search_path = public
as
$$
  select
    sender is not null
    and recipient is not null
    and sender <> recipient
    and not exists (
      select 1
      from public.blocked_users bu
      where (bu.blocker_id = sender and bu.blocked_id = recipient)
         or (bu.blocker_id = recipient and bu.blocked_id = sender)
    )
    and (
      coalesce(
        (select ps.who_can_message from public.privacy_settings ps where ps.user_id = recipient),
        'everyone'
      ) = 'everyone'
      or (
        coalesce(
          (select ps.who_can_message from public.privacy_settings ps where ps.user_id = recipient),
          'everyone'
        ) = 'followers'
        and exists (
          select 1
          from public.follows f
          where f.follower_id = sender
            and f.following_id = recipient
        )
      )
    );
$$;

create or replace function public.enforce_direct_conversation_max_two()
returns trigger
language plpgsql
set search_path = public
as
$$
declare
  participants_count integer;
begin
  select count(*)
  into participants_count
  from public.conversation_participants cp
  where cp.conversation_id = new.conversation_id;

  if participants_count >= 2 then
    raise exception 'Direct conversation supports max 2 participants';
  end if;

  return new;
end;
$$;

do
$$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'conversation_participants_max_two'
      and tgrelid = 'public.conversation_participants'::regclass
  ) then
    create trigger conversation_participants_max_two
      before insert on public.conversation_participants
      for each row
      execute function public.enforce_direct_conversation_max_two();
  end if;
end;
$$;

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.privacy_settings enable row level security;
alter table public.blocked_users enable row level security;

do
$$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'conversations'
      and policyname = 'conversations_select_participants'
  ) then
    create policy conversations_select_participants
      on public.conversations
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.conversation_participants cp
          where cp.conversation_id = conversations.id
            and cp.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'conversations'
      and policyname = 'conversations_insert_own'
  ) then
    create policy conversations_insert_own
      on public.conversations
      for insert
      to authenticated
      with check (created_by = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'conversation_participants'
      and policyname = 'conversation_participants_select_authenticated'
  ) then
    create policy conversation_participants_select_authenticated
      on public.conversation_participants
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'conversation_participants'
      and policyname = 'conversation_participants_insert_creator'
  ) then
    create policy conversation_participants_insert_creator
      on public.conversation_participants
      for insert
      to authenticated
      with check (
        exists (
          select 1
          from public.conversations c
          where c.id = conversation_participants.conversation_id
            and c.created_by = auth.uid()
        )
        and (
          conversation_participants.user_id = auth.uid()
          or (
            conversation_participants.user_id <> auth.uid()
            and public.can_send_direct_message(auth.uid(), conversation_participants.user_id)
          )
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'messages'
      and policyname = 'messages_select_participants'
  ) then
    create policy messages_select_participants
      on public.messages
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.conversation_participants cp
          where cp.conversation_id = messages.conversation_id
            and cp.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'messages'
      and policyname = 'messages_insert_sender'
  ) then
    create policy messages_insert_sender
      on public.messages
      for insert
      to authenticated
      with check (
        sender_id = auth.uid()
        and exists (
          select 1
          from public.conversation_participants cp
          where cp.conversation_id = messages.conversation_id
            and cp.user_id = auth.uid()
        )
        and exists (
          select 1
          from public.conversation_participants other
          where other.conversation_id = messages.conversation_id
            and other.user_id <> auth.uid()
            and public.can_send_direct_message(auth.uid(), other.user_id)
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'privacy_settings'
      and policyname = 'privacy_settings_select_authenticated'
  ) then
    create policy privacy_settings_select_authenticated
      on public.privacy_settings
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'privacy_settings'
      and policyname = 'privacy_settings_insert_own'
  ) then
    create policy privacy_settings_insert_own
      on public.privacy_settings
      for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'privacy_settings'
      and policyname = 'privacy_settings_update_own'
  ) then
    create policy privacy_settings_update_own
      on public.privacy_settings
      for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'blocked_users'
      and policyname = 'blocked_users_select_related'
  ) then
    create policy blocked_users_select_related
      on public.blocked_users
      for select
      to authenticated
      using (auth.uid() = blocker_id or auth.uid() = blocked_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'blocked_users'
      and policyname = 'blocked_users_insert_own'
  ) then
    create policy blocked_users_insert_own
      on public.blocked_users
      for insert
      to authenticated
      with check (auth.uid() = blocker_id and blocker_id <> blocked_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'blocked_users'
      and policyname = 'blocked_users_delete_own'
  ) then
    create policy blocked_users_delete_own
      on public.blocked_users
      for delete
      to authenticated
      using (auth.uid() = blocker_id);
  end if;
end;
$$;

insert into public.privacy_settings (user_id)
select u.id
from public.users u
left join public.privacy_settings ps on ps.user_id = u.id
where ps.user_id is null;
