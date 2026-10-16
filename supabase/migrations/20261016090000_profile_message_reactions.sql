-- Add one removable heart reaction per user and message.
create table if not exists public.profile_message_reactions (
  message_id uuid not null references public.profile_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null default 'heart' check (reaction = 'heart'),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, reaction)
);

create index if not exists profile_message_reactions_message_idx
  on public.profile_message_reactions (message_id);

alter table public.profile_message_reactions enable row level security;
revoke all on table public.profile_message_reactions from anon, authenticated;
grant select, insert, delete on table public.profile_message_reactions to authenticated;

drop policy if exists "Matched participants read message reactions" on public.profile_message_reactions;
create policy "Matched participants read message reactions"
  on public.profile_message_reactions for select to authenticated
  using (exists (
    select 1
    from public.profile_messages m
    where m.id = profile_message_reactions.message_id
      and (m.sender_id = (select auth.uid()) or m.recipient_id = (select auth.uid()))
  ));

drop policy if exists "Matched participants add own message reactions" on public.profile_message_reactions;
create policy "Matched participants add own message reactions"
  on public.profile_message_reactions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.profile_messages m
      where m.id = profile_message_reactions.message_id
        and (m.sender_id = (select auth.uid()) or m.recipient_id = (select auth.uid()))
    )
  );

drop policy if exists "Users remove own message reactions" on public.profile_message_reactions;
create policy "Users remove own message reactions"
  on public.profile_message_reactions for delete to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.profile_messages m
      where m.id = profile_message_reactions.message_id
        and (m.sender_id = (select auth.uid()) or m.recipient_id = (select auth.uid()))
    )
  );
