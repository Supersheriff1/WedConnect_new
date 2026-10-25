-- Fix explicit casts for the declared table return types in admin user search.
create or replace function public.admin_users_search(p_query text default '',p_role text default null,p_status text default null,p_test_only boolean default null)
returns table(id uuid,email text,display_name text,role text,profile_status text,region text,status text,is_test boolean,likes_given bigint,likes_received bigint,matches bigint,messages_count bigint,warnings_count bigint,photographer_review_status text,verification_status text,created_at timestamptz,last_activity timestamptz)
language plpgsql security definer set search_path=public,auth,pg_temp as $$
begin
  perform public.admin_require_access(array['owner','moderator','support','read_only']);
  return query select p.id,u.email::text,coalesce(cp.partner_one_first_name||' & '||cp.partner_two_first_name,pp.first_name,p.id::text)::text,p.role::text,p.profile_status::text,coalesce(pp.region,cp.location,'—')::text,coalesce(s.status,'active')::text,public.admin_is_test_account(p.id)::boolean,
    (select count(*)::bigint from public.profile_likes l where l.liker_id=p.id),(select count(*)::bigint from public.profile_likes l where l.liked_id=p.id),
    (select count(*)::bigint from public.profile_likes a join public.profile_likes b on b.liker_id=a.liked_id and b.liked_id=a.liker_id where a.liker_id=p.id),
    (select count(*)::bigint from public.profile_messages m where m.sender_id=p.id or m.recipient_id=p.id),
    (select count(*)::bigint from public.admin_user_warnings w where w.user_id=p.id),pp.admin_review_status::text,pp.admin_verification_status::text,p.created_at::timestamptz,u.last_sign_in_at::timestamptz
  from public.profiles p join auth.users u on u.id=p.id left join public.couple_profiles cp on cp.id=p.id left join public.photographer_profiles pp on pp.id=p.id left join public.admin_account_status s on s.user_id=p.id
  where (coalesce(p_query,'')='' or u.email ilike '%'||p_query||'%' or cp.partner_one_first_name ilike '%'||p_query||'%' or cp.partner_two_first_name ilike '%'||p_query||'%' or pp.first_name ilike '%'||p_query||'%' or p.id::text ilike '%'||p_query||'%')
  and (p_role is null or p.role=p_role) and (p_status is null or coalesce(s.status,'active')=p_status)
  and (p_test_only is null or public.admin_is_test_account(p.id)=p_test_only)
  order by p.created_at desc limit 100;
end;
$$;
