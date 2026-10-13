-- Photographer compensation for the service and image usage rights.
alter table public.photographer_profiles
  add column if not exists compensation_type text
    check (compensation_type is null or compensation_type in ('free', 'fixed', 'negotiable')),
  add column if not exists compensation_amount_eur integer
    check (compensation_amount_eur is null or compensation_amount_eur between 1 and 100000),
  add column if not exists usage_rights_compensation text
    check (usage_rights_compensation is null or usage_rights_compensation in ('yes', 'no'));

alter table public.photographer_profiles
  drop constraint if exists photographer_compensation_amount_consistency;

alter table public.photographer_profiles
  add constraint photographer_compensation_amount_consistency
  check (
    (compensation_type = 'fixed' and compensation_amount_eur is not null)
    or (compensation_type in ('free', 'negotiable') and compensation_amount_eur is null)
    or (compensation_type is null and compensation_amount_eur is null)
  );
