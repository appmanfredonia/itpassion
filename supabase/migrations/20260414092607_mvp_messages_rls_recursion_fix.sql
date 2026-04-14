-- ItPassion MVP - fix ricorsione RLS conversation_participants (42P17)

create or replace function public.is_conversation_participant(
  p_conversation_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as
$$
  select exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = p_user_id
  );
$$;

revoke all on function public.is_conversation_participant(uuid, uuid) from public;
grant execute on function public.is_conversation_participant(uuid, uuid) to authenticated;

drop policy if exists conversation_participants_select_authenticated
  on public.conversation_participants;
drop policy if exists conversation_participants_select_participants
  on public.conversation_participants;

create policy conversation_participants_select_participants
  on public.conversation_participants
  for select
  to authenticated
  using (
    public.is_conversation_participant(conversation_id, auth.uid())
  );

drop policy if exists conversations_select_participants on public.conversations;
create policy conversations_select_participants
  on public.conversations
  for select
  to authenticated
  using (
    public.is_conversation_participant(conversations.id, auth.uid())
    and exists (
      select 1
      from public.conversation_participants other
      where other.conversation_id = conversations.id
        and other.user_id <> auth.uid()
        and not exists (
          select 1
          from public.blocked_users bu
          where (bu.blocker_id = auth.uid() and bu.blocked_id = other.user_id)
             or (bu.blocker_id = other.user_id and bu.blocked_id = auth.uid())
        )
    )
  );

drop policy if exists messages_select_participants on public.messages;
create policy messages_select_participants
  on public.messages
  for select
  to authenticated
  using (
    public.is_conversation_participant(messages.conversation_id, auth.uid())
    and exists (
      select 1
      from public.conversation_participants other
      where other.conversation_id = messages.conversation_id
        and other.user_id <> auth.uid()
        and not exists (
          select 1
          from public.blocked_users bu
          where (bu.blocker_id = auth.uid() and bu.blocked_id = other.user_id)
             or (bu.blocker_id = other.user_id and bu.blocked_id = auth.uid())
        )
    )
  );

drop policy if exists messages_insert_sender on public.messages;
create policy messages_insert_sender
  on public.messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_conversation_participant(messages.conversation_id, auth.uid())
    and exists (
      select 1
      from public.conversation_participants other
      where other.conversation_id = messages.conversation_id
        and other.user_id <> auth.uid()
        and public.can_send_direct_message(auth.uid(), other.user_id)
    )
  );
