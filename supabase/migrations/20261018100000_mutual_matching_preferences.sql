-- Reciprocal matching preferences: couple budget ceiling and photographer usage-rights request.
alter table public.couple_profiles
  add column if not exists compensation_budget_max_eur integer;

alter table public.couple_profiles
  drop constraint if exists couple_profiles_compensation_budget_max_eur_range,
  add constraint couple_profiles_compensation_budget_max_eur_range
    check (compensation_budget_max_eur is null or compensation_budget_max_eur between 0 and 100000);

alter table public.photographer_profiles
  add column if not exists usage_rights_preference text;

alter table public.photographer_profiles
  drop constraint if exists photographer_profiles_usage_rights_preference_allowed,
  add constraint photographer_profiles_usage_rights_preference_allowed
    check (usage_rights_preference is null or usage_rights_preference in ('open', 'case_by_case', 'no'));

comment on column public.couple_profiles.compensation_budget_max_eur is
  'Optional maximum photographer fee the couple is willing to consider, in EUR; zero means unpaid only.';
comment on column public.photographer_profiles.usage_rights_preference is
  'Photographer preference for portfolio use, subject to explicit approval by the couple.';
