-- Let existing chat partners load the profile gallery photo used as an avatar
-- when the account-specific avatar has not been set.
create policy "Chat partners read peer profile photos"
  on public.profile_photos for select to authenticated
  using (
    exists (
      select 1
      from public.profile_messages pm
      where (pm.sender_id = (select auth.uid()) and pm.recipient_id = profile_photos.user_id)
         or (pm.recipient_id = (select auth.uid()) and pm.sender_id = profile_photos.user_id)
    )
  );

create policy "Chat partners read peer profile photo files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'wedconnect-profile-photos'
    and exists (
      select 1
      from public.profile_photos pp
      where (pp.object_path = storage.objects.name or pp.display_path = storage.objects.name)
        and exists (
          select 1
          from public.profile_messages pm
          where (pm.sender_id = (select auth.uid()) and pm.recipient_id = pp.user_id)
             or (pm.recipient_id = (select auth.uid()) and pm.sender_id = pp.user_id)
        )
    )
  );
