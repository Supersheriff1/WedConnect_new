-- Structured photographer profile values for location, experience and visual style.
alter table public.photographer_profiles
  add column if not exists regions text[] not null default '{}',
  add column if not exists experience_years integer,
  add column if not exists weddings_photographed integer,
  add column if not exists styles text[] not null default '{}';

alter table public.photographer_profiles
  drop constraint if exists photographer_profiles_regions_allowed,
  add constraint photographer_profiles_regions_allowed check (
    regions <@ array['AT','BGL','KTN','NOE','OOE','SBG','STMK','TIR','VBG','W']::text[]
    and ('AT' <> all(regions) or cardinality(regions) = 1)
  ),
  drop constraint if exists photographer_profiles_styles_allowed,
  add constraint photographer_profiles_styles_allowed check (
    styles <@ array['documentary','natural','romantic','editorial','fine_art','timeless','modern','moody','light_airy','film','black_white']::text[]
  ),
  drop constraint if exists photographer_profiles_experience_years_range,
  add constraint photographer_profiles_experience_years_range check (
    experience_years is null or experience_years between 0 and 80
  ),
  drop constraint if exists photographer_profiles_weddings_photographed_range,
  add constraint photographer_profiles_weddings_photographed_range check (
    weddings_photographed is null or weddings_photographed between 0 and 10000
  );
