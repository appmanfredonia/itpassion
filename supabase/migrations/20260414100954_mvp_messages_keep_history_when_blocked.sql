-- ItPassion MVP - mantieni visibili conversazioni e storico anche dopo blocco

drop policy if exists conversations_select_participants on public.conversations;
create policy conversations_select_participants
  on public.conversations
  for select
  to authenticated
  using (
    conversations.created_by = auth.uid()
    or public.is_conversation_participant(conversations.id, auth.uid())
  );

drop policy if exists messages_select_participants on public.messages;
create policy messages_select_participants
  on public.messages
  for select
  to authenticated
  using (
    public.is_conversation_participant(messages.conversation_id, auth.uid())
  );
