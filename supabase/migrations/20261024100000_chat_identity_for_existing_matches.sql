-- Preserve identity and account-avatar visibility for existing chat partners
-- while a profile is reopened to confirm updated collaboration terms.
create policy "Chat partners read peer profile headers"
  on public.profiles for select to authenticated
  using (
    exists (
      select 1
      from public.profile_messages pm
      where (pm.sender_id = (select auth.uid()) and pm.recipient_id = profiles.id)
         or (pm.recipient_id = (select auth.uid()) and pm.sender_id = profiles.id)
    )
  );

create policy "Chat partners read peer couple profiles"
  on public.couple_profiles for select to authenticated
  using (
    exists (
      select 1
      from public.profile_messages pm
      where (pm.sender_id = (select auth.uid()) and pm.recipient_id = couple_profiles.id)
         or (pm.recipient_id = (select auth.uid()) and pm.sender_id = couple_profiles.id)
    )
  );

create policy "Chat partners read peer photographer profiles"
  on public.photographer_profiles for select to authenticated
  using (
    exists (
      select 1
      from public.profile_messages pm
      where (pm.sender_id = (select auth.uid()) and pm.recipient_id = photographer_profiles.id)
         or (pm.recipient_id = (select auth.uid()) and pm.sender_id = photographer_profiles.id)
    )
  );

create policy "Chat partners read peer account avatars"
  on public.profile_avatars for select to authenticated
  using (
    exists (
      select 1
      from public.profile_messages pm
      where (pm.sender_id = (select auth.uid()) and pm.recipient_id = profile_avatars.user_id)
         or (pm.recipient_id = (select auth.uid()) and pm.sender_id = profile_avatars.user_id)
    )
  );

create policy "Chat partners read peer account avatar files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'wedconnect-profile-photos'
    and exists (
      select 1
      from public.profile_avatars pa
      where pa.object_path = storage.objects.name
        and exists (
          select 1
          from public.profile_messages pm
          where (pm.sender_id = (select auth.uid()) and pm.recipient_id = pa.user_id)
             or (pm.recipient_id = (select auth.uid()) and pm.sender_id = pa.user_id)
        )
    )
  );
