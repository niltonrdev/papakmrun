-- Professor: vínculo aluno↔coach, calendário da planilha, provas do grupo, biblioteca no servidor

alter table public.profiles
  add column if not exists coach_id uuid references public.profiles (id) on delete set null;

create index if not exists profiles_coach_id_idx on public.profiles (coach_id);

alter table public.student_plans
  add column if not exists plan_start_date date;

-- Provas do grupo (editáveis por staff)
create table if not exists public.group_races (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  race_date date,
  location text,
  description text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.group_races enable row level security;

drop policy if exists "group_races_select_auth" on public.group_races;
create policy "group_races_select_auth"
  on public.group_races for select
  to authenticated
  using (true);

drop policy if exists "group_races_write_staff" on public.group_races;
create policy "group_races_write_staff"
  on public.group_races for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Biblioteca do professor (modelos reutilizáveis)
create table if not exists public.coach_library (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  zone_key text default 'z2',
  default_km numeric default 8,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.coach_library enable row level security;

drop policy if exists "coach_library_select_staff" on public.coach_library;
create policy "coach_library_select_staff"
  on public.coach_library for select
  to authenticated
  using (public.is_staff());

drop policy if exists "coach_library_write_staff" on public.coach_library;
create policy "coach_library_write_staff"
  on public.coach_library for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());
