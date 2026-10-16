-- Contact and feedback channels: authenticated support chat and e-mail threads.
create table if not exists public.support_operators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.support_operators enable row level security;
revoke all on public.support_operators from anon, authenticated;

create or replace function public.is_wedconnect_support_operator()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.support_operators
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_wedconnect_support_operator() from public;
grant execute on function public.is_wedconnect_support_operator() to authenticated;

create table if not exists public.support_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null check (channel in ('chat', 'email')),
  category text not null check (category in ('question', 'feedback', 'issue', 'other')),
  subject text not null default '',
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_type text not null check (sender_type in ('user', 'operator')),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  email_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists support_threads_user_updated_idx
  on public.support_threads(user_id, updated_at desc);
create index if not exists support_messages_thread_created_idx
  on public.support_messages(thread_id, created_at);

alter table public.support_threads enable row level security;
alter table public.support_messages enable row level security;

grant select on public.support_threads to authenticated;
grant select, insert on public.support_messages to authenticated;

drop policy if exists "Users and operators read support threads" on public.support_threads;
create policy "Users and operators read support threads"
  on public.support_threads for select to authenticated
  using (user_id = (select auth.uid()) or public.is_wedconnect_support_operator());

drop policy if exists "Users and operators read support messages" on public.support_messages;
create policy "Users and operators read support messages"
  on public.support_messages for select to authenticated
  using (
    public.is_wedconnect_support_operator()
    or exists (
      select 1 from public.support_threads t
      where t.id = thread_id and t.user_id = (select auth.uid())
    )
  );

drop policy if exists "Thread participants send support messages" on public.support_messages;
create policy "Thread participants send support messages"
  on public.support_messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and (
      (sender_type = 'user' and exists (
        select 1 from public.support_threads t
        where t.id = thread_id and t.user_id = (select auth.uid())
      ))
      or (sender_type = 'operator' and public.is_wedconnect_support_operator())
    )
  );

create or replace function public.touch_support_thread_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.support_threads set updated_at = now() where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists support_message_touches_thread on public.support_messages;
create trigger support_message_touches_thread
  after insert on public.support_messages
  for each row execute function public.touch_support_thread_updated_at();

revoke all on function public.touch_support_thread_updated_at() from public;

create or replace function public.create_support_thread(
  p_channel text,
  p_category text,
  p_subject text,
  p_body text
)
returns table(thread_id uuid, message_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_thread_id uuid;
  new_message_id uuid;
  clean_body text := btrim(coalesce(p_body, ''));
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;
  if p_channel not in ('chat', 'email') then
    raise exception 'Invalid support channel';
  end if;
  if p_category not in ('question', 'feedback', 'issue', 'other') then
    raise exception 'Invalid support category';
  end if;
  if char_length(clean_body) not between 1 and 2000 then
    raise exception 'Message must contain 1 to 2000 characters';
  end if;

  insert into public.support_threads(user_id, channel, category, subject)
  values ((select auth.uid()), p_channel, p_category, left(btrim(coalesce(p_subject, '')), 120))
  returning id into new_thread_id;

  insert into public.support_messages(thread_id, sender_id, sender_type, body)
  values (new_thread_id, (select auth.uid()), 'user', clean_body)
  returning id into new_message_id;

  return query select new_thread_id, new_message_id;
end;
$$;

revoke all on function public.create_support_thread(text, text, text, text) from public;
grant execute on function public.create_support_thread(text, text, text, text) to authenticated;

comment on table public.support_operators is
  'WedConnect operator allowlist. Grant operator access by inserting the authenticated user UUID using the Supabase SQL editor.';
comment on function public.create_support_thread(text, text, text, text) is
  'Creates a private support thread and its first user message atomically.';
