-- Keep the uploaded original separate from the standardized profile-card image.
-- New display images are JPEGs at 1200 x 800 (3:2); the original remains unchanged.
alter table public.profile_photos
  add column if not exists display_path text;

comment on column public.profile_photos.display_path is
  'Optional 1200x800 JPEG used in profile and swipe cards. object_path always retains the uploaded original.';
