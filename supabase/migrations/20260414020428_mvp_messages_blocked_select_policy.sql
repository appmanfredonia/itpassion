-- ItPassion MVP - enforce blocchi su lettura conversazioni e messaggi

drop policy if exists conversations_select_participants on public.conversations;
create policy conversations_select_participants
  on public.conversations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.conversation_participants me
      where me.conversation_id = conversations.id
        and me.user_id = auth.uid()
    )
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
    exists (
      select 1
      from public.conversation_participants me
      where me.conversation_id = messages.conversation_id
        and me.user_id = auth.uid()
    )
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
