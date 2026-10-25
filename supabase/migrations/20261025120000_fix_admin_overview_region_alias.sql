-- Fix the missing derived-table alias in the regional photographer statistics.
create or replace function public.admin_overview(p_period_days integer default 7)
returns jsonb language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_days integer:=least(greatest(coalesce(p_period_days,7),7),90);
begin
  perform public.admin_require_access();
  return jsonb_build_object(
    'counts',jsonb_build_object(
      'pending_reviews',(select count(*) from public.photographer_profiles pp join public.profiles p on p.id=pp.id where p.profile_status='complete' and pp.admin_review_status in ('pending','recheck') and not public.admin_is_test_account(p.id)),
      'pending_verifications',(select count(*) from public.admin_verification_reviews r join public.profiles p on p.id=r.user_id where r.status='pending' and not public.admin_is_test_account(p.id)),
      'open_support',(select count(*) from public.support_threads t join public.profiles p on p.id=t.user_id where t.admin_status in ('open','in_progress') and not public.admin_is_test_account(p.id)),
      'oldest_review_at',(select min(pp.updated_at) from public.photographer_profiles pp join public.profiles p on p.id=pp.id where p.profile_status='complete' and pp.admin_review_status in ('pending','recheck') and not public.admin_is_test_account(p.id)),
      'oldest_verification_at',(select min(r.submitted_at) from public.admin_verification_reviews r join public.profiles p on p.id=r.user_id where r.status='pending' and not public.admin_is_test_account(p.id)),
      'oldest_support_at',(select min(t.created_at) from public.support_threads t join public.profiles p on p.id=t.user_id where t.admin_status in ('open','in_progress') and not public.admin_is_test_account(p.id))),
    'stats',jsonb_build_object(
      'couples',(select count(*) from public.profiles p where p.role='couple' and not public.admin_is_test_account(p.id)),'photographers',(select count(*) from public.profiles p where p.role='photographer' and not public.admin_is_test_account(p.id)),
      'complete_couples',(select count(*) from public.profiles p where p.role='couple' and p.profile_status='complete' and not public.admin_is_test_account(p.id)),'complete_photographers',(select count(*) from public.profiles p where p.role='photographer' and p.profile_status='complete' and not public.admin_is_test_account(p.id)),
      'new_users',(select count(*) from public.profiles p where p.created_at>=now()-make_interval(days=>v_days) and not public.admin_is_test_account(p.id)),
      'approved_photographers',(select count(*) from public.photographer_profiles pp where pp.admin_review_status='approved' and not public.admin_is_test_account(pp.id)),'verified_photographers',(select count(*) from public.photographer_profiles pp where pp.admin_verification_status='verified' and not public.admin_is_test_account(pp.id)),
      'matches',(select count(*) from public.profile_likes a join public.profile_likes b on b.liker_id=a.liked_id and b.liked_id=a.liker_id where a.liker_id<a.liked_id and not public.admin_is_test_account(a.liker_id) and not public.admin_is_test_account(a.liked_id)),
      'recent_matches',(select count(*) from public.profile_likes a join public.profile_likes b on b.liker_id=a.liked_id and b.liked_id=a.liker_id where a.liker_id<a.liked_id and greatest(a.created_at,b.created_at)>=now()-make_interval(days=>v_days) and not public.admin_is_test_account(a.liker_id) and not public.admin_is_test_account(a.liked_id)),
      'recent_messages',(select count(*) from public.profile_messages m where m.created_at>=now()-make_interval(days=>v_days) and not public.admin_is_test_account(m.sender_id) and not public.admin_is_test_account(m.recipient_id)),
      'couples_by_region',(select coalesce(jsonb_agg(jsonb_build_object('region',x.region,'count',x.total) order by x.region),'[]'::jsonb) from (select cp.region_code as region,count(*) as total from public.couple_profiles cp join public.profiles p on p.id=cp.id where not public.admin_is_test_account(p.id) group by cp.region_code) x),
      'photographers_by_region',(select coalesce(jsonb_agg(jsonb_build_object('region',x.region,'count',x.total) order by x.region),'[]'::jsonb) from (select r.region,count(distinct pp.id) as total from public.photographer_profiles pp join public.profiles p on p.id=pp.id cross join lateral unnest(coalesce(pp.regions,array[]::text[])) r(region) where not public.admin_is_test_account(p.id) group by r.region) x)),
    'funnels',jsonb_build_object(
      'couple',jsonb_build_array(
        jsonb_build_object('label','Registriert','count',(select count(*) from auth.users u left join public.profiles p on p.id=u.id where not exists(select 1 from public.admin_users a where a.user_id=u.id) and (p.id is null or not public.admin_is_test_account(p.id)))),
        jsonb_build_object('label','Rolle gewählt','count',(select count(*) from public.profiles p where p.role='couple' and not public.admin_is_test_account(p.id))),
        jsonb_build_object('label','Profil vollständig','count',(select count(*) from public.profiles p where p.role='couple' and p.profile_status='complete' and not public.admin_is_test_account(p.id))),
        jsonb_build_object('label','Interesse gezeigt','count',(select count(distinct l.liker_id) from public.profile_likes l join public.profiles p on p.id=l.liker_id where p.role='couple' and not public.admin_is_test_account(p.id))),
        jsonb_build_object('label','Erstes Match','count',(select count(distinct a.liker_id) from public.profile_likes a join public.profile_likes b on b.liker_id=a.liked_id and b.liked_id=a.liker_id join public.profiles p on p.id=a.liker_id where p.role='couple' and not public.admin_is_test_account(p.id) and not public.admin_is_test_account(a.liked_id))),
        jsonb_build_object('label','Erste Nachricht','count',(select count(distinct m.sender_id) from public.profile_messages m join public.profiles p on p.id=m.sender_id where p.role='couple' and not public.admin_is_test_account(p.id)))),
      'photographer',jsonb_build_array(
        jsonb_build_object('label','Registriert','count',(select count(*) from auth.users u left join public.profiles p on p.id=u.id where not exists(select 1 from public.admin_users a where a.user_id=u.id) and (p.id is null or not public.admin_is_test_account(p.id)))),
        jsonb_build_object('label','Rolle gewählt','count',(select count(*) from public.profiles p where p.role='photographer' and not public.admin_is_test_account(p.id))),
        jsonb_build_object('label','Profil vollständig','count',(select count(*) from public.profiles p where p.role='photographer' and p.profile_status='complete' and not public.admin_is_test_account(p.id))),
        jsonb_build_object('label','Eingereicht','count',(select count(*) from public.photographer_profiles pp join public.profiles p on p.id=pp.id where p.profile_status='complete' and not public.admin_is_test_account(pp.id))),
        jsonb_build_object('label','Freigegeben','count',(select count(*) from public.photographer_profiles pp where pp.admin_review_status='approved' and not public.admin_is_test_account(pp.id))),
        jsonb_build_object('label','Interesse gezeigt','count',(select count(distinct l.liker_id) from public.profile_likes l join public.profiles p on p.id=l.liker_id where p.role='photographer' and not public.admin_is_test_account(p.id))),
        jsonb_build_object('label','Erstes Match','count',(select count(distinct a.liker_id) from public.profile_likes a join public.profile_likes b on b.liker_id=a.liked_id and b.liked_id=a.liker_id join public.profiles p on p.id=a.liker_id where p.role='photographer' and not public.admin_is_test_account(p.id) and not public.admin_is_test_account(a.liked_id))),
        jsonb_build_object('label','Erste Nachricht','count',(select count(distinct m.sender_id) from public.profile_messages m join public.profiles p on p.id=m.sender_id where p.role='photographer' and not public.admin_is_test_account(p.id))))));
end;
$$;
revoke all on function public.admin_overview(integer) from public,anon;
grant execute on function public.admin_overview(integer) to authenticated;
