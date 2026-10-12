-- Initial private account profile and immutable first role assignment.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text null check (role is null or role in ('couple', 'photographer')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_role text := new.raw_user_meta_data ->> 'account_role';
begin
  if selected_role not in ('couple', 'photographer') then
    selected_role := null;
  end if;

  insert into public.profiles (id, role)
  values (new.id, selected_role)
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

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

  insert into public.profiles (id)
  values (current_user_id)
  on conflict (id) do nothing;

  select role into existing_role
  from public.profiles
  where id = current_user_id
  for update;

  if existing_role is null then
    update public.profiles
    set role = p_role
    where id = current_user_id and role is null;
    return p_role;
  end if;

  if existing_role <> p_role then
    raise exception using message = 'account_role_already_set';
  end if;

  return existing_role;
end;
$$;

revoke all on function public.assign_initial_role(text) from public, anon;
grant execute on function public.assign_initial_role(text) to authenticated;