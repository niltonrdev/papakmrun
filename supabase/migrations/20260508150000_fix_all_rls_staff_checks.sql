-- Corrige recursão RLS: qualquer policy em "profiles" que faz SELECT em "profiles"
-- dispara o erro para todos os usuários (incluindo alunos em /perfil).

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'coach')
  );
$$;

revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

-- profiles
drop policy if exists "profiles_select_staff" on public.profiles;
create policy "profiles_select_staff"
  on public.profiles for select
  to authenticated
  using (public.is_staff());

drop policy if exists "profiles_update_staff" on public.profiles;
create policy "profiles_update_staff"
  on public.profiles for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Leitura do próprio perfil sem passar por RLS recursivo (fallback seguro para /api/me)
create or replace function public.get_my_profile()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select to_jsonb(p)
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$;

revoke all on function public.get_my_profile() from public;
grant execute on function public.get_my_profile() to authenticated;

-- pain_feedback
drop policy if exists "pain_feedback_select_coach" on public.pain_feedback;
create policy "pain_feedback_select_coach"
  on public.pain_feedback for select
  to authenticated
  using (public.is_staff());

drop policy if exists "pain_feedback_update_coach" on public.pain_feedback;
create policy "pain_feedback_update_coach"
  on public.pain_feedback for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- plan_templates
drop policy if exists "plan_templates_write_coach" on public.plan_templates;
create policy "plan_templates_write_coach"
  on public.plan_templates for insert
  to authenticated
  with check (public.is_staff());

drop policy if exists "plan_templates_update_coach" on public.plan_templates;
create policy "plan_templates_update_coach"
  on public.plan_templates for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "plan_templates_delete_coach" on public.plan_templates;
create policy "plan_templates_delete_coach"
  on public.plan_templates for delete
  to authenticated
  using (public.is_staff());

-- club_announcements
drop policy if exists "club_announcements_insert_coach" on public.club_announcements;
create policy "club_announcements_insert_coach"
  on public.club_announcements for insert
  to authenticated
  with check (public.is_staff());
