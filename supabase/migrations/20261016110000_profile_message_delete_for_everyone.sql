-- Add reversible-by-author soft deletion for all chat participants.
-- The original message text is overwritten so it is no longer retained.
alter table public.profile_messages
  add column if not exists deleted_at timestamptz;

grant update (body, deleted_at) on public.profile_messages to authenticated;

drop policy if exists "Authors delete own messages for everyone" on public.profile_messages;
create policy "Authors delete own messages for everyone"
  on public.profile_messages for update to authenticated
  using (
    sender_id = (select auth.uid())
    and deleted_at is null
  )
  with check (
    sender_id = (select auth.uid())
    and deleted_at is not null
    and body = '[Diese Nachricht wurde gelöscht.]'
  );

create or replace function public.clear_reactions_for_deleted_profile_message()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.deleted_at is null and new.deleted_at is not null then
    delete from public.profile_message_reactions
    where message_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists clear_profile_message_reactions_after_delete on public.profile_messages;
create trigger clear_profile_message_reactions_after_delete
  after update of deleted_at on public.profile_messages
  for each row execute function public.clear_reactions_for_deleted_profile_message();
