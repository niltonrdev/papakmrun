create table if not exists public.pain_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  athlete_slug text,
  athlete_name text,
  workout_slug text,
  workout_title text,
  workout_date date,
  pain_note text not null,
  effort smallint,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists pain_feedback_created_idx
  on public.pain_feedback (created_at desc);

create index if not exists pain_feedback_user_idx
  on public.pain_feedback (user_id, created_at desc);

alter table public.pain_feedback enable row level security;

drop policy if exists "pain_feedback_insert_own" on public.pain_feedback;
create policy "pain_feedback_insert_own"
  on public.pain_feedback for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "pain_feedback_select_coach" on public.pain_feedback;
create policy "pain_feedback_select_coach"
  on public.pain_feedback for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'coach')
    )
  );

drop policy if exists "pain_feedback_update_coach" on public.pain_feedback;
create policy "pain_feedback_update_coach"
  on public.pain_feedback for update
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

