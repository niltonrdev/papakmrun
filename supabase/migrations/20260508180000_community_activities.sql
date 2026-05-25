-- Atividades agregadas no feed da comunidade (cache de Strava + uploads manuais).

create table if not exists public.community_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source text not null check (source in ('strava', 'manual')),
  source_id text,
  name text,
  date_iso date,
  start_at timestamptz,
  distance_km numeric,
  moving_time_sec integer,
  pace_per_km text,
  elevation_m integer,
  summary_polyline text,
  author_name text,
  created_at timestamptz not null default now()
);

create unique index if not exists community_activities_source_unique
  on public.community_activities (user_id, source, source_id)
  where source_id is not null;

create index if not exists community_activities_recent_idx
  on public.community_activities (date_iso desc nulls last, created_at desc);

create index if not exists community_activities_user_idx
  on public.community_activities (user_id, date_iso desc);

alter table public.community_activities enable row level security;

drop policy if exists "community_activities_select_authenticated" on public.community_activities;
create policy "community_activities_select_authenticated"
  on public.community_activities for select
  to authenticated
  using (true);

drop policy if exists "community_activities_insert_own" on public.community_activities;
create policy "community_activities_insert_own"
  on public.community_activities for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "community_activities_update_own" on public.community_activities;
create policy "community_activities_update_own"
  on public.community_activities for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "community_activities_delete_own_or_staff" on public.community_activities;
create policy "community_activities_delete_own_or_staff"
  on public.community_activities for delete
  to authenticated
  using (auth.uid() = user_id or public.is_staff());
