-- Allow couple profiles to be saved as drafts between onboarding steps.
-- The final completion RPC validates the required structured coverage and style fields.
alter table public.couple_profiles
  drop constraint if exists couple_profiles_schedule_check,
  drop constraint if exists couple_profiles_coverage_scope_check,
  drop constraint if exists couple_profiles_visual_style_check,
  drop constraint if exists couple_profiles_image_wishes_check;

alter table public.couple_profiles
  add constraint couple_profiles_schedule_max_length
    check (schedule is null or length(schedule) <= 4000),
  add constraint couple_profiles_coverage_scope_max_length
    check (coverage_scope is null or length(coverage_scope) <= 1200),
  add constraint couple_profiles_visual_style_max_length
    check (visual_style is null or length(visual_style) <= 1200),
  add constraint couple_profiles_image_wishes_max_length
    check (image_wishes is null or length(image_wishes) <= 2000);
