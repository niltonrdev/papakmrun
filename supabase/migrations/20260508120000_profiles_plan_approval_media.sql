-- Plan approval workflow, profile fields, and avatar/banner storage

alter table public.profiles
  add column if not exists plan_status text,
  add column if not exists bio text,
  add column if not exists city text,
  add column if not exists country text default 'Brasil',
  add column if not exists avatar_url text,
  add column if not exists banner_url text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_plan_status_chk'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_plan_status_chk
      check (plan_status is null or plan_status in ('pending', 'approved'));
  end if;
end $$;

-- Staff can approve plan students (role/plan_status)
drop policy if exists "profiles_update_staff" on public.profiles;
create policy "profiles_update_staff"
  on public.profiles for update
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

create or replace function public.slugify_profile_id(raw text)
returns text
language plpgsql
immutable
as $$
declare
  s text;
begin
  s := lower(coalesce(trim(raw), ''));
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := regexp_replace(s, '(^-+|-+$)', '', 'g');
  if s = '' then
    s := 'atleta';
  end if;
  return left(s, 48);
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  signup_intent text;
  requested_role text;
  display text;
  slug_base text;
  slug_final text;
  suffix int := 0;
begin
  signup_intent := lower(coalesce(nullif(trim(new.raw_user_meta_data ->> 'signup_intent'), ''), 'social'));
  if signup_intent not in ('social', 'plan') then
    signup_intent := 'social';
  end if;

  display := nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');
  slug_base := slugify_profile_id(coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'athlete_slug'), ''),
    display,
    split_part(coalesce(new.email, 'atleta'), '@', 1)
  ));
  slug_final := slug_base;

  while exists (select 1 from public.profiles p where p.athlete_slug = slug_final and p.id <> new.id) loop
    suffix := suffix + 1;
    slug_final := slug_base || '-' || suffix::text;
  end loop;

  if signup_intent = 'plan' then
    requested_role := 'social';
  else
    requested_role := 'social';
  end if;

  insert into public.profiles (
    id,
    email,
    role,
    athlete_slug,
    display_name,
    plan_status
  )
  values (
    new.id,
    new.email,
    requested_role,
    slug_final,
    display,
    case when signup_intent = 'plan' then 'pending' else null end
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    athlete_slug = coalesce(public.profiles.athlete_slug, excluded.athlete_slug);

  return new;
end;
$$;

-- Storage bucket for profile images (public read)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-media',
  'profile-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profile_media_public_read" on storage.objects;
create policy "profile_media_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'profile-media');

drop policy if exists "profile_media_insert_own" on storage.objects;
create policy "profile_media_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "profile_media_update_own" on storage.objects;
create policy "profile_media_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "profile_media_delete_own" on storage.objects;
create policy "profile_media_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
