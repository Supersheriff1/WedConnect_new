-- WedConnect's collaboration model: approved image use and free/reduced pricing.
alter table public.couple_profiles
  add column if not exists photo_use_consent boolean not null default false,
  add column if not exists reduced_payment_willingness text;

alter table public.couple_profiles
  drop constraint if exists couple_profiles_reduced_payment_willingness_allowed,
  add constraint couple_profiles_reduced_payment_willingness_allowed
    check (reduced_payment_willingness is null or reduced_payment_willingness in ('yes', 'no', 'depends'));

alter table public.photographer_profiles
  add column if not exists photo_use_approval boolean not null default false,
  add column if not exists compensation_model text;

alter table public.photographer_profiles
  drop constraint if exists photographer_profiles_compensation_model_allowed,
  add constraint photographer_profiles_compensation_model_allowed
    check (compensation_model is null or compensation_model in ('free', 'reduced', 'both'));

-- Preserve the intent of existing compensation data while the user confirms
-- the new collaboration terms in their profile.
update public.couple_profiles
set reduced_payment_willingness = case
  when compensation_budget_max_eur = 0 then 'no'
  when compensation_budget_max_eur > 0 then 'yes'
  else 'depends'
end
where reduced_payment_willingness is null;

update public.photographer_profiles
set compensation_model = case
  when compensation_type = 'free' then 'free'
  when compensation_type in ('fixed', 'negotiable') then 'reduced'
  else null
end
where compensation_model is null;

comment on column public.couple_profiles.photo_use_consent is
  'The couple agrees in principle that the photographer may use selected photos, subject to the couple approving each photo before publication.';
comment on column public.couple_profiles.reduced_payment_willingness is
  'Whether the couple is willing to consider a reduced contribution: yes, no, or depends on scope and offer.';
comment on column public.photographer_profiles.photo_use_approval is
  'The photographer agrees to show selected photos to the couple for approval before publication.';
comment on column public.photographer_profiles.compensation_model is
  'Collaboration offers: free (TFP), reduced price, or both. Exact reduced pricing depends on scope and is agreed in chat.';

create or replace function public.invalidate_profile_without_collaboration_terms()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'couple_profiles' then
    if new.photo_use_consent is not true
      or new.reduced_payment_willingness is null
      or new.reduced_payment_willingness not in ('yes', 'no', 'depends') then
      update public.profiles
      set profile_status = 'incomplete', completed_at = null
      where id = new.id and profile_status = 'complete';
    end if;
  elsif tg_table_name = 'photographer_profiles' then
    if new.photo_use_approval is not true
      or new.compensation_model is null
      or new.compensation_model not in ('free', 'reduced', 'both') then
      update public.profiles
      set profile_status = 'incomplete', completed_at = null
      where id = new.id and profile_status = 'complete';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists couple_profiles_require_collaboration_terms on public.couple_profiles;
create trigger couple_profiles_require_collaboration_terms
before insert or update on public.couple_profiles
for each row execute function public.invalidate_profile_without_collaboration_terms();

drop trigger if exists photographer_profiles_require_collaboration_terms on public.photographer_profiles;
create trigger photographer_profiles_require_collaboration_terms
before insert or update on public.photographer_profiles
for each row execute function public.invalidate_profile_without_collaboration_terms();

-- Existing completed profiles must explicitly confirm the new required terms
-- before they re-enter Discover. Their saved profile data and photos remain.
update public.profiles
set profile_status = 'incomplete', completed_at = null
where profile_status = 'complete'
  and (
    (role = 'couple' and exists (
      select 1 from public.couple_profiles cp
      where cp.id = profiles.id
        and (not cp.photo_use_consent or cp.reduced_payment_willingness is null)
    ))
    or
    (role = 'photographer' and exists (
      select 1 from public.photographer_profiles pp
      where pp.id = profiles.id
        and (not pp.photo_use_approval or pp.compensation_model is null)
    ))
  );

-- Enforce the new profile requirements on the server when completing a profile.
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

  select role into current_role
  from public.profiles
  where id = current_user_id
  for update;

  if current_role = 'couple' then
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
  elsif current_role = 'photographer' then
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
  set profile_status = 'complete', completed_at = now()
  where id = current_user_id;
end;
$$;

revoke all on function public.complete_profile() from public, anon;
grant execute on function public.complete_profile() to authenticated;
