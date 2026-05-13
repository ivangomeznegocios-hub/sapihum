create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'::public.user_role
  );
$$;

alter function public.is_current_user_admin() owner to postgres;
revoke all on function public.is_current_user_admin() from public, anon;
grant execute on function public.is_current_user_admin() to authenticated, service_role;

drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;

create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (public.is_current_user_admin());

create policy "Admins can update all profiles"
on public.profiles
for update
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

create or replace function public.current_user_has_role(target_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = target_role
  );
$$;

alter function public.current_user_has_role(public.user_role) owner to postgres;
revoke all on function public.current_user_has_role(public.user_role) from public, anon;
grant execute on function public.current_user_has_role(public.user_role) to authenticated, service_role;

drop policy if exists "Admins can view all relationships" on public.patient_psychologist_relationships;
drop policy if exists "Admins can manage all relationships" on public.patient_psychologist_relationships;
drop policy if exists "Psychologists can create relationships" on public.patient_psychologist_relationships;

create policy "Admins can view all relationships"
on public.patient_psychologist_relationships
for select
to authenticated
using (public.current_user_has_role('admin'::public.user_role));

create policy "Admins can manage all relationships"
on public.patient_psychologist_relationships
for all
to authenticated
using (public.current_user_has_role('admin'::public.user_role))
with check (public.current_user_has_role('admin'::public.user_role));

create policy "Psychologists can create relationships"
on public.patient_psychologist_relationships
for insert
to authenticated
with check (
  psychologist_id = auth.uid()
  and public.current_user_has_role('psychologist'::public.user_role)
);

alter table public.profiles enable row level security;

notify pgrst, 'reload schema';
