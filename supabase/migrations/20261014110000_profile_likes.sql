-- Profile likes between completed photographer and couple profiles.
create table if not exists public.profile_likes (
  liker_id uuid not null references public.profiles(id) on delete cascade,
  liked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (liker_id, liked_id),
  constraint profile_likes_not_self check (liker_id <> liked_id)
);

create index if not exists profile_likes_liked_id_idx
  on public.profile_likes (liked_id, created_at desc);

alter table public.profile_likes enable row level security;

revoke all on table public.profile_likes from anon, authenticated;
grant select, insert, delete on table public.profile_likes to authenticated;

drop policy if exists "Users read likes involving their profile" on public.profile_likes;
create policy "Users read likes involving their profile"
  on public.profile_likes for select to authenticated
  using (liker_id = (select auth.uid()) or liked_id = (select auth.uid()));

drop policy if exists "Complete profiles can like opposite roles" on public.profile_likes;
create policy "Complete profiles can like opposite roles"
  on public.profile_likes for insert to authenticated
  with check (
    liker_id = (select auth.uid())
    and liked_id <> (select auth.uid())
    and exists (
      select 1
      from public.profiles liker
      join public.profiles liked on liked.id = profile_likes.liked_id
      where liker.id = (select auth.uid())
        and liker.profile_status = 'complete'
        and liked.profile_status = 'complete'
        and liker.role in ('couple', 'photographer')
        and liked.role in ('couple', 'photographer')
        and liker.role <> liked.role
    )
  );

drop policy if exists "Users remove their own likes" on public.profile_likes;
create policy "Users remove their own likes"
  on public.profile_likes for delete to authenticated
  using (liker_id = (select auth.uid()));
