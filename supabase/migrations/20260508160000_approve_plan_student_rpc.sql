-- Aprovação de aluno pendente (evita falha de RLS no UPDATE via API)

create or replace function public.approve_plan_student(target_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  updated public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;

  update public.profiles
  set
    role = 'plan',
    plan_status = 'approved',
    updated_at = now()
  where id = target_id
    and plan_status = 'pending'
  returning * into updated;

  if not found then
    raise exception 'not_pending';
  end if;

  return to_jsonb(updated);
end;
$$;

revoke all on function public.approve_plan_student(uuid) from public;
grant execute on function public.approve_plan_student(uuid) to authenticated;
