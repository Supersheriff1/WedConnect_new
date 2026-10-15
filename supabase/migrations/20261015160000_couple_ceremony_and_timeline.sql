-- Couple profile: structured ceremony type and guided wedding-day timeline.
-- Legacy free-text fields remain available for existing profiles but are no longer shown in the couple form.
alter table public.couple_profiles
  add column if not exists ceremony_type text not null default '',
  add column if not exists schedule_items jsonb not null default '[]'::jsonb,
  add column if not exists ceremony_location text not null default '',
  add column if not exists reception_location text not null default '',
  add column if not exists wedding_town text not null default '';

alter table public.couple_profiles
  drop constraint if exists couple_profiles_ceremony_type_allowed,
  add constraint couple_profiles_ceremony_type_allowed check (
    ceremony_type = '' or ceremony_type in ('civil', 'religious', 'free')
  ),
  drop constraint if exists couple_profiles_schedule_items_array,
  add constraint couple_profiles_schedule_items_array check (
    jsonb_typeof(schedule_items) = 'array' and jsonb_array_length(schedule_items) <= 7
  );

-- These fields are replaced by guided inputs. Keep old data readable, but allow new drafts to omit them.
alter table public.couple_profiles
  alter column visual_style drop not null,
  alter column image_wishes drop not null,
  alter column location drop not null;

-- Preserve existing town/location data when moving it into the clearer field.
update public.couple_profiles
set wedding_town = location
where length(trim(coalesce(wedding_town, ''))) = 0
  and length(trim(coalesce(location, ''))) between 2 and 160;

-- Legacy location is now optional; the wedding town is stored separately.

create or replace function public.complete_profile()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_role text;
  has_couple_profile boolean;
  has_photographer_profile boolean;
  photo_count integer;
begin
  if current_user_id is null then
    raise exception using message = 'not_authenticated';
  end if;

  select role into current_role from public.profiles where id = current_user_id for update;
  if current_role is null then
    select exists (
      select 1 from public.couple_profiles where id = current_user_id
    ), exists (
      select 1 from public.photographer_profiles where id = current_user_id
    )
    into has_couple_profile, has_photographer_profile;

    if has_couple_profile = has_photographer_profile then
      raise exception using message = 'role_required';
    end if;

    current_role := case when has_couple_profile then 'couple' else 'photographer' end;
    insert into public.profiles (id, role)
    values (current_user_id, current_role)
    on conflict (id) do update
      set role = excluded.role
      where public.profiles.profile_status is distinct from 'complete';
  end if;

  if current_role = 'couple' then
    if not exists (
      select 1
      from public.couple_profiles
      where id = current_user_id
        and length(trim(coalesce(partner_one_first_name, ''))) between 1 and 80
        and length(trim(coalesce(partner_two_first_name, ''))) between 1 and 80
        and wedding_date is not null
        and length(trim(coalesce(wedding_town, ''))) between 2 and 160
        and length(trim(coalesce(location, ''))) <= 160
        and length(trim(coalesce(ceremony_location, ''))) <= 160
        and length(trim(coalesce(wedding_town, ''))) <= 160
        and length(trim(coalesce(reception_location, ''))) <= 160
        and guest_count between 1 and 5000
        and region_code in ('BGL','KTN','NOE','OOE','SBG','STMK','TIR','VBG','W')
        and ceremony_type in ('civil', 'religious', 'free')
        and cardinality(coverage_options) >= 1
        and jsonb_typeof(schedule_items) = 'array'
        and length(trim(coalesce(coverage_scope, ''))) between 1 and 1200
        and photographer_usage_preference in ('open', 'case_by_case', 'no')
    ) then
      raise exception using message = 'couple_profile_incomplete';
    end if;
    if (
      (select count(*) from public.profile_photos
       where user_id = current_user_id and photo_type in ('partner_one', 'couple'))
    ) < 1 or (
      (select count(*) from public.profile_photos
       where user_id = current_user_id and photo_type in ('partner_two', 'couple'))
    ) < 1 then
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
        and length(trim(coalesce(coverage_scope, ''))) between 1 and 1200
        and cardinality(regions) >= 1
        and cardinality(styles) >= 1
        and cardinality(coverage_options) >= 1
        and (experience_years is not null or weddings_photographed is not null)
    ) then
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
  set profile_status = 'complete', completed_at = now()
  where id = current_user_id;
end;
$$;

revoke all on function public.complete_profile() from public, anon;
grant execute on function public.complete_profile() to authenticated;

create or replace function public.complete_profile_for_role(p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
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
    set role = excluded.role,
        profile_status = case
          when public.profiles.role is distinct from excluded.role then 'incomplete'
          else public.profiles.profile_status
        end,
        completed_at = case
          when public.profiles.role is distinct from excluded.role then null
          else public.profiles.completed_at
        end;

  perform public.complete_profile();
end;
$$;

revoke all on function public.complete_profile_for_role(text) from public, anon;
grant execute on function public.complete_profile_for_role(text) to authenticated;
