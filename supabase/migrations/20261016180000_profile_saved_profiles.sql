-- Private saved profiles for the Discover bookmarks list.
create table if not exists public.profile_saved_profiles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  saved_profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, saved_profile_id),
  constraint profile_saved_profiles_not_self check (user_id <> saved_profile_id)
);

create index if not exists profile_saved_profiles_saved_profile_id_idx
  on public.profile_saved_profiles (saved_profile_id, created_at desc);

alter table public.profile_saved_profiles enable row level security;
revoke all on table public.profile_saved_profiles from anon, authenticated;
grant select, insert, delete on table public.profile_saved_profiles to authenticated;

drop policy if exists "Users read their own saved profiles" on public.profile_saved_profiles;
create policy "Users read their own saved profiles"
  on public.profile_saved_profiles for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Complete profiles can save opposite roles" on public.profile_saved_profiles;
create policy "Complete profiles can save opposite roles"
  on public.profile_saved_profiles for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and saved_profile_id <> (select auth.uid())
    and exists (
      select 1
      from public.profiles saver
      join public.profiles saved on saved.id = profile_saved_profiles.saved_profile_id
      where saver.id = (select auth.uid())
        and saver.profile_status = 'complete'
        and saved.profile_status = 'complete'
        and saver.role in ('couple', 'photographer')
        and saved.role in ('couple', 'photographer')
        and saver.role <> saved.role
    )
    and not exists (
      select 1
      from public.profile_blocks b
      where (b.blocker_id = (select auth.uid()) and b.blocked_id = saved_profile_id)
         or (b.blocker_id = saved_profile_id and b.blocked_id = (select auth.uid()))
    )
  );

drop policy if exists "Users remove their own saved profiles" on public.profile_saved_profiles;
create policy "Users remove their own saved profiles"
  on public.profile_saved_profiles for delete to authenticated
  using (user_id = (select auth.uid()));
