-- WedConnect role-based onboarding and private profile media.
alter table public.profiles
  add column if not exists profile_status text not null default 'incomplete'
    check (profile_status in ('incomplete', 'complete')),
  add column if not exists completed_at timestamptz;

create table if not exists public.couple_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  partner_one_first_name text not null check (length(trim(partner_one_first_name)) between 1 and 80),
  partner_two_first_name text not null check (length(trim(partner_two_first_name)) between 1 and 80),
  wedding_date date not null,
  location text not null check (length(trim(location)) between 2 and 160),
  guest_count integer not null check (guest_count between 1 and 5000),
  schedule text not null check (length(trim(schedule)) between 1 and 4000),
  coverage_scope text not null check (length(trim(coverage_scope)) between 1 and 1200),
  visual_style text not null check (length(trim(visual_style)) between 1 and 1200),
  image_wishes text not null check (length(trim(image_wishes)) between 1 and 2000),
  photographer_usage_preference text not null check (photographer_usage_preference in ('open', 'case_by_case', 'no')),
  updated_at timestamptz not null default now()
);

alter table public.couple_profiles
  add column if not exists photographer_usage_preference text not null default 'case_by_case'
    check (photographer_usage_preference in ('open', 'case_by_case', 'no'));

create table if not exists public.photographer_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  first_name text not null check (length(trim(first_name)) between 1 and 80),
  region text not null check (length(trim(region)) between 2 and 160),
  experience text not null check (length(trim(experience)) between 1 and 2000),
  visual_style text not null check (length(trim(visual_style)) between 1 and 1200),
  availability text not null check (length(trim(availability)) between 1 and 2000),
  coverage_scope text not null check (length(trim(coverage_scope)) between 1 and 1200),
  instagram_url text null check (
    instagram_url is null or instagram_url ~* '^https?://(www[.])?instagram[.]com/[^[:space:]]+/?$'
  ),
  website_url text null check (
    website_url is null or website_url ~* '^https?://[^[:space:]]+$'
  ),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  photo_type text not null check (photo_type in ('couple', 'partner_one', 'partner_two', 'portfolio')),
  object_path text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  check (object_path like user_id::text || '/%')
);

alter table public.couple_profiles enable row level security;
alter table public.photographer_profiles enable row level security;
alter table public.profile_photos enable row level security;

revoke all on table public.couple_profiles, public.photographer_profiles, public.profile_photos from anon, authenticated;
grant select, insert, update, delete on table public.couple_profiles, public.photographer_profiles, public.profile_photos to authenticated;

drop policy if exists "Read own or complete couple profiles" on public.couple_profiles;
create policy "Read own or complete couple profiles"
  on public.couple_profiles for select to authenticated
  using (id = (select auth.uid()) or exists (
    select 1 from public.profiles p where p.id = couple_profiles.id and p.profile_status = 'complete'
  ));

drop policy if exists "Owners manage own couple profile" on public.couple_profiles;
create policy "Owners manage own couple profile"
  on public.couple_profiles for all to authenticated
  using (id = (select auth.uid()) and exists (
    select 1 from public.profiles p where p.id = couple_profiles.id and p.role = 'couple'
  ))
  with check (id = (select auth.uid()) and exists (
    select 1 from public.profiles p where p.id = couple_profiles.id and p.role = 'couple'
  ));

drop policy if exists "Read own or complete photographer profiles" on public.photographer_profiles;
create policy "Read own or complete photographer profiles"
  on public.photographer_profiles for select to authenticated
  using (id = (select auth.uid()) or exists (
    select 1 from public.profiles p where p.id = photographer_profiles.id and p.profile_status = 'complete'
  ));

drop policy if exists "Owners manage own photographer profile" on public.photographer_profiles;
create policy "Owners manage own photographer profile"
  on public.photographer_profiles for all to authenticated
  using (id = (select auth.uid()) and exists (
    select 1 from public.profiles p where p.id = photographer_profiles.id and p.role = 'photographer'
  ))
  with check (id = (select auth.uid()) and exists (
    select 1 from public.profiles p where p.id = photographer_profiles.id and p.role = 'photographer'
  ));

drop policy if exists "Read own or complete profile photos" on public.profile_photos;
create policy "Read own or complete profile photos"
  on public.profile_photos for select to authenticated
  using (user_id = (select auth.uid()) or exists (
    select 1 from public.profiles p where p.id = profile_photos.user_id and p.profile_status = 'complete'
  ));

drop policy if exists "Owners manage own profile photos" on public.profile_photos;
create policy "Owners manage own profile photos"
  on public.profile_photos for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Authenticated users can read complete profile headers" on public.profiles;
