-- ItPassion MVP - fix RLS creazione conversations (insert + returning)

drop policy if exists conversations_insert_own on public.conversations;
drop policy if exists conversations_insert_authenticated on public.conversations;

create policy conversations_insert_authenticated
  on public.conversations
  for insert
  to authenticated
  with check (true);

drop policy if exists conversations_select_participants on public.conversations;
create policy conversations_select_participants
  on public.conversations
  for select
  to authenticated
  using (
    conversations.created_by = auth.uid()
    or (
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
    )
  );
