-- Link oficial da prova + confirmações "Eu vou!" dos alunos

alter table public.group_races
  add column if not exists race_url text;

create table if not exists public.group_race_rsvps (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.group_races (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (race_id, user_id)
);

create index if not exists group_race_rsvps_race_id_idx on public.group_race_rsvps (race_id);
create index if not exists group_race_rsvps_user_id_idx on public.group_race_rsvps (user_id);

alter table public.group_race_rsvps enable row level security;

drop policy if exists "group_race_rsvps_select_own" on public.group_race_rsvps;
create policy "group_race_rsvps_select_own"
  on public.group_race_rsvps for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "group_race_rsvps_select_staff" on public.group_race_rsvps;
create policy "group_race_rsvps_select_staff"
  on public.group_race_rsvps for select
  to authenticated
  using (public.is_staff());

drop policy if exists "group_race_rsvps_insert_own" on public.group_race_rsvps;
create policy "group_race_rsvps_insert_own"
  on public.group_race_rsvps for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "group_race_rsvps_delete_own" on public.group_race_rsvps;
create policy "group_race_rsvps_delete_own"
  on public.group_race_rsvps for delete
  to authenticated
  using (auth.uid() = user_id);
