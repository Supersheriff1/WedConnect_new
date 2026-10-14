-- Structured matching fields for wedding-couple profiles.
-- The public introduction is optional and also used by photographer profiles.
alter table public.couple_profiles
  add column if not exists public_intro text,
  add column if not exists region_code text not null default '',
  add column if not exists coverage_options text[] not null default '{}',
  add column if not exists styles text[] not null default '{}';

alter table public.photographer_profiles
  add column if not exists public_intro text;

alter table public.couple_profiles
  drop constraint if exists couple_profiles_region_code_allowed,
  add constraint couple_profiles_region_code_allowed check (
    region_code = '' or region_code in ('BGL','KTN','NOE','OOE','SBG','STMK','TIR','VBG','W')
  ),
  drop constraint if exists couple_profiles_coverage_options_allowed,
  add constraint couple_profiles_coverage_options_allowed check (
    coverage_options <@ array[
      'pre_wedding','getting_ready','ceremony','couple_photos','reception',
      'dinner_speeches','party','half_day','full_day'
    ]::text[]
  ),
  drop constraint if exists couple_profiles_styles_allowed,
  add constraint couple_profiles_styles_allowed check (
    styles <@ array[
      'documentary','natural','romantic','editorial','fine_art','timeless',
      'modern','moody','light_airy','film','black_white','boho'
    ]::text[]
  );

create index if not exists couple_profiles_region_code_idx
  on public.couple_profiles (region_code);
create index if not exists couple_profiles_coverage_options_idx
  on public.couple_profiles using gin (coverage_options);
create index if not exists couple_profiles_styles_idx
  on public.couple_profiles using gin (styles);

comment on column public.couple_profiles.region_code is
  'Normalized Austrian federal state for profile matching.';
comment on column public.couple_profiles.coverage_options is
  'Structured wedding segments requested by the couple.';
comment on column public.couple_profiles.styles is
  'Structured visual styles preferred by the couple.';

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
        and region_code in ('BGL','KTN','NOE','OOE','SBG','STMK','TIR','VBG','W')
        and cardinality(coverage_options) >= 1
        and cardinality(styles) >= 1
        and length(trim(coalesce(coverage_scope, ''))) between 1 and 1200
        and length(trim(coalesce(visual_style, ''))) between 1 and 1200
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
