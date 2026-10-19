-- Restore role inference during completion while enforcing collaboration terms.
create or replace function public.complete_profile()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  v_current_role text;
  has_couple_profile boolean;
  has_photographer_profile boolean;
  photo_count integer;
begin
  if current_user_id is null then
    raise exception using message = 'not_authenticated';
  end if;

  select role into v_current_role
  from public.profiles
  where id = current_user_id
  for update;

  -- Older or partially-created accounts may have a role-specific profile
  -- without the role copied to public.profiles yet.
  if v_current_role is null then
    select
      exists (select 1 from public.couple_profiles where id = current_user_id),
      exists (select 1 from public.photographer_profiles where id = current_user_id)
    into has_couple_profile, has_photographer_profile;

    if has_couple_profile = has_photographer_profile then
      raise exception using message = 'role_required';
    end if;

    v_current_role := case
      when has_couple_profile then 'couple'
      else 'photographer'
    end;

    insert into public.profiles (id, role)
    values (current_user_id, v_current_role)
    on conflict (id) do update
      set role = excluded.role
      where public.profiles.profile_status is distinct from 'complete'
         or public.profiles.role is null;
  end if;

  if v_current_role = 'couple' then
    if not exists (
      select 1 from public.couple_profiles
      where id = current_user_id
        and photo_use_consent is true
        and reduced_payment_willingness in ('yes', 'no', 'depends')
    ) then
      raise exception using message = 'couple_collaboration_terms_required';
    end if;
    if not exists (select 1 from public.couple_profiles where id = current_user_id) then
      raise exception using message = 'couple_profile_incomplete';
    end if;
    if not exists (
      select 1 from public.profile_photos
      where user_id = current_user_id and photo_type = 'couple'
    ) and (
      not exists (select 1 from public.profile_photos where user_id = current_user_id and photo_type = 'partner_one')
      or not exists (select 1 from public.profile_photos where user_id = current_user_id and photo_type = 'partner_two')
    ) then
      raise exception using message = 'photos_for_both_partners_required';
    end if;
  elsif v_current_role = 'photographer' then
    if not exists (
      select 1 from public.photographer_profiles
      where id = current_user_id
        and photo_use_approval is true
        and compensation_model in ('free', 'reduced', 'both')
    ) then
      raise exception using message = 'photographer_collaboration_terms_required';
    end if;
    if not exists (select 1 from public.photographer_profiles where id = current_user_id) then
      raise exception using message = 'photographer_profile_incomplete';
    end if;
    select count(*) into photo_count
    from public.profile_photos
    where user_id = current_user_id and photo_type = 'portfolio';
    if photo_count < 3 then
      raise exception using message = 'portfolio_requires_3_photos';
    end if;
  else
    raise exception using message = 'role_required';
  end if;

  update public.profiles
  set role = v_current_role, profile_status = 'complete', completed_at = now()
  where id = current_user_id;
end;
$$;

revoke all on function public.complete_profile() from public, anon;
grant execute on function public.complete_profile() to authenticated;
