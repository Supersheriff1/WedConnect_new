-- Store portfolio placement as a simple highlight flag: every portfolio photo remains in the gallery.
alter table public.profile_photos
  add column if not exists is_highlight boolean not null default true;

-- Preserve the previous choice where available.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profile_photos'
      and column_name = 'portfolio_placement'
  ) then
    execute 'update public.profile_photos
      set is_highlight = (portfolio_placement in (''highlight'', ''both''))
      where photo_type = ''portfolio''';
  end if;
end
$$;

-- Existing accounts may have marked more than ten photos. Keep the first ten as highlights.
with ranked_highlights as (
  select id,
         row_number() over (partition by user_id order by sort_order, created_at, id) as position
  from public.profile_photos
  where photo_type = 'portfolio' and is_highlight
)
update public.profile_photos photos
set is_highlight = (ranked_highlights.position <= 10)
from ranked_highlights
where photos.id = ranked_highlights.id
  and ranked_highlights.position > 10;

comment on column public.profile_photos.is_highlight is
  'Photographer portfolio photo is also shown in the 4:5 highlights; all portfolio photos remain in the gallery.';

-- Serialize highlight changes per profile and enforce the ten-highlight limit in the database.
create or replace function public.enforce_portfolio_highlight_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  highlight_count integer;
begin
  if new.photo_type <> 'portfolio' or not new.is_highlight then
    return new;
  end if;

  perform 1
  from public.profiles
  where id = new.user_id
  for update;

  select count(*)
    into highlight_count
  from public.profile_photos
  where user_id = new.user_id
    and photo_type = 'portfolio'
    and is_highlight
    and id is distinct from new.id;

  if highlight_count >= 10 then
    raise exception using message = 'portfolio_highlight_limit_10';
  end if;

  return new;
end;
$$;

drop trigger if exists profile_photos_highlight_limit on public.profile_photos;
create trigger profile_photos_highlight_limit
  before insert or update of is_highlight, photo_type on public.profile_photos
  for each row execute function public.enforce_portfolio_highlight_limit();

-- A photographer profile cannot become complete without three selected highlights.
create or replace function public.require_three_highlights_before_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  highlight_count integer;
begin
  if new.profile_status = 'complete'
     and old.profile_status is distinct from 'complete'
     and new.role = 'photographer' then
    select count(*)
      into highlight_count
    from public.profile_photos
    where user_id = new.id
      and photo_type = 'portfolio'
      and is_highlight;

    if highlight_count < 3 then
      raise exception using message = 'portfolio_requires_3_highlights';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_require_three_highlights on public.profiles;
create trigger profiles_require_three_highlights
  before update of profile_status on public.profiles
  for each row execute function public.require_three_highlights_before_completion();
