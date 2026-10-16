-- Private, per-account criteria used to rank Discover profiles.
create table if not exists public.user_discover_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_discover_preferences_preferences_object check (jsonb_typeof(preferences) = 'object')
);

alter table public.user_discover_preferences enable row level security;
revoke all on table public.user_discover_preferences from anon, authenticated;
grant select, insert, update on table public.user_discover_preferences to authenticated;

drop policy if exists "Users read their own discover preferences" on public.user_discover_preferences;
create policy "Users read their own discover preferences"
  on public.user_discover_preferences for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users create their own discover preferences" on public.user_discover_preferences;
create policy "Users create their own discover preferences"
  on public.user_discover_preferences for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users update their own discover preferences" on public.user_discover_preferences;
create policy "Users update their own discover preferences"
  on public.user_discover_preferences for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
