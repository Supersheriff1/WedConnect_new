-- Permit switching profile roles even after a profile has been completed.
-- A real role change resets completion so the new role's profile must be finished
-- before matching is available again. Existing role-specific profile data is retained.
create or replace function public.assign_initial_role(p_role text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  existing_role text;
begin
  if current_user_id is null then
    raise exception using message = 'not_authenticated';
  end if;

  if p_role not in ('couple', 'photographer') then
    raise exception using message = 'invalid_role';
  end if;

  insert into public.profiles (id, role)
  values (current_user_id, p_role)
  on conflict (id) do nothing;

  select role
    into existing_role
  from public.profiles
  where id = current_user_id
  for update;

  if existing_role is distinct from p_role then
    update public.profiles
    set role = p_role,
        profile_status = 'incomplete',
        completed_at = null
    where id = current_user_id;
  end if;

  return p_role;
end;
$$;

revoke all on function public.assign_initial_role(text) from public, anon;
grant execute on function public.assign_initial_role(text) to authenticated;
