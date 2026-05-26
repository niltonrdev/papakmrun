-- Social feed: likes, comments, RPCs públicos de perfil.

-- =========================================================================
-- 1) Curtidas no feed (likes)
-- =========================================================================
create table if not exists public.feed_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  activity_kind text not null check (activity_kind in ('strava', 'checkin')),
  activity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, activity_kind, activity_id)
);

create index if not exists feed_likes_activity_idx
  on public.feed_likes (activity_kind, activity_id);

alter table public.feed_likes enable row level security;

drop policy if exists "feed_likes_select_authenticated" on public.feed_likes;
create policy "feed_likes_select_authenticated"
  on public.feed_likes for select
  to authenticated
  using (true);

drop policy if exists "feed_likes_insert_own" on public.feed_likes;
create policy "feed_likes_insert_own"
  on public.feed_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "feed_likes_delete_own" on public.feed_likes;
create policy "feed_likes_delete_own"
  on public.feed_likes for delete
  to authenticated
  using (auth.uid() = user_id);

-- =========================================================================
-- 2) Comentários no feed
-- =========================================================================
create table if not exists public.feed_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  activity_kind text not null check (activity_kind in ('strava', 'checkin')),
  activity_id uuid not null,
  body text not null check (char_length(body) between 1 and 800),
  author_name text,
  created_at timestamptz not null default now()
);

create index if not exists feed_comments_activity_idx
  on public.feed_comments (activity_kind, activity_id, created_at);

alter table public.feed_comments enable row level security;

drop policy if exists "feed_comments_select_authenticated" on public.feed_comments;
create policy "feed_comments_select_authenticated"
  on public.feed_comments for select
  to authenticated
  using (true);

drop policy if exists "feed_comments_insert_own" on public.feed_comments;
create policy "feed_comments_insert_own"
  on public.feed_comments for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "feed_comments_delete_own_or_staff" on public.feed_comments;
create policy "feed_comments_delete_own_or_staff"
  on public.feed_comments for delete
  to authenticated
  using (auth.uid() = user_id or public.is_staff());

-- =========================================================================
-- 3) Leitura pública de campos seguros de profiles (sem expor e-mail)
-- =========================================================================
create or replace function public.get_public_profiles(target_ids uuid[])
returns table (
  id uuid,
  display_name text,
  athlete_slug text,
  avatar_url text,
  banner_url text,
  bio text,
  city text,
  country text,
  role text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.display_name,
    p.athlete_slug,
    p.avatar_url,
    p.banner_url,
    p.bio,
    p.city,
    p.country,
    p.role
  from public.profiles p
  where p.id = any(target_ids);
$$;

revoke all on function public.get_public_profiles(uuid[]) from public;
grant execute on function public.get_public_profiles(uuid[]) to authenticated;

create or replace function public.get_public_profile(target_id uuid)
returns table (
  id uuid,
  display_name text,
  athlete_slug text,
  avatar_url text,
  banner_url text,
  bio text,
  city text,
  country text,
  role text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.display_name,
    p.athlete_slug,
    p.avatar_url,
    p.banner_url,
    p.bio,
    p.city,
    p.country,
    p.role,
    p.created_at
  from public.profiles p
  where p.id = target_id
  limit 1;
$$;

revoke all on function public.get_public_profile(uuid) from public;
grant execute on function public.get_public_profile(uuid) to authenticated;
