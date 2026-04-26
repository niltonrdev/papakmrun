-- Planilhas base editáveis, avisos globais, feed (check-ins visíveis), plano escolhido no perfil

alter table public.profiles
  add column if not exists selected_base_plan text;

alter table public.checkins
  add column if not exists workout_title text;

alter table public.checkins
  add column if not exists plan_km numeric;

-- ---------------------------------------------------------------------------
create table if not exists public.plan_templates (
  plan_key text primary key,
  title text not null,
  weeks jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

alter table public.plan_templates enable row level security;

drop policy if exists "plan_templates_select_auth" on public.plan_templates;
create policy "plan_templates_select_auth"
  on public.plan_templates for select
  to authenticated
  using (true);

drop policy if exists "plan_templates_write_coach" on public.plan_templates;
create policy "plan_templates_write_coach"
  on public.plan_templates for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'coach')
    )
  );

create policy "plan_templates_update_coach"
  on public.plan_templates for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'coach')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'coach')
    )
  );

create policy "plan_templates_delete_coach"
  on public.plan_templates for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'coach')
    )
  );

-- ---------------------------------------------------------------------------
create table if not exists public.club_announcements (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.club_announcements enable row level security;

drop policy if exists "club_announcements_select_auth" on public.club_announcements;
create policy "club_announcements_select_auth"
  on public.club_announcements for select
  to authenticated
  using (true);

drop policy if exists "club_announcements_insert_coach" on public.club_announcements;
create policy "club_announcements_insert_coach"
  on public.club_announcements for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'coach')
    )
  );

-- Feed: qualquer usuário autenticado pode ver check-ins da comunidade
drop policy if exists "checkins_select_community" on public.checkins;
create policy "checkins_select_community"
  on public.checkins for select
  to authenticated
  using (true);
