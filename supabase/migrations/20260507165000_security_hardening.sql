-- Security hardening: role escalation guard, profile privacy, feed denormalization

-- 1) Avoid exposing e-mail in community feed joins.
alter table public.checkins
  add column if not exists author_name text;

update public.checkins c
set author_name = coalesce(
  nullif(trim(p.display_name), ''),
  nullif(trim(p.athlete_slug), ''),
  'Atleta'
)
from public.profiles p
where p.id = c.user_id
  and (c.author_name is null or trim(c.author_name) = '');

-- 2) Remove broad profile visibility for any authenticated user.
drop policy if exists "profiles_select_community" on public.profiles;

-- Allow support/admin screens to read profiles, while normal users keep own-row visibility.
drop policy if exists "profiles_select_staff" on public.profiles;
create policy "profiles_select_staff"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'coach')
    )
  );

-- 3) Lock role values in DB.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_allowed_chk'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_allowed_chk
      check (role in ('social', 'plan', 'coach', 'admin'));
  end if;
end $$;

-- 4) Prevent privilege escalation at signup metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
begin
  requested_role := lower(coalesce(nullif(trim(new.raw_user_meta_data ->> 'role'), ''), 'plan'));
  if requested_role not in ('social', 'plan') then
    requested_role := 'plan';
  end if;

  insert into public.profiles (id, email, role, athlete_slug, display_name)
  values (
    new.id,
    new.email,
    requested_role,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'athlete_slug'), ''), 'nilton-rodrigues'),
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

