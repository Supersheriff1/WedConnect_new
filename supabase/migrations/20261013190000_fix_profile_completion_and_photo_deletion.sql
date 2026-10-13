-- Required by the standardized display-image upload flow. Safe if migration 1800 is already applied.
alter table public.profile_photos
  add column if not exists display_path text;

comment on column public.profile_photos.display_path is
  'Optional 1200x800 JPEG used in profile and swipe cards. object_path retains the uploaded original.';

-- Make profile completion atomic with the role selected during onboarding.
-- If the role row is missing, persist the selected role before validating the profile.
create or replace function public.complete_profile_for_role(p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  saved_role text;
begin
  if current_user_id is null then
    raise exception using message = 'not_authenticated';
  end if;

  if p_role not in ('couple', 'photographer') then
    raise exception using message = 'invalid_role';
  end if;

  insert into public.profiles (id, role)
  values (current_user_id, p_role)
  on conflict (id) do update
    set role = excluded.role
    where public.profiles.profile_status is distinct from 'complete';

  select role
    into saved_role
  from public.profiles
  where id = current_user_id
  for update;

  if saved_role is distinct from p_role then
    raise exception using message = 'account_role_already_set';
  end if;

  perform public.complete_profile();
end;
$$;

revoke all on function public.complete_profile_for_role(text) from public, anon;
grant execute on function public.complete_profile_for_role(text) to authenticated;

-- Let each signed-in user remove only their own profile photo records.
alter table public.profile_photos enable row level security;
grant delete, update on table public.profile_photos to authenticated;

drop policy if exists "WedConnect users delete own profile photos" on public.profile_photos;
create policy "WedConnect users delete own profile photos"
  on public.profile_photos
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "WedConnect users update own profile photos" on public.profile_photos;
create policy "WedConnect users update own profile photos"
  on public.profile_photos
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Storage paths begin with the owner UUID. Apply the same restriction to deletions.
drop policy if exists "WedConnect users delete own profile photo files" on storage.objects;
create policy "WedConnect users delete own profile photo files"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'wedconnect-profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
