-- Upsert via PostgREST exige constraint UNIQUE (índice parcial não serve para ON CONFLICT).

drop index if exists public.community_activities_source_unique;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'community_activities_user_source_id_key'
  ) then
    alter table public.community_activities
      add constraint community_activities_user_source_id_key
      unique (user_id, source, source_id);
  end if;
end $$;
