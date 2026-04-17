do
$$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_passions'
      and policyname = 'user_passions_select_authenticated'
  ) then
    create policy user_passions_select_authenticated
      on public.user_passions
      for select
      to authenticated
      using (true);
  end if;
end
$$;
