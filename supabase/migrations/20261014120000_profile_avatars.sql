-- Optional personal account photo for menu and chat avatars.
create table if not exists public.profile_avatars (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  object_path text not null unique,
  updated_at timestamptz not null default now(),
  constraint profile_avatars_owner_path check (object_path like user_id::text || '/%')
);

alter table public.profile_avatars enable row level security;

revoke all on table public.profile_avatars from anon, authenticated;
grant select, insert, update, delete on table public.profile_avatars to authenticated;

drop policy if exists "Read own or complete profile avatars" on public.profile_avatars;
create policy "Read own or complete profile avatars"
  on public.profile_avatars for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = profile_avatars.user_id
        and p.profile_status = 'complete'
    )
  );

drop policy if exists "Owners manage own profile avatars" on public.profile_avatars;
create policy "Owners manage own profile avatars"
  on public.profile_avatars for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
