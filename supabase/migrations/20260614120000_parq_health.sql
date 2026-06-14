-- PAR-Q (prontidão física) e aprovação de saúde pelo professor

alter table public.profiles
  add column if not exists parq_submitted_at timestamptz,
  add column if not exists parq_answers jsonb,
  add column if not exists health_approved_at timestamptz,
  add column if not exists health_approved_by uuid references public.profiles (id) on delete set null;

create index if not exists profiles_parq_submitted_at_idx
  on public.profiles (parq_submitted_at)
  where parq_submitted_at is not null;

create index if not exists profiles_health_approved_at_idx
  on public.profiles (health_approved_at)
  where health_approved_at is not null;
