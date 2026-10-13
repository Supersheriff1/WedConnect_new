-- Let photographers choose whether each portfolio photo is used as a highlight, gallery photo, or both.
alter table public.profile_photos
  add column if not exists portfolio_placement text not null default 'both'
    check (portfolio_placement in ('highlight', 'gallery', 'both'));

comment on column public.profile_photos.portfolio_placement is
  'Photographer portfolio placement: 4:5 highlight, full-format gallery, or both.';
