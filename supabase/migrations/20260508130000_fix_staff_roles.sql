-- Garante papel correto para contas staff (útil se o usuário se cadastrou antes do seed)

update public.profiles p
set role = 'admin', plan_status = null, updated_at = now()
from auth.users u
where u.id = p.id and lower(u.email) = 'admin@papakm.com';

update public.profiles p
set role = 'coach', plan_status = null, updated_at = now()
from auth.users u
where u.id = p.id and lower(u.email) in ('prof.eron@papakm.com', 'prof.matheus@papakm.com');
