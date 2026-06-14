-- Data de nascimento no perfil (cadastro)

alter table public.profiles
  add column if not exists birth_date date;

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
  birth_raw text;
  birth_parsed date;
  slug_base text;
  slug_final text;
  suffix int := 0;
begin
  signup_intent := lower(coalesce(nullif(trim(new.raw_user_meta_data ->> 'signup_intent'), ''), 'social'));
  if signup_intent not in ('social', 'plan') then
    signup_intent := 'social';
  end if;

  display := nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');
  birth_raw := nullif(trim(new.raw_user_meta_data ->> 'birth_date'), '');
  if birth_raw is not null then
    begin
      birth_parsed := birth_raw::date;
    exception when others then
      birth_parsed := null;
    end;
  else
    birth_parsed := null;
  end if;

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

  requested_role := 'social';

  insert into public.profiles (
    id,
    email,
    role,
    athlete_slug,
    display_name,
    plan_status,
    birth_date
  )
  values (
    new.id,
    new.email,
    requested_role,
    slug_final,
    display,
    case when signup_intent = 'plan' then 'pending' else null end,
    birth_parsed
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    athlete_slug = coalesce(public.profiles.athlete_slug, excluded.athlete_slug),
    birth_date = coalesce(excluded.birth_date, public.profiles.birth_date);

  return new;
end;
$$;
