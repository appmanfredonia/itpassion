-- ItPassion MVP - restringe select conversation_participants per privacy e blocchi

drop policy if exists conversation_participants_select_authenticated
  on public.conversation_participants;

create policy conversation_participants_select_participants
  on public.conversation_participants
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.conversation_participants me
      where me.conversation_id = conversation_participants.conversation_id
        and me.user_id = auth.uid()
    )
    and (
      conversation_participants.user_id = auth.uid()
      or not exists (
        select 1
        from public.blocked_users bu
        where (bu.blocker_id = auth.uid() and bu.blocked_id = conversation_participants.user_id)
           or (bu.blocker_id = conversation_participants.user_id and bu.blocked_id = auth.uid())
      )
    )
  );
