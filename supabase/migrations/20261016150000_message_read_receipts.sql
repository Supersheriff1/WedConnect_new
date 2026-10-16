-- Per-user read receipts for match and support conversations.
create table if not exists public.profile_conversation_reads (
  user_id uuid not null references public.profiles(id) on delete cascade,
  peer_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null,
  primary key (user_id, peer_id),
  constraint profile_conversation_reads_not_self check (user_id <> peer_id)
);

create index if not exists profile_conversation_reads_peer_idx
  on public.profile_conversation_reads (peer_id, user_id);

alter table public.profile_conversation_reads enable row level security;
revoke all on table public.profile_conversation_reads from anon, authenticated;
grant select, insert, update on table public.profile_conversation_reads to authenticated;

drop policy if exists "Matched participants read conversation receipts" on public.profile_conversation_reads;
create policy "Matched participants read conversation receipts"
  on public.profile_conversation_reads for select to authenticated
  using (
    (user_id = (select auth.uid()) or peer_id = (select auth.uid()))
    and exists (
      select 1
      from public.profile_likes a
      join public.profile_likes b on b.liker_id = a.liked_id and b.liked_id = a.liker_id
      where a.liker_id = profile_conversation_reads.user_id
        and a.liked_id = profile_conversation_reads.peer_id
    )
  );

drop policy if exists "Users create own conversation receipts" on public.profile_conversation_reads;
create policy "Users create own conversation receipts"
  on public.profile_conversation_reads for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.profile_likes a
      join public.profile_likes b on b.liker_id = a.liked_id and b.liked_id = a.liker_id
      where a.liker_id = profile_conversation_reads.user_id
        and a.liked_id = profile_conversation_reads.peer_id
    )
  );

drop policy if exists "Users update own conversation receipts" on public.profile_conversation_reads;
create policy "Users update own conversation receipts"
  on public.profile_conversation_reads for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.profile_likes a
      join public.profile_likes b on b.liker_id = a.liked_id and b.liked_id = a.liker_id
      where a.liker_id = profile_conversation_reads.user_id
        and a.liked_id = profile_conversation_reads.peer_id
    )
  );

create table if not exists public.support_thread_reads (
  thread_id uuid not null references public.support_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz not null,
  primary key (thread_id, user_id)
);

create index if not exists support_thread_reads_user_idx
  on public.support_thread_reads (user_id, thread_id);

alter table public.support_thread_reads enable row level security;
revoke all on table public.support_thread_reads from anon, authenticated;
grant select, insert, update on table public.support_thread_reads to authenticated;

drop policy if exists "Support participants read thread receipts" on public.support_thread_reads;
create policy "Support participants read thread receipts"
  on public.support_thread_reads for select to authenticated
  using (
    public.is_wedconnect_support_operator()
    or exists (
      select 1 from public.support_threads t
      where t.id = support_thread_reads.thread_id
        and t.user_id = (select auth.uid())
    )
  );

drop policy if exists "Support participants create own thread receipts" on public.support_thread_reads;
create policy "Support participants create own thread receipts"
  on public.support_thread_reads for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      public.is_wedconnect_support_operator()
      or exists (
        select 1 from public.support_threads t
        where t.id = support_thread_reads.thread_id
          and t.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists "Support participants update own thread receipts" on public.support_thread_reads;
create policy "Support participants update own thread receipts"
  on public.support_thread_reads for update to authenticated
  using (
    user_id = (select auth.uid())
    and (
      public.is_wedconnect_support_operator()
      or exists (
        select 1 from public.support_threads t
        where t.id = support_thread_reads.thread_id
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
        where t.id = support_thread_reads.thread_id
          and t.user_id = (select auth.uid())
      )
    )
  );
