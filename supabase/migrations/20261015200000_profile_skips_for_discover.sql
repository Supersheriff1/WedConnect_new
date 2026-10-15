-- Private, persistent "skip" decisions for the Discover feed.
-- A skip is not visible to the skipped profile and never creates a match.
create table if not exists public.profile_skips (
  skipper_id uuid not null references public.profiles(id) on delete cascade,
  skipped_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (skipper_id, skipped_id),
  constraint profile_skips_not_self check (skipper_id <> skipped_id)
);

create index if not exists profile_skips_skipped_id_idx
  on public.profile_skips (skipped_id, created_at desc);

alter table public.profile_skips enable row level security;
revoke all on table public.profile_skips from anon, authenticated;
grant select, insert on table public.profile_skips to authenticated;

drop policy if exists "Users read their own profile skips" on public.profile_skips;
create policy "Users read their own profile skips"
  on public.profile_skips for select to authenticated
  using (skipper_id = (select auth.uid()));

drop policy if exists "Complete profiles can skip opposite roles" on public.profile_skips;
create policy "Complete profiles can skip opposite roles"
  on public.profile_skips for insert to authenticated
  with check (
    skipper_id = (select auth.uid())
    and skipped_id <> (select auth.uid())
    and exists (
      select 1
      from public.profiles skipper
      join public.profiles skipped on skipped.id = profile_skips.skipped_id
      where skipper.id = (select auth.uid())
        and skipper.profile_status = 'complete'
        and skipped.profile_status = 'complete'
        and skipper.role in ('couple', 'photographer')
        and skipped.role in ('couple', 'photographer')
        and skipper.role <> skipped.role
    )
  );
