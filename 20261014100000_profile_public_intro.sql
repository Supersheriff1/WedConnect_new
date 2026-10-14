-- Add optional public introductions to couple and photographer profiles.
alter table public.couple_profiles
  add column if not exists public_intro varchar(1200) not null default '';

alter table public.photographer_profiles
  add column if not exists public_intro varchar(1200) not null default '';

comment on column public.couple_profiles.public_intro is
  'Optional public profile introduction displayed above the couple photos.';

comment on column public.photographer_profiles.public_intro is
  'Optional public profile introduction displayed above portfolio photos.';
