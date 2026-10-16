-- Hide a user's own sent messages only from that user's view.
create table if not exists public.profile_message_hidden (
  user_id uuid not null references public.profiles(id) on delete cascade,
  message_id uuid not null references public.profile_messages(id) on delete cascade,
  hidden_at timestamptz not null default now(),
  primary key (user_id, message_id)
);

create index if not exists profile_message_hidden_user_idx
  on public.profile_message_hidden (user_id);

alter table public.profile_message_hidden enable row level security;
revoke all on table public.profile_message_hidden from anon, authenticated;
grant select, insert, delete on table public.profile_message_hidden to authenticated;

drop policy if exists "Users read own hidden messages" on public.profile_message_hidden;
create policy "Users read own hidden messages"
  on public.profile_message_hidden for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users hide own sent messages" on public.profile_message_hidden;
create policy "Users hide own sent messages"
  on public.profile_message_hidden for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.profile_messages m
      where m.id = profile_message_hidden.message_id
        and m.sender_id = (select auth.uid())
    )
  );

drop policy if exists "Users unhide own message records" on public.profile_message_hidden;
create policy "Users unhide own message records"
  on public.profile_message_hidden for delete to authenticated
  using (user_id = (select auth.uid()));
