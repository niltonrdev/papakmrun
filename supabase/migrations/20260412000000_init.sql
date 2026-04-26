-- PapaKM Run — schema inicial (Supabase / Postgres)
-- Rode no SQL Editor do projeto ou via: supabase db push

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  role text not null default 'plan',
  athlete_slug text not null default 'nilton-rodrigues',
  display_name text,
  active_week text default '1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.strava_connections (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  strava_athlete_id bigint not null,
  refresh_token text not null,
  access_token text,
  expires_at timestamptz,
  scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  workout_slug text not null,
  checkin_date date not null,
  effort smallint,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, workout_slug, checkin_date)
);

create index if not exists checkins_user_date_idx on public.checkins (user_id, checkin_date desc);

alter table public.profiles enable row level security;
alter table public.strava_connections enable row level security;
alter table public.checkins enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "strava_all_own" on public.strava_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "checkins_all_own" on public.checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, athlete_slug, display_name)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'role'), ''), 'plan'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'athlete_slug'), ''), 'nilton-rodrigues'),
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
