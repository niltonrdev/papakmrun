-- Planilha personalizada por aluno (treinos + zonas calculadas pelo professor)

create table if not exists public.student_plans (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  source_plan_key text,
  weeks jsonb not null default '{}'::jsonb,
  zones jsonb,
  test_distance numeric,
  test_time text,
  v_ref numeric,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create index if not exists student_plans_updated_idx
  on public.student_plans (updated_at desc);

alter table public.student_plans enable row level security;

drop policy if exists "student_plans_select_own" on public.student_plans;
create policy "student_plans_select_own"
  on public.student_plans for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "student_plans_select_staff" on public.student_plans;
create policy "student_plans_select_staff"
  on public.student_plans for select
  to authenticated
  using (public.is_staff());

drop policy if exists "student_plans_write_staff" on public.student_plans;
create policy "student_plans_write_staff"
  on public.student_plans for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());
