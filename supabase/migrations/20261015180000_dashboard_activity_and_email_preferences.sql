-- Dashboard activity, first messages, and per-event email preferences.
-- Apply this migration after 20261015160000_couple_ceremony_and_timeline.sql.

-- A recipient can dismiss an incoming one-sided like from their dashboard.
drop policy if exists "Users remove their own likes" on public.profile_likes;
drop policy if exists "Users remove their own or incoming likes" on public.profile_likes;
create policy "Users remove their own or incoming likes"
  on public.profile_likes for delete to authenticated
  using (liker_id = (select auth.uid()) or liked_id = (select auth.uid()));

create table if not exists public.profile_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint profile_messages_not_self check (sender_id <> recipient_id),
  constraint profile_messages_body_length check (char_length(trim(body)) between 1 and 2000)
);

create index if not exists profile_messages_sender_created_idx
  on public.profile_messages (sender_id, created_at desc);
create index if not exists profile_messages_recipient_created_idx
  on public.profile_messages (recipient_id, created_at desc);

alter table public.profile_messages enable row level security;
revoke all on table public.profile_messages from anon, authenticated;
grant select, insert on table public.profile_messages to authenticated;

drop policy if exists "Match participants read messages" on public.profile_messages;
create policy "Match participants read messages"
  on public.profile_messages for select to authenticated
  using (
    (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()))
    and exists (
      select 1 from public.profile_likes sent
      where sent.liker_id = profile_messages.sender_id
        and sent.liked_id = profile_messages.recipient_id
    )
    and exists (
      select 1 from public.profile_likes received
      where received.liker_id = profile_messages.recipient_id
        and received.liked_id = profile_messages.sender_id
    )
  );

drop policy if exists "Matched users send messages" on public.profile_messages;
create policy "Matched users send messages"
  on public.profile_messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and recipient_id <> (select auth.uid())
    and char_length(trim(body)) between 1 and 2000
    and exists (
      select 1 from public.profile_likes sent
      where sent.liker_id = profile_messages.sender_id
        and sent.liked_id = profile_messages.recipient_id
    )
    and exists (
      select 1 from public.profile_likes received
      where received.liker_id = profile_messages.recipient_id
        and received.liked_id = profile_messages.sender_id
    )
  );

create table if not exists public.user_email_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  incoming_likes boolean not null default true,
  new_matches boolean not null default true,
  new_messages boolean not null default true,
  app_news boolean not null default false,
  partner_offers boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_email_preferences enable row level security;
revoke all on table public.user_email_preferences from anon, authenticated;
grant select, insert, update on table public.user_email_preferences to authenticated;

drop policy if exists "Users manage their email preferences" on public.user_email_preferences;
create policy "Users manage their email preferences"
  on public.user_email_preferences for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