create policy "Authenticated users can read complete profile headers"
  on public.profiles for select to authenticated
  using (profile_status = 'complete');

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
    if not exists (select 1 from public.photographer_profiles where id = current_user_id) then
      raise exception using message = 'photographer_profile_incomplete';
    end if;
    select count(*) into photo_count
    from public.profile_photos
    where user_id = current_user_id and photo_type = 'portfolio';
    if photo_count < 10 then
      raise exception using message = 'portfolio_requires_10_photos';
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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wedconnect-profile-photos', 'wedconnect-profile-photos', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Read own or complete WedConnect profile photos" on storage.objects;
create policy "Read own or complete WedConnect profile photos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'wedconnect-profile-photos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1 from public.profiles p
        where p.id::text = (storage.foldername(name))[1]
          and p.profile_status = 'complete'
      )
    )
  );

drop policy if exists "Upload own WedConnect profile photos" on storage.objects;
create policy "Upload own WedConnect profile photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'wedconnect-profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Update own WedConnect profile photos" on storage.objects;
create policy "Update own WedConnect profile photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'wedconnect-profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'wedconnect-profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Delete own WedConnect profile photos" on storage.objects;
create policy "Delete own WedConnect profile photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'wedconnect-profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
),
  website_url text null check (website_url is null or website_url ~* '^https?://[^[:space:]]+$'),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  photo_type text not null check (photo_type in ('couple', 'partner_one', 'partner_two', 'portfolio')),
  object_path text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  check (object_path like user_id::text || '/%')
);

alter table public.couple_profiles enable row level security;
alter table public.photographer_profiles enable row level security;
alter table public.profile_photos enable row level security;

revoke all on table public.couple_profiles, public.photographer_profiles, public.profile_photos from anon, authenticated;
grant select, insert, update, delete on table public.couple_profiles, public.photographer_profiles, public.profile_photos to authenticated;

drop policy if exists "Read own or complete couple profiles" on public.couple_profiles;
create policy "Read own or complete couple profiles"
  on public.couple_profiles for select to authenticated
  using (id = (select auth.uid()) or exists (
    select 1 from public.profiles p where p.id = couple_profiles.id and p.profile_status = 'complete'
  ));

drop policy if exists "Owners manage own couple profile" on public.couple_profiles;
create policy "Owners manage own couple profile"
  on public.couple_profiles for all to authenticated
  using (id = (select auth.uid()) and exists (
    select 1 from public.profiles p where p.id = couple_profiles.id and p.role = 'couple'
  ))
  with check (id = (select auth.uid()) and exists (
    select 1 from public.profiles p where p.id = couple_profiles.id and p.role = 'couple'
  ));

drop policy if exists "Read own or complete photographer profiles" on public.photographer_profiles;
create policy "Read own or complete photographer profiles"
  on public.photographer_profiles for select to authenticated
  using (id = (select auth.uid()) or exists (
    select 1 from public.profiles p where p.id = photographer_profiles.id and p.profile_status = 'complete'
  ));

drop policy if exists "Owners manage own photographer profile" on public.photographer_profiles;
create policy "Owners manage own photographer profile"
  on public.photographer_profiles for all to authenticated
  using (id = (select auth.uid()) and exists (
    select 1 from public.profiles p where p.id = photographer_profiles.id and p.role = 'photographer'
  ))
  with check (id = (select auth.uid()) and exists (
    select 1 from public.profiles p where p.id = photographer_profiles.id and p.role = 'photographer'
  ));

drop policy if exists "Read own or complete profile photos" on public.profile_photos;
create policy "Read own or complete profile photos"
  on public.profile_photos for select to authenticated
  using (user_id = (select auth.uid()) or exists (
    select 1 from public.profiles p where p.id = profile_photos.user_id and p.profile_status = 'complete'
  ));

drop policy if exists "Owners manage own profile photos" on public.profile_photos;
create policy "Owners manage own profile photos"
  on public.profile_photos for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Authenticated users can read complete profile headers" on public.profiles;
create policy "Authenticated users can read complete profile headers"
  on public.profiles for select to authenticated
  using (profile_status = 'complete');

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
    if not exists (select 1 from public.photographer_profiles where id = current_user_id) then
      raise exception using message = 'photographer_profile_incomplete';
    end if;
    select count(*) into photo_count
    from public.profile_photos
    where user_id = current_user_id and photo_type = 'portfolio';
    if photo_count < 10 then
      raise exception using message = 'portfolio_requires_10_photos';
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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wedconnect-profile-photos', 'wedconnect-profile-photos', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Read own or complete WedConnect profile photos" on storage.objects;
create policy "Read own or complete WedConnect profile photos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'wedconnect-profile-photos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1 from public.profiles p
        where p.id::text = (storage.foldername(name))[1]
          and p.profile_status = 'complete'
      )
    )
  );

drop policy if exists "Upload own WedConnect profile photos" on storage.objects;
create policy "Upload own WedConnect profile photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'wedconnect-profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Update own WedConnect profile photos" on storage.objects;
create policy "Update own WedConnect profile photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'wedconnect-profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'wedconnect-profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Delete own WedConnect profile photos" on storage.objects;
create policy "Delete own WedConnect profile photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'wedconnect-profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
