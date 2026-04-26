-- Feed: permitir que usuários autenticados leiam nomes/emails básicos de perfis (join em check-ins)
drop policy if exists "profiles_select_community" on public.profiles;
create policy "profiles_select_community"
  on public.profiles for select
  to authenticated
  using (true);
