-- Permit saving onboarding data one step at a time.
-- Required details from later wizard steps are validated by complete_profile().
alter table public.couple_profiles
  alter column schedule drop not null,
  alter column coverage_scope drop not null,
  alter column visual_style drop not null,
  alter column image_wishes drop not null,
  alter column photographer_usage_preference drop not null;

alter table public.photographer_profiles
  alter column availability drop not null,
  alter column coverage_scope drop not null;

create or replace function public.complete_profile()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_role text;
  photo_count integer;
begin
  if current_user_id is null then
    raise exception using message = 'not_authenticated';
  end if;

  select role into current_role from public.profiles where id = current_user_id for update;
  if current_role = 'couple' then
    if not exists (
      select 1
      from public.couple_profiles
      where id = current_user_id
        and length(trim(coalesce(partner_one_first_name, ''))) between 1 and 80
        and length(trim(coalesce(partner_two_first_name, ''))) between 1 and 80
        and wedding_date is not null
        and length(trim(coalesce(location, ''))) between 2 and 160
        and guest_count between 1 and 5000
        and length(trim(coalesce(schedule, ''))) between 1 and 4000
        and length(trim(coalesce(coverage_scope, ''))) between 1 and 1200
        and length(trim(coalesce(visual_style, ''))) between 1 and 1200
        and length(trim(coalesce(image_wishes, ''))) between 1 and 2000
        and photographer_usage_preference in ('open', 'case_by_case', 'no')
    ) then
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
  elsif current_role = 'photographer' then
    if not exists (
      select 1
      from public.photographer_profiles
      where id = current_user_id
        and length(trim(coalesce(first_name, ''))) between 1 and 80
        and length(trim(coalesce(region, ''))) between 2 and 160
        and length(trim(coalesce(experience, ''))) between 1 and 2000
        and length(trim(coalesce(visual_style, ''))) between 1 and 1200
        and length(trim(coalesce(availability, ''))) between 1 and 2000
        and length(trim(coalesce(coverage_scope, ''))) between 1 and 1200
        and cardinality(regions) >= 1
        and cardinality(styles) >= 1
        and (experience_years is not null or weddings_photographed is not null)
    ) then
      raise exception using message = 'photographer_profile_incomplete';
    end if;
    select count(*) into photo_count
    from public.profile_photos
    where user_id = current_user_id and photo_type = 'portfolio';
    if photo_count < 10 then
      raise exception using message = 'portfolio_requires_10_photos';
    end if;
  else
    raise exception using message = 'role_required';
  end if;

  update public.profiles
  set profile_status = 'complete', completed_at = now()
  where id = current_user_id;
end;
$$;

revoke all on function public.complete_profile() from public, anon;
grant execute on function public.complete_profile() to authenticated;
