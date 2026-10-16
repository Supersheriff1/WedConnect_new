-- Hide match and support conversation history from only the current user's view.
-- New messages after hidden_at start a fresh conversation in that user's inbox.
create table if not exists public.profile_conversation_hidden (
  user_id uuid not null references public.profiles(id) on delete cascade,
  peer_id uuid not null references public.profiles(id) on delete cascade,
  hidden_at timestamptz not null default now(),
  primary key (user_id, peer_id),
  constraint profile_conversation_hidden_not_self check (user_id <> peer_id)
);

create index if not exists profile_conversation_hidden_peer_idx
  on public.profile_conversation_hidden (peer_id, user_id);

alter table public.profile_conversation_hidden enable row level security;
revoke all on table public.profile_conversation_hidden from anon, authenticated;
grant select, insert, update on table public.profile_conversation_hidden to authenticated;

drop policy if exists "Users read their own hidden match conversations" on public.profile_conversation_hidden;
create policy "Users read their own hidden match conversations"
  on public.profile_conversation_hidden for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users hide their own matched conversations" on public.profile_conversation_hidden;
create policy "Users hide their own matched conversations"
  on public.profile_conversation_hidden for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.profile_likes a
      join public.profile_likes b on b.liker_id = a.liked_id and b.liked_id = a.liker_id
      where a.liker_id = profile_conversation_hidden.user_id
        and a.liked_id = profile_conversation_hidden.peer_id
    )
  );

drop policy if exists "Users update their own hidden match conversations" on public.profile_conversation_hidden;
create policy "Users update their own hidden match conversations"
  on public.profile_conversation_hidden for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.profile_likes a
      join public.profile_likes b on b.liker_id = a.liked_id and b.liked_id = a.liker_id
      where a.liker_id = profile_conversation_hidden.user_id
        and a.liked_id = profile_conversation_hidden.peer_id
    )
  );

create table if not exists public.support_thread_hidden (
  thread_id uuid not null references public.support_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  hidden_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create index if not exists support_thread_hidden_user_idx
  on public.support_thread_hidden (user_id, thread_id);

alter table public.support_thread_hidden enable row level security;
revoke all on table public.support_thread_hidden from anon, authenticated;
grant select, insert, update on table public.support_thread_hidden to authenticated;

drop policy if exists "Users read their own hidden support chats" on public.support_thread_hidden;
create policy "Users read their own hidden support chats"
  on public.support_thread_hidden for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Support participants hide their own chat" on public.support_thread_hidden;
create policy "Support participants hide their own chat"
  on public.support_thread_hidden for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      public.is_wedconnect_support_operator()
      or exists (
        select 1 from public.support_threads t
        where t.id = support_thread_hidden.thread_id
          and t.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists "Support participants update their own hidden chat" on public.support_thread_hidden;
create policy "Support participants update their own hidden chat"
  on public.support_thread_hidden for update to authenticated
  using (
    user_id = (select auth.uid())
    and (
      public.is_wedconnect_support_operator()
      or exists (
        select 1 from public.support_threads t
        where t.id = support_thread_hidden.thread_id
          and t.user_id = (select auth.uid())
      )
    )
  )
  with check (
    user_id = (select auth.uid())
    and (
      public.is_wedconnect_support_operator()
      or exists (
        select 1 from public.support_threads t
        where t.id = support_thread_hidden.thread_id
          and t.user_id = (select auth.uid())
      )
    )
  );
