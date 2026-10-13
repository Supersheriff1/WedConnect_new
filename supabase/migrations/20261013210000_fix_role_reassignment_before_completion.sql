-- Allow users to correct their selected role until the profile is complete.
create or replace function public.assign_initial_role(p_role text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  existing_role text;
  existing_status text;
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

  select role, profile_status
    into existing_role, existing_status
  from public.profiles
  where id = current_user_id
  for update;

  if existing_role is null then
    update public.profiles
    set role = p_role
    where id = current_user_id and role is null;
    return p_role;
  end if;

  if existing_role = p_role then
    return existing_role;
  end if;

  if existing_status = 'complete' then
    raise exception using message = 'account_role_already_set';
  end if;

  update public.profiles
  set role = p_role
  where id = current_user_id;

  return p_role;
end;
$$;

revoke all on function public.assign_initial_role(text) from public, anon;
grant execute on function public.assign_initial_role(text) to authenticated;
