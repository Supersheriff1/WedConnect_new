-- Secure WedConnect admin area foundation. Run after the existing profile/support migrations.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_level text not null default 'owner' check (access_level in ('owner','moderator','support','finance','read_only')),
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id) on delete set null
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;

create table if not exists public.admin_sessions (
  auth_session_id uuid primary key,
  user_id uuid not null references public.admin_users(user_id) on delete cascade,
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  last_reauthenticated_at timestamptz,
  recovery_code_used boolean not null default false
);
alter table public.admin_sessions enable row level security;
revoke all on public.admin_sessions from anon, authenticated;

create table if not exists public.admin_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.admin_users(user_id) on delete cascade,
  code_hash text not null,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  unique(user_id, code_hash)
);
alter table public.admin_recovery_codes enable row level security;
revoke all on public.admin_recovery_codes from anon, authenticated;

create table if not exists public.admin_action_log (
  id bigint generated always as identity primary key,
  admin_id uuid not null,
  action text not null,
  target_user_id uuid,
  reason text not null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_action_log enable row level security;
revoke all on public.admin_action_log from anon, authenticated;
create index if not exists admin_action_log_created_idx on public.admin_action_log(created_at desc);
create index if not exists admin_action_log_target_idx on public.admin_action_log(target_user_id, created_at desc);

create or replace function public.admin_require_access(p_allowed text[] default null)
returns uuid language plpgsql volatile security definer set search_path=public,auth,pg_temp as $$
declare
  v_uid uuid:=auth.uid();
  v_session uuid:=nullif(auth.jwt()->>'session_id','')::uuid;
  v_level text;
  v_aal text:=coalesce(auth.jwt()->>'aal','aal1');
begin
  if v_uid is null then raise exception 'admin_auth_required' using errcode='42501'; end if;
  select access_level into v_level from public.admin_users where user_id=v_uid;
  if v_level is null then raise exception 'admin_access_denied' using errcode='42501'; end if;
  if p_allowed is not null and not (v_level=any(p_allowed)) then raise exception 'admin_permission_denied' using errcode='42501'; end if;
  if not exists(select 1 from public.admin_sessions s where s.auth_session_id=v_session and s.user_id=v_uid
      and s.started_at>now()-interval '8 hours' and s.last_activity_at>now()-interval '30 minutes'
      and (v_aal='aal2' or s.recovery_code_used)) then raise exception 'admin_session_expired_or_mfa_required' using errcode='42501'; end if;
  update public.admin_sessions set last_activity_at=now() where auth_session_id=v_session and user_id=v_uid;
  return v_uid;
end;
$$;
revoke all on function public.admin_require_access(text[]) from public,anon,authenticated;

create or replace function public.admin_preflight()
returns void language plpgsql stable security definer set search_path=public,auth,pg_temp as $$
begin
  if auth.uid() is null or not exists(select 1 from public.admin_users where user_id=auth.uid()) then raise exception 'admin_access_denied' using errcode='42501'; end if;
end;
$$;
revoke all on function public.admin_preflight() from public,anon;
grant execute on function public.admin_preflight() to authenticated;

create or replace function public.admin_open_session()
returns void language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_uid uuid:=auth.uid(); v_session uuid:=nullif(auth.jwt()->>'session_id','')::uuid;
begin
  if v_uid is null or v_session is null then raise exception 'admin_auth_required' using errcode='42501'; end if;
  if coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'admin_mfa_required' using errcode='42501'; end if;
  if not exists(select 1 from public.admin_users where user_id=v_uid) then raise exception 'admin_access_denied' using errcode='42501'; end if;
  if exists(select 1 from public.admin_sessions where auth_session_id=v_session and started_at<=now()-interval '8 hours') then raise exception 'admin_session_expired'; end if;
  insert into public.admin_sessions(auth_session_id,user_id) values(v_session,v_uid)
    on conflict(auth_session_id) do update set last_activity_at=now() where admin_sessions.user_id=excluded.user_id;
  insert into public.admin_action_log(admin_id,action,reason,new_value)
    values(v_uid,'admin_session_opened','Admin-Anmeldung mit bestätigtem zweiten Faktor',jsonb_build_object('session_id',v_session));
end;
$$;
revoke all on function public.admin_open_session() from public,anon;
grant execute on function public.admin_open_session() to authenticated;

create or replace function public.admin_my_access_level()
returns text language plpgsql volatile security definer set search_path=public,auth,pg_temp as $$
declare v_level text;
begin
  perform public.admin_require_access();
  select access_level into v_level from public.admin_users where user_id=auth.uid();
  return v_level;
end;
$$;
revoke all on function public.admin_my_access_level() from public,anon;
grant execute on function public.admin_my_access_level() to authenticated;

create or replace function public.admin_touch_session()
returns void language plpgsql security definer set search_path=public,auth,pg_temp as $$
begin perform public.admin_require_access(); end;
$$;
revoke all on function public.admin_touch_session() from public,anon;
grant execute on function public.admin_touch_session() to authenticated;

create or replace function public.admin_mark_reauthenticated()
returns void language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_uid uuid;
begin
  v_uid:=public.admin_require_access(array['owner','moderator','finance']);
  if coalesce(auth.jwt()->>'aal','aal1')<>'aal2' or coalesce((auth.jwt()->>'auth_time')::bigint,0)<extract(epoch from now()-interval '5 minutes')::bigint then
    raise exception 'recent_password_and_mfa_required' using errcode='42501';
  end if;
  update public.admin_sessions set last_reauthenticated_at=now() where auth_session_id=nullif(auth.jwt()->>'session_id','')::uuid and user_id=v_uid;
end;
$$;
revoke all on function public.admin_mark_reauthenticated() from public,anon;
grant execute on function public.admin_mark_reauthenticated() to authenticated;

create or replace function public.admin_require_recent_auth()
returns uuid language plpgsql volatile security definer set search_path=public,auth,pg_temp as $$
declare v_uid uuid; v_session uuid:=nullif(auth.jwt()->>'session_id','')::uuid;
begin
  v_uid:=public.admin_require_access(array['owner','moderator','finance']);
  if coalesce(auth.jwt()->>'aal','aal1')<>'aal2' or not exists(select 1 from public.admin_sessions s where s.auth_session_id=v_session and s.user_id=v_uid and s.last_reauthenticated_at>now()-interval '5 minutes') then
    raise exception 'recent_password_and_mfa_required' using errcode='42501';
  end if;
  return v_uid;
end;
$$;
revoke all on function public.admin_require_recent_auth() from public,anon,authenticated;

create or replace function public.admin_store_recovery_codes(p_code_hashes text[])
returns integer language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_uid uuid;
begin
  v_uid:=public.admin_require_access(array['owner']);
  if coalesce(auth.jwt()->>'aal','aal1')<>'aal2' then raise exception 'admin_mfa_required' using errcode='42501'; end if;
  if coalesce(array_length(p_code_hashes,1),0)<>10 or exists(select 1 from unnest(p_code_hashes) h where h !~ '^[0-9a-f]{64}$') then raise exception 'invalid_recovery_codes'; end if;
  insert into public.admin_action_log(admin_id,action,reason,new_value) values(v_uid,'recovery_codes_regenerated','Admin recovery codes regenerated',jsonb_build_object('count',10));
  delete from public.admin_recovery_codes where user_id=v_uid;
  insert into public.admin_recovery_codes(user_id,code_hash) select v_uid,h from unnest(p_code_hashes) h;
  return 10;
end;
$$;
revoke all on function public.admin_store_recovery_codes(text[]) from public,anon;
grant execute on function public.admin_store_recovery_codes(text[]) to authenticated;

create or replace function public.admin_redeem_recovery_code(p_code_hash text)
returns void language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_uid uuid:=auth.uid(); v_session uuid:=nullif(auth.jwt()->>'session_id','')::uuid; v_code_id uuid;
begin
  if v_uid is null or v_session is null or coalesce(auth.jwt()->>'aal','aal1')<>'aal1' then raise exception 'admin_auth_required' using errcode='42501'; end if;
  if not exists(select 1 from public.admin_users where user_id=v_uid and access_level='owner') then raise exception 'admin_access_denied' using errcode='42501'; end if;
  select id into v_code_id from public.admin_recovery_codes where user_id=v_uid and code_hash=p_code_hash and used_at is null for update;
  if v_code_id is null then raise exception 'recovery_code_invalid' using errcode='42501'; end if;
  update public.admin_recovery_codes set used_at=now() where id=v_code_id;
  insert into public.admin_sessions(auth_session_id,user_id,recovery_code_used) values(v_session,v_uid,true)
    on conflict(auth_session_id) do update set started_at=now(),last_activity_at=now(),recovery_code_used=true where admin_sessions.user_id=excluded.user_id;
  insert into public.admin_action_log(admin_id,action,reason,new_value) values(v_uid,'recovery_code_used','One-time admin recovery code used',jsonb_build_object('recovery_code_id',v_code_id));
end;
$$;
revoke all on function public.admin_redeem_recovery_code(text) from public,anon;
grant execute on function public.admin_redeem_recovery_code(text) to authenticated;

alter table public.photographer_profiles
  add column if not exists admin_review_status text not null default 'pending'
    check(admin_review_status in ('pending','approved','changes_requested','rejected','paused','recheck')),
  add column if not exists admin_verification_status text not null default 'not_submitted'
    check(admin_verification_status in ('not_submitted','pending','verified','rejected','revoked'));

create table if not exists public.photographer_business_details (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  uid_number text,
  company_number text,
  company_name text,
  updated_at timestamptz not null default now(),
  check(uid_number is null or char_length(btrim(uid_number)) between 3 and 40),
  check(company_number is null or char_length(btrim(company_number)) between 2 and 40),
  check(company_name is null or char_length(btrim(company_name)) between 2 and 180)
);
alter table public.photographer_business_details enable row level security;
revoke all on public.photographer_business_details from anon,authenticated;

create or replace function public.save_photographer_business_details(p_uid_number text,p_company_number text,p_company_name text)
returns void language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_uid uuid:=auth.uid();
begin
  if v_uid is null or not exists(select 1 from public.profiles where id=v_uid and role='photographer') then raise exception 'photographer_required' using errcode='42501'; end if;
  if nullif(btrim(coalesce(p_uid_number,'')),'') is null and nullif(btrim(coalesce(p_company_number,'')),'') is null and nullif(btrim(coalesce(p_company_name,'')),'') is null then
    delete from public.photographer_business_details where user_id=v_uid;
    return;
  end if;
  insert into public.photographer_business_details(user_id,uid_number,company_number,company_name,updated_at)
  values(v_uid,nullif(btrim(p_uid_number),''),nullif(btrim(p_company_number),''),nullif(btrim(p_company_name),''),now())
  on conflict(user_id) do update set uid_number=excluded.uid_number,company_number=excluded.company_number,company_name=excluded.company_name,updated_at=now();
end;
$$;
revoke all on function public.save_photographer_business_details(text,text,text) from public,anon;
grant execute on function public.save_photographer_business_details(text,text,text) to authenticated;

create or replace function public.get_own_photographer_business_details()
returns table(uid_number text,company_number text,company_name text)
language sql stable security definer set search_path=public,auth,pg_temp as $$
  select d.uid_number,d.company_number,d.company_name from public.photographer_business_details d
  where d.user_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='photographer')
$$;
revoke all on function public.get_own_photographer_business_details() from public,anon;
grant execute on function public.get_own_photographer_business_details() to authenticated;

-- Preserve profiles already live before the review queue was introduced.
update public.photographer_profiles pp set admin_review_status='approved'
from public.profiles p where p.id=pp.id and p.profile_status='complete';

create table if not exists public.admin_photographer_reviews (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'pending' check(status in ('pending','approved','changes_requested','rejected','paused','recheck')),
  submitted_at timestamptz not null default now(), reviewed_at timestamptz,
  checklist jsonb not null default '{}'::jsonb, notes jsonb not null default '{}'::jsonb, note text, next_submission_at timestamptz
);
alter table public.admin_photographer_reviews enable row level security;
revoke all on public.admin_photographer_reviews from anon,authenticated;
create table if not exists public.admin_verification_reviews (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'pending' check(status in ('pending','verified','rejected','revoked')),
  submitted_at timestamptz not null default now(), reviewed_at timestamptz,
  results jsonb not null default '{}'::jsonb, note text
);
alter table public.admin_verification_reviews enable row level security;
revoke all on public.admin_verification_reviews from anon,authenticated;

alter table public.support_threads add column if not exists admin_status text not null default 'open'
  check(admin_status in ('open','in_progress','resolved'));

create table if not exists public.admin_account_status (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'active' check(status in ('active','suspended','paused')),
  reason text not null default '', expires_at timestamptz, updated_at timestamptz not null default now()
);
alter table public.admin_account_status enable row level security;
revoke all on public.admin_account_status from anon,authenticated;

create or replace function public.admin_account_state_for_me()
returns table(status text,reason text,expires_at timestamptz)
language sql stable security definer set search_path=public,auth,pg_temp as $$
  select case when s.status='suspended' and s.expires_at<=now() then 'active' else coalesce(s.status,'active') end,
    coalesce(s.reason,''),s.expires_at from (select auth.uid() as user_id) me left join public.admin_account_status s on s.user_id=me.user_id
$$;
revoke all on function public.admin_account_state_for_me() from public,anon;
grant execute on function public.admin_account_state_for_me() to authenticated;

create table if not exists public.admin_test_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  added_by uuid not null references public.admin_users(user_id),
  reason text not null,
  created_at timestamptz not null default now()
);
alter table public.admin_test_accounts enable row level security;
revoke all on public.admin_test_accounts from anon,authenticated;

create or replace function public.admin_is_test_account(p_user_id uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select exists(select 1 from public.admin_test_accounts where user_id=p_user_id)
$$;
revoke all on function public.admin_is_test_account(uuid) from public,anon,authenticated;

create or replace function public.admin_test_account_set(p_user_id uuid,p_is_test boolean,p_reason text)
returns void language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_admin uuid;v_old boolean;
begin
  v_admin:=public.admin_require_access(array['owner']);
  if p_user_id=v_admin then raise exception 'cannot_mark_self_as_test'; end if;
  if char_length(btrim(coalesce(p_reason,'')))<2 then raise exception 'reason_required'; end if;
  if not exists(select 1 from public.profiles where id=p_user_id) then raise exception 'user_not_found'; end if;
  v_old:=public.admin_is_test_account(p_user_id);
  if v_old=p_is_test then raise exception 'test_flag_unchanged'; end if;
  insert into public.admin_action_log(admin_id,action,target_user_id,reason,old_value,new_value)
    values(v_admin,case when p_is_test then 'user_marked_test_account' else 'user_unmarked_test_account' end,p_user_id,btrim(p_reason),jsonb_build_object('test_account',v_old),jsonb_build_object('test_account',p_is_test));
  if p_is_test then insert into public.admin_test_accounts(user_id,added_by,reason) values(p_user_id,v_admin,btrim(p_reason));
  else delete from public.admin_test_accounts where user_id=p_user_id; end if;
end;
$$;
revoke all on function public.admin_test_account_set(uuid,boolean,text) from public,anon;
grant execute on function public.admin_test_account_set(uuid,boolean,text) to authenticated;

create table if not exists public.wedconnect_partners (
  id uuid primary key default gen_random_uuid(), name text not null check(char_length(btrim(name)) between 1 and 160),
  category text not null default '', contact_email text, region text not null default 'Österreich',
  commission_rate numeric(5,2) not null default 0 check(commission_rate between 0 and 100),
  commission_basis text not null default 'bestätigter Nettoumsatz',
  status text not null default 'active' check(status in ('active','paused','closed')),
  notes text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.wedconnect_partners enable row level security;
revoke all on public.wedconnect_partners from anon,authenticated;

create table if not exists public.partner_campaigns (
  id uuid primary key default gen_random_uuid(), partner_id uuid not null references public.wedconnect_partners(id) on delete restrict,
  title text not null check(char_length(btrim(title)) between 1 and 160), offer text not null default '',
  target_role text check(target_role is null or target_role in ('couple','photographer')), region text not null default 'Österreich',
  starts_at date not null, ends_at date not null, max_frequency integer not null default 3 check(max_frequency between 1 and 100),
  status text not null default 'draft' check(status in ('draft','active','paused','ended')),
  impressions bigint not null default 0, clicks bigint not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(ends_at>=starts_at)
);
alter table public.partner_campaigns enable row level security;
revoke all on public.partner_campaigns from anon,authenticated;
create table if not exists public.partner_redemptions (
  id uuid primary key default gen_random_uuid(), campaign_id uuid not null references public.partner_campaigns(id) on delete restrict,
  code_hash text not null unique, user_id uuid references public.profiles(id) on delete set null,
  redeemed_at timestamptz, reported_amount numeric(12,2) check(reported_amount is null or reported_amount>=0),
  confirmed_amount numeric(12,2) check(confirmed_amount is null or confirmed_amount>=0),
  commission_amount numeric(12,2) check(commission_amount is null or commission_amount>=0),
  commission_rate numeric(5,2) not null default 0,
  commission_basis text not null default 'bestätigter Nettoumsatz',
  status text not null default 'issued' check(status in ('issued','reported','confirmed','reversed','settled','paid')),
  created_at timestamptz not null default now()
);
alter table public.partner_redemptions enable row level security;
revoke all on public.partner_redemptions from anon,authenticated;

create or replace function public.is_wedconnect_support_operator()
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select exists(
    select 1 from public.admin_users a join public.admin_sessions s on s.user_id=a.user_id
    where a.user_id=auth.uid() and s.auth_session_id=nullif(auth.jwt()->>'session_id','')::uuid
      and s.started_at>now()-interval '8 hours' and s.last_activity_at>now()-interval '30 minutes'
      and (coalesce(auth.jwt()->>'aal','aal1')='aal2' or s.recovery_code_used));
$$;
revoke all on function public.is_wedconnect_support_operator() from public;
grant execute on function public.is_wedconnect_support_operator() to authenticated;

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

comment on table public.admin_users is 'Private admin allowlist. Add/remove entries only through trusted Supabase SQL access.';
comment on table public.admin_action_log is 'Append-only administrator audit records.';

create or replace function public.admin_review_queue(p_include_all boolean default false)
returns table(id uuid,first_name text,region text,profile_status text,admin_review_status text,submitted_at timestamptz,website_url text,instagram_url text,experience text,visual_style text,checklist jsonb,check_notes jsonb)
language plpgsql security definer set search_path=public,auth,pg_temp as $$
begin
  perform public.admin_require_access(array['owner','moderator','read_only']);
  return query select pp.id,pp.first_name,pp.region,p.profile_status,pp.admin_review_status,coalesce(r.submitted_at,pp.updated_at),pp.website_url,pp.instagram_url,pp.experience,pp.visual_style,coalesce(r.checklist,'{}'::jsonb),coalesce(r.notes,'{}'::jsonb)
  from public.photographer_profiles pp join public.profiles p on p.id=pp.id left join public.admin_photographer_reviews r on r.user_id=pp.id
  where p.profile_status='complete' and not public.admin_is_test_account(p.id) and (p_include_all or pp.admin_review_status in ('pending','recheck','changes_requested'))
  order by coalesce(r.submitted_at,pp.updated_at) asc;
end;
$$;
revoke all on function public.admin_review_queue(boolean) from public,anon;
grant execute on function public.admin_review_queue(boolean) to authenticated;

create or replace function public.admin_review_decide(p_user_id uuid,p_decision text,p_reason text,p_checklist jsonb default '{}'::jsonb,p_notes jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_admin uuid;v_old text;v_new text;v_yes integer;
begin
  v_admin:=public.admin_require_access(array['owner','moderator']);
  if p_decision not in ('approve','request_changes','reject','pause','confirm_recheck') then raise exception 'invalid_decision'; end if;
  if char_length(btrim(coalesce(p_reason,'')))<2 then raise exception 'reason_required'; end if;
  select admin_review_status into v_old from public.photographer_profiles where id=p_user_id for update;
  if v_old is null then raise exception 'profile_not_found'; end if;
  select count(*) into v_yes from jsonb_each_text(coalesce(p_checklist,'{}'::jsonb)) e
  where e.key=any(array['website_reachable','website_photography','website_imprint','website_identity','instagram_public','instagram_active','instagram_own_work','instagram_identity','profile_photos_own','intro_appropriate']) and e.value='yes';
  if p_decision='approve' and v_yes<>10 then raise exception 'checklist_incomplete'; end if;
  v_new:=case p_decision when 'approve' then 'approved' when 'request_changes' then 'changes_requested' when 'reject' then 'rejected' when 'pause' then 'paused' else 'approved' end;
  insert into public.admin_action_log(admin_id,action,target_user_id,reason,old_value,new_value) values(v_admin,'photographer_review_'||p_decision,p_user_id,btrim(p_reason),jsonb_build_object('status',v_old),jsonb_build_object('status',v_new,'checklist',p_checklist,'notes',p_notes));
  insert into public.admin_photographer_reviews(user_id,status,submitted_at,reviewed_at,checklist,notes,note,next_submission_at)
  values(p_user_id,v_new,now(),now(),coalesce(p_checklist,'{}'::jsonb),coalesce(p_notes,'{}'::jsonb),btrim(p_reason),case when p_decision='reject' then now()+interval '14 days' else null end)
  on conflict(user_id) do update set status=excluded.status,reviewed_at=now(),checklist=excluded.checklist,notes=excluded.notes,note=excluded.note,next_submission_at=excluded.next_submission_at;
  update public.photographer_profiles set admin_review_status=v_new where id=p_user_id;
end;
$$;
revoke all on function public.admin_review_decide(uuid,text,text,jsonb,jsonb) from public,anon;
grant execute on function public.admin_review_decide(uuid,text,text,jsonb,jsonb) to authenticated;

create or replace function public.admin_verification_queue()
returns table(id uuid,first_name text,region text,uid_number text,company_number text,company_name text,website_url text,instagram_url text,uid_duplicate boolean,company_duplicate boolean,submitted_at timestamptz)
language plpgsql security definer set search_path=public,auth,pg_temp as $$
begin
  perform public.admin_require_access(array['owner','moderator','read_only']);
  return query select pp.id,pp.first_name,pp.region,d.uid_number,d.company_number,d.company_name,pp.website_url,pp.instagram_url,
    exists(select 1 from public.photographer_business_details other where other.user_id<>pp.id and nullif(upper(regexp_replace(coalesce(other.uid_number,''),'[^A-Za-z0-9]','','g')),'')=upper(regexp_replace(coalesce(d.uid_number,''),'[^A-Za-z0-9]','','g'))),
    exists(select 1 from public.photographer_business_details other where other.user_id<>pp.id and nullif(upper(regexp_replace(coalesce(other.company_number,''),'[^A-Za-z0-9]','','g')),'')=upper(regexp_replace(coalesce(d.company_number,''),'[^A-Za-z0-9]','','g'))),
    coalesce(v.submitted_at,pp.updated_at)
  from public.photographer_profiles pp join public.profiles p on p.id=pp.id join public.photographer_business_details d on d.user_id=pp.id left join public.admin_verification_reviews v on v.user_id=pp.id
  where pp.admin_verification_status='pending' and p.profile_status='complete' and not public.admin_is_test_account(p.id) order by coalesce(v.submitted_at,pp.updated_at);
end;
$$;
revoke all on function public.admin_verification_queue() from public,anon;
grant execute on function public.admin_verification_queue() to authenticated;

create or replace function public.submit_business_verification()
returns void language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'auth_required' using errcode='42501'; end if;
  if not exists(select 1 from public.profiles where id=v_uid and role='photographer' and profile_status='complete') then raise exception 'complete_photographer_profile_required'; end if;
  if not exists(select 1 from public.photographer_business_details where user_id=v_uid and (nullif(btrim(uid_number),'') is not null or nullif(btrim(company_number),'') is not null)) then raise exception 'business_number_required'; end if;
  update public.photographer_profiles set admin_verification_status='pending' where id=v_uid and admin_verification_status<>'verified';
  if not found then raise exception 'verification_already_granted_or_profile_missing'; end if;
  insert into public.admin_verification_reviews(user_id,status,submitted_at,reviewed_at,results,note)
  values(v_uid,'pending',now(),null,'{}'::jsonb,null)
  on conflict(user_id) do update set status='pending',submitted_at=now(),reviewed_at=null,results='{}'::jsonb,note=null;
end;
$$;
revoke all on function public.submit_business_verification() from public,anon;
grant execute on function public.submit_business_verification() to authenticated;

create or replace function public.admin_verification_decide(p_user_id uuid,p_decision text,p_reason text,p_results jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_admin uuid;v_old text;v_new text;v_uid text;v_company text;v_uid_duplicate boolean;v_company_duplicate boolean;v_any_no boolean;v_uid_ok boolean;v_company_ok boolean;
begin
  v_admin:=public.admin_require_access(array['owner','moderator']);
  if p_decision not in ('grant','reject','revoke') then raise exception 'invalid_decision'; end if;
  if char_length(btrim(coalesce(p_reason,'')))<2 then raise exception 'reason_required'; end if;
  select admin_verification_status into v_old from public.photographer_profiles where id=p_user_id for update;
  if v_old is null then raise exception 'profile_not_found'; end if;
  if p_decision='grant' and not exists(select 1 from public.admin_verification_reviews where user_id=p_user_id and status='pending') then raise exception 'verification_not_pending'; end if;
  select uid_number,company_number into v_uid,v_company from public.photographer_business_details where user_id=p_user_id;
  v_uid_duplicate:=exists(select 1 from public.photographer_business_details x where x.user_id<>p_user_id and nullif(upper(regexp_replace(coalesce(x.uid_number,''),'[^A-Za-z0-9]','','g')),'')=upper(regexp_replace(coalesce(v_uid,''),'[^A-Za-z0-9]','','g')));
  v_company_duplicate:=exists(select 1 from public.photographer_business_details x where x.user_id<>p_user_id and nullif(upper(regexp_replace(coalesce(x.company_number,''),'[^A-Za-z0-9]','','g')),'')=upper(regexp_replace(coalesce(v_company,''),'[^A-Za-z0-9]','','g')));
  v_any_no:=exists(select 1 from jsonb_each_text(coalesce(p_results,'{}'::jsonb)) e where e.value='no');
  v_uid_ok:=nullif(v_uid,'') is not null and p_results->>'uid_valid'='yes' and p_results->>'uid_name_address_match'='yes';
  v_company_ok:=nullif(v_company,'') is not null and p_results->>'company_found'='yes' and p_results->>'company_name_match'='yes' and p_results->>'company_active_austria'='yes';
  if p_decision='grant' and (v_any_no or (v_uid_duplicate and nullif(v_uid,'') is not null) or (v_company_duplicate and nullif(v_company,'') is not null) or not (v_uid_ok or v_company_ok)) then raise exception 'verification_checks_incomplete_or_conflicting'; end if;
  v_new:=case p_decision when 'grant' then 'verified' when 'reject' then 'rejected' else 'revoked' end;
  insert into public.admin_action_log(admin_id,action,target_user_id,reason,old_value,new_value) values(v_admin,'verification_'||p_decision,p_user_id,btrim(p_reason),jsonb_build_object('status',v_old),jsonb_build_object('status',v_new));
  insert into public.admin_verification_reviews(user_id,status,reviewed_at,note,results) values(p_user_id,v_new,now(),btrim(p_reason),coalesce(p_results,'{}'::jsonb))
  on conflict(user_id) do update set status=excluded.status,reviewed_at=now(),note=excluded.note,results=excluded.results;
  update public.photographer_profiles set admin_verification_status=v_new where id=p_user_id;
end;
$$;
revoke all on function public.admin_verification_decide(uuid,text,text,jsonb) from public,anon;
grant execute on function public.admin_verification_decide(uuid,text,text,jsonb) to authenticated;

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
revoke all on function public.admin_users_search(text,text,text,boolean) from public,anon;
grant execute on function public.admin_users_search(text,text,text,boolean) to authenticated;

create table if not exists public.admin_user_warnings(
  id bigint generated always as identity primary key,user_id uuid not null references public.profiles(id) on delete cascade,
  admin_id uuid not null,reason text not null,created_at timestamptz not null default now()
);
alter table public.admin_user_warnings enable row level security;
revoke all on public.admin_user_warnings from anon,authenticated;

create table if not exists public.admin_user_notices(
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  notice_type text not null check(notice_type in ('warning','suspension','account_notice')),
  message text not null check(char_length(btrim(message)) between 2 and 1000),
  created_at timestamptz not null default now(),
  seen_at timestamptz
);
alter table public.admin_user_notices enable row level security;
revoke all on public.admin_user_notices from anon,authenticated;

create or replace function public.admin_user_notices_for_me()
returns table(notice_type text,message text,created_at timestamptz)
language plpgsql security definer set search_path=public,auth,pg_temp as $$
begin
  if auth.uid() is null then raise exception 'auth_required' using errcode='42501'; end if;
  return query update public.admin_user_notices n set seen_at=now()
    where n.user_id=auth.uid() and n.seen_at is null
    returning n.notice_type,n.message,n.created_at;
end;
$$;
revoke all on function public.admin_user_notices_for_me() from public,anon;
grant execute on function public.admin_user_notices_for_me() to authenticated;

create or replace function public.admin_user_action(p_user_id uuid,p_action text,p_reason text,p_until timestamptz default null)
returns void language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_admin uuid;v_old jsonb;v_new jsonb;v_status text;v_end timestamptz;
begin
  v_admin:=public.admin_require_access(array['owner','moderator']);
  if p_user_id=v_admin then raise exception 'cannot_change_own_account'; end if;
  if p_action not in ('warn','suspend','permanent_suspend','unsuspend','pause') then raise exception 'invalid_action'; end if;
  if p_action='permanent_suspend' then v_admin:=public.admin_require_recent_auth(); end if;
  if p_action='pause' and not exists(select 1 from public.photographer_profiles where id=p_user_id) then raise exception 'photographer_profile_required'; end if;
  if char_length(btrim(coalesce(p_reason,'')))<2 then raise exception 'reason_required'; end if;
  if not exists(select 1 from public.profiles where id=p_user_id) then raise exception 'user_not_found'; end if;
  select jsonb_build_object('status',status,'reason',reason,'expires_at',expires_at) into v_old from public.admin_account_status where user_id=p_user_id;
  v_old:=coalesce(v_old,jsonb_build_object('status','active'));
  v_status:=case when p_action in ('suspend','permanent_suspend') then 'suspended' when p_action='pause' then 'paused' else 'active' end;
  v_end:=case when p_action='suspend' then p_until else null end;
  if p_action='suspend' and (v_end is null or v_end<now()+interval '7 days' or v_end>now()+interval '30 days') then raise exception 'suspension_period_must_be_7_to_30_days'; end if;
  v_new:=case when p_action='warn' then jsonb_build_object('warning',btrim(p_reason)) else jsonb_build_object('status',v_status,'reason',btrim(p_reason),'expires_at',v_end) end;
  insert into public.admin_action_log(admin_id,action,target_user_id,reason,old_value,new_value) values(v_admin,'user_'||p_action,p_user_id,btrim(p_reason),v_old,v_new);
  if p_action='warn' then
    insert into public.admin_user_warnings(user_id,admin_id,reason) values(p_user_id,v_admin,btrim(p_reason));
    insert into public.admin_user_notices(user_id,notice_type,message) values(p_user_id,'warning',btrim(p_reason));
  else insert into public.admin_account_status(user_id,status,reason,expires_at) values(p_user_id,v_status,btrim(p_reason),v_end)
    on conflict(user_id) do update set status=excluded.status,reason=excluded.reason,expires_at=excluded.expires_at,updated_at=now();
    if p_action in ('suspend','permanent_suspend') then insert into public.admin_user_notices(user_id,notice_type,message) values(p_user_id,'suspension','Dein Konto wurde gesperrt. Grund: '||btrim(p_reason)||'. Wende dich bei Fragen an den WedConnect-Support.');
    elsif p_action='unsuspend' then insert into public.admin_user_notices(user_id,notice_type,message) values(p_user_id,'account_notice','Dein Konto wurde wieder freigeschaltet.');
    elsif p_action='pause' then insert into public.admin_user_notices(user_id,notice_type,message) values(p_user_id,'suspension','Dein Fotograf:innenprofil wurde pausiert. Grund: '||btrim(p_reason)||'. Wende dich bei Fragen an den WedConnect-Support.'); end if;
  end if;
end;
$$;
revoke all on function public.admin_user_action(uuid,text,text,timestamptz) from public,anon;
grant execute on function public.admin_user_action(uuid,text,text,timestamptz) to authenticated;

create or replace function public.admin_reset_user_role(p_user_id uuid,p_reason text)
returns jsonb language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_admin uuid;v_role text;v_likes_given integer;v_likes_received integer;v_matches integer;v_messages integer;v_photos integer;
begin
  v_admin:=public.admin_require_recent_auth();
  if p_user_id=v_admin then raise exception 'cannot_change_own_account'; end if;
  if char_length(btrim(coalesce(p_reason,'')))<2 then raise exception 'reason_required'; end if;
  select role into v_role from public.profiles where id=p_user_id for update;
  if not found then raise exception 'user_not_found'; end if;
  select count(*) into v_likes_given from public.profile_likes where liker_id=p_user_id;
  select count(*) into v_likes_received from public.profile_likes where liked_id=p_user_id;
  select count(*) into v_matches from public.profile_likes a join public.profile_likes b on b.liker_id=a.liked_id and b.liked_id=a.liker_id where a.liker_id=p_user_id;
  select count(*) into v_messages from public.profile_messages where sender_id=p_user_id or recipient_id=p_user_id;
  select count(*) into v_photos from public.profile_photos where user_id=p_user_id;
  insert into public.admin_action_log(admin_id,action,target_user_id,reason,old_value,new_value)
  values(v_admin,'user_role_reset',p_user_id,btrim(p_reason),jsonb_build_object('role',v_role,'photos',v_photos,'likes_given',v_likes_given,'likes_received',v_likes_received,'matches',v_matches,'messages',v_messages),jsonb_build_object('role',null,'profile_status','incomplete','deleted_photos',v_photos,'deleted_likes_given',v_likes_given,'deleted_likes_received',v_likes_received,'deleted_matches',v_matches,'deleted_messages',v_messages));
  delete from public.profile_likes where liker_id=p_user_id or liked_id=p_user_id;
  delete from public.profile_messages where sender_id=p_user_id or recipient_id=p_user_id;
  delete from public.profile_blocks where blocker_id=p_user_id or blocked_id=p_user_id;
  delete from public.profile_skips where skipper_id=p_user_id or skipped_id=p_user_id;
  delete from public.profile_saved_profiles where user_id=p_user_id or saved_profile_id=p_user_id;
  delete from public.profile_photos where user_id=p_user_id;
  delete from public.profile_avatars where user_id=p_user_id;
  delete from public.admin_user_notices where user_id=p_user_id;
  delete from public.admin_user_warnings where user_id=p_user_id;
  delete from public.admin_verification_reviews where user_id=p_user_id;
  delete from public.admin_photographer_reviews where user_id=p_user_id;
  delete from public.photographer_business_details where user_id=p_user_id;
  delete from public.couple_profiles where id=p_user_id;
  delete from public.photographer_profiles where id=p_user_id;
  update public.profiles set role=null,profile_status='incomplete',completed_at=null where id=p_user_id;
  insert into public.admin_user_notices(user_id,notice_type,message) values(p_user_id,'account_notice','Deine WedConnect-Rolle wurde zurückgesetzt. Profildaten, Fotos, Likes, Matches und Nachrichten wurden gelöscht. Du kannst deine Rolle und dein Profil erneut einrichten.');
  return jsonb_build_object('photos',v_photos,'likes_given',v_likes_given,'likes_received',v_likes_received,'matches',v_matches,'messages',v_messages);
end;
$$;
revoke all on function public.admin_reset_user_role(uuid,text) from public,anon;
grant execute on function public.admin_reset_user_role(uuid,text) to authenticated;

create or replace function public.admin_prepare_account_deletion(p_user_id uuid,p_reason text,p_confirmation text)
returns void language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_admin uuid;v_role text;
begin
  v_admin:=public.admin_require_recent_auth();
  perform public.admin_require_access(array['owner']);
  if p_user_id=v_admin then raise exception 'cannot_delete_own_admin_account'; end if;
  if p_confirmation<>'KONTO LÖSCHEN' then raise exception 'confirmation_required'; end if;
  if char_length(btrim(coalesce(p_reason,'')))<2 then raise exception 'reason_required'; end if;
  select role into v_role from public.profiles where id=p_user_id for update;
  if not found then raise exception 'user_not_found'; end if;
  insert into public.admin_action_log(admin_id,action,target_user_id,reason,old_value,new_value)
  values(v_admin,'user_account_deleted',p_user_id,btrim(p_reason),jsonb_build_object('role',v_role),jsonb_build_object('deleted',true));
end;
$$;
revoke all on function public.admin_prepare_account_deletion(uuid,text,text) from public,anon;
grant execute on function public.admin_prepare_account_deletion(uuid,text,text) to authenticated;

create or replace function public.admin_support_list(p_query text default '')
returns table(id uuid,user_id uuid,category text,subject text,admin_status text,created_at timestamptz,updated_at timestamptz)
language plpgsql security definer set search_path=public,auth,pg_temp as $$
begin
  perform public.admin_require_access(array['owner','moderator','support','read_only']);
  return query select t.id,t.user_id,t.category,t.subject,t.admin_status,t.created_at,t.updated_at from public.support_threads t
    where t.admin_status in ('open','in_progress') and not public.admin_is_test_account(t.user_id)
      and (coalesce(p_query,'')='' or t.subject ilike '%'||p_query||'%' or exists(select 1 from public.support_messages m where m.thread_id=t.id and m.body ilike '%'||p_query||'%'))
    order by t.created_at asc;
end;
$$;
revoke all on function public.admin_support_list(text) from public,anon;
grant execute on function public.admin_support_list(text) to authenticated;

create or replace function public.admin_support_detail(p_thread_id uuid)
returns jsonb language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v jsonb;
begin
  perform public.admin_require_access(array['owner','moderator','support','read_only']);
  select jsonb_build_object('thread',to_jsonb(t),'messages',coalesce((
    select jsonb_agg(jsonb_build_object('body',m.body,'sender_type',m.sender_type,'created_at',m.created_at,'user_name',coalesce(cp.partner_one_first_name||' & '||cp.partner_two_first_name,pp.first_name,u.email)) order by m.created_at)
    from public.support_messages m left join public.couple_profiles cp on cp.id=m.sender_id left join public.photographer_profiles pp on pp.id=m.sender_id left join auth.users u on u.id=m.sender_id where m.thread_id=t.id
  ),'[]'::jsonb)) into v from public.support_threads t where t.id=p_thread_id;
  if v is null then raise exception 'support_thread_not_found'; end if;
  return v;
end;
$$;
revoke all on function public.admin_support_detail(uuid) from public,anon;
grant execute on function public.admin_support_detail(uuid) to authenticated;

create or replace function public.admin_support_reply(p_thread_id uuid,p_body text)
returns void language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_admin uuid;
begin
  v_admin:=public.admin_require_access(array['owner','moderator','support']);
  if char_length(btrim(coalesce(p_body,''))) not between 1 and 2000 then raise exception 'message_length_invalid'; end if;
  if not exists(select 1 from public.support_threads where id=p_thread_id) then raise exception 'support_thread_not_found'; end if;
  insert into public.admin_action_log(admin_id,action,reason,new_value) values(v_admin,'support_reply','Antwort an Supportanfrage',jsonb_build_object('thread_id',p_thread_id));
  insert into public.support_messages(thread_id,sender_id,sender_type,body) values(p_thread_id,v_admin,'operator',btrim(p_body));
  update public.support_threads set admin_status='in_progress',status='open' where id=p_thread_id;
end;
$$;
revoke all on function public.admin_support_reply(uuid,text) from public,anon;
grant execute on function public.admin_support_reply(uuid,text) to authenticated;

create or replace function public.admin_support_set_status(p_thread_id uuid,p_status text,p_reason text)
returns void language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_admin uuid;v_old text;
begin
  v_admin:=public.admin_require_access(array['owner','moderator','support']);
  if p_status not in ('open','in_progress','resolved') then raise exception 'invalid_status'; end if;
  if char_length(btrim(coalesce(p_reason,'')))<2 then raise exception 'reason_required'; end if;
  select admin_status into v_old from public.support_threads where id=p_thread_id for update;
  if v_old is null then raise exception 'support_thread_not_found'; end if;
  insert into public.admin_action_log(admin_id,action,reason,old_value,new_value) values(v_admin,'support_status_changed',btrim(p_reason),jsonb_build_object('thread_id',p_thread_id,'status',v_old),jsonb_build_object('thread_id',p_thread_id,'status',p_status));
  update public.support_threads set admin_status=p_status,status=case when p_status='resolved' then 'closed' else 'open' end where id=p_thread_id;
end;
$$;
revoke all on function public.admin_support_set_status(uuid,text,text) from public,anon;
grant execute on function public.admin_support_set_status(uuid,text,text) to authenticated;

create or replace function public.admin_partner_list()
returns setof public.wedconnect_partners language plpgsql security definer set search_path=public,auth,pg_temp as $$
begin
  perform public.admin_require_access(array['owner','finance','read_only']);
  return query select * from public.wedconnect_partners order by created_at desc;
end;
$$;
revoke all on function public.admin_partner_list() from public,anon;
grant execute on function public.admin_partner_list() to authenticated;

create or replace function public.admin_partner_save(p_partner jsonb,p_reason text)
returns uuid language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_admin uuid;v_id uuid;v_old jsonb;
begin
  v_admin:=public.admin_require_access(array['owner','finance']);
  if char_length(btrim(coalesce(p_reason,'')))<2 then raise exception 'reason_required'; end if;
  if char_length(btrim(coalesce(p_partner->>'name','')))<1 then raise exception 'partner_name_required'; end if;
  if coalesce((p_partner->>'commission_rate')::numeric,0) not between 0 and 100 then raise exception 'invalid_commission'; end if;
  v_id:=nullif(p_partner->>'id','')::uuid;
  if v_id is not null then select to_jsonb(p) into v_old from public.wedconnect_partners p where p.id=v_id for update;if v_old is null then raise exception 'partner_not_found';end if;end if;
  insert into public.admin_action_log(admin_id,action,reason,old_value,new_value) values(v_admin,case when v_id is null then 'partner_created' else 'partner_updated' end,btrim(p_reason),v_old,p_partner);
  if v_id is null then
    insert into public.wedconnect_partners(name,category,contact_email,region,commission_rate,commission_basis)
    values(btrim(p_partner->>'name'),coalesce(p_partner->>'category',''),nullif(p_partner->>'contact_email',''),coalesce(p_partner->>'region','Österreich'),coalesce((p_partner->>'commission_rate')::numeric,0),coalesce(p_partner->>'commission_basis','bestätigter Nettoumsatz')) returning id into v_id;
  else
    update public.wedconnect_partners set name=btrim(p_partner->>'name'),category=coalesce(p_partner->>'category',''),contact_email=nullif(p_partner->>'contact_email',''),region=coalesce(p_partner->>'region','Österreich'),commission_rate=coalesce((p_partner->>'commission_rate')::numeric,0),commission_basis=coalesce(p_partner->>'commission_basis','bestätigter Nettoumsatz'),updated_at=now() where id=v_id;
  end if;
  return v_id;
end;
$$;
revoke all on function public.admin_partner_save(jsonb,text) from public,anon;
grant execute on function public.admin_partner_save(jsonb,text) to authenticated;

create or replace function public.admin_partner_status(p_partner_id uuid,p_status text,p_reason text)
returns void language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_admin uuid;v_old text;
begin
  v_admin:=public.admin_require_access(array['owner','finance']);
  if p_status not in ('active','paused','closed') then raise exception 'invalid_status'; end if;
  if char_length(btrim(coalesce(p_reason,'')))<2 then raise exception 'reason_required'; end if;
  select status into v_old from public.wedconnect_partners where id=p_partner_id for update;
  if v_old is null then raise exception 'partner_not_found'; end if;
  insert into public.admin_action_log(admin_id,action,reason,old_value,new_value) values(v_admin,'partner_status_changed',btrim(p_reason),jsonb_build_object('status',v_old),jsonb_build_object('status',p_status));
  update public.wedconnect_partners set status=p_status,updated_at=now() where id=p_partner_id;
end;
$$;
revoke all on function public.admin_partner_status(uuid,text,text) from public,anon;
grant execute on function public.admin_partner_status(uuid,text,text) to authenticated;

create or replace function public.admin_campaign_list()
returns table(id uuid,title text,offer text,partner_name text,target_role text,starts_at date,ends_at date,max_frequency integer,status text,impressions bigint,clicks bigint,redemptions bigint)
language plpgsql security definer set search_path=public,auth,pg_temp as $$
begin
  perform public.admin_require_access(array['owner','finance','read_only']);
  return query select c.id,c.title,c.offer,p.name,c.target_role,c.starts_at,c.ends_at,c.max_frequency,c.status,c.impressions,c.clicks,
  (select count(*) from public.partner_redemptions r where r.campaign_id=c.id and r.status in ('confirmed','settled','paid'))
  from public.partner_campaigns c join public.wedconnect_partners p on p.id=c.partner_id order by c.created_at desc;
end;
$$;
revoke all on function public.admin_campaign_list() from public,anon;
grant execute on function public.admin_campaign_list() to authenticated;

create or replace function public.admin_campaign_save(p_campaign jsonb,p_reason text)
returns uuid language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_admin uuid;v_id uuid;v_old jsonb;
begin
  v_admin:=public.admin_require_access(array['owner','finance']);
  if char_length(btrim(coalesce(p_reason,'')))<2 then raise exception 'reason_required'; end if;
  if char_length(btrim(coalesce(p_campaign->>'title','')))<1 then raise exception 'campaign_title_required'; end if;
  if coalesce(p_campaign->>'target_role','') not in ('','couple','photographer') then raise exception 'invalid_target_role'; end if;
  v_id:=nullif(p_campaign->>'id','')::uuid;
  if v_id is not null then select to_jsonb(c) into v_old from public.partner_campaigns c where c.id=v_id for update;if v_old is null then raise exception 'campaign_not_found';end if;end if;
  insert into public.admin_action_log(admin_id,action,reason,old_value,new_value) values(v_admin,case when v_id is null then 'campaign_created' else 'campaign_updated' end,btrim(p_reason),v_old,p_campaign);
  if v_id is null then
    insert into public.partner_campaigns(partner_id,title,offer,target_role,starts_at,ends_at,max_frequency)
    values((p_campaign->>'partner_id')::uuid,btrim(p_campaign->>'title'),coalesce(p_campaign->>'offer',''),nullif(p_campaign->>'target_role','')::text,(p_campaign->>'starts_at')::date,(p_campaign->>'ends_at')::date,coalesce((p_campaign->>'max_frequency')::integer,3)) returning id into v_id;
  else
    update public.partner_campaigns set partner_id=(p_campaign->>'partner_id')::uuid,title=btrim(p_campaign->>'title'),offer=coalesce(p_campaign->>'offer',''),target_role=nullif(p_campaign->>'target_role','')::text,starts_at=(p_campaign->>'starts_at')::date,ends_at=(p_campaign->>'ends_at')::date,max_frequency=coalesce((p_campaign->>'max_frequency')::integer,3),updated_at=now() where id=v_id;
  end if;
  return v_id;
end;
$$;
revoke all on function public.admin_campaign_save(jsonb,text) from public,anon;
grant execute on function public.admin_campaign_save(jsonb,text) to authenticated;

create or replace function public.admin_campaign_status(p_campaign_id uuid,p_status text,p_reason text)
returns void language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_admin uuid;v_old text;
begin
  v_admin:=public.admin_require_access(array['owner','finance']);
  if p_status not in ('draft','active','paused','ended') then raise exception 'invalid_status'; end if;
  if char_length(btrim(coalesce(p_reason,'')))<2 then raise exception 'reason_required'; end if;
  select status into v_old from public.partner_campaigns where id=p_campaign_id for update;
  if v_old is null then raise exception 'campaign_not_found'; end if;
  insert into public.admin_action_log(admin_id,action,reason,old_value,new_value) values(v_admin,'campaign_status_changed',btrim(p_reason),jsonb_build_object('status',v_old),jsonb_build_object('status',p_status));
  update public.partner_campaigns set status=p_status,updated_at=now() where id=p_campaign_id;
end;
$$;
revoke all on function public.admin_campaign_status(uuid,text,text) from public,anon;
grant execute on function public.admin_campaign_status(uuid,text,text) to authenticated;

create or replace function public.admin_audit_list(p_action text default null,p_target_user_id text default null,p_from date default null)
returns table(id bigint,admin_id uuid,action text,target_user_id uuid,reason text,old_value jsonb,new_value jsonb,created_at timestamptz)
language plpgsql security definer set search_path=public,auth,pg_temp as $$
begin
  perform public.admin_require_access(array['owner','moderator','finance','read_only']);
  return query select l.id,l.admin_id,l.action,l.target_user_id,l.reason,l.old_value,l.new_value,l.created_at from public.admin_action_log l
  where (p_action is null or l.action=p_action) and (p_target_user_id is null or l.target_user_id::text=p_target_user_id) and (p_from is null or l.created_at>=p_from::timestamptz)
  order by l.created_at desc limit 250;
end;
$$;
revoke all on function public.admin_audit_list(text,text,date) from public,anon;
grant execute on function public.admin_audit_list(text,text,date) to authenticated;

create or replace function public.admin_audit_export(p_action text default null,p_target_user_id text default null,p_from date default null)
returns table(id bigint,admin_id uuid,action text,target_user_id uuid,reason text,old_value jsonb,new_value jsonb,created_at timestamptz)
language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_admin uuid;
begin
  v_admin:=public.admin_require_recent_auth();
  insert into public.admin_action_log(admin_id,action,reason,new_value)
    values(v_admin,'audit_export','Admin-Protokoll exportiert',jsonb_build_object('action_filter',p_action,'target_user_filter',p_target_user_id,'from',p_from));
  return query select l.id,l.admin_id,l.action,l.target_user_id,l.reason,l.old_value,l.new_value,l.created_at from public.admin_action_log l
    where (p_action is null or l.action=p_action) and (p_target_user_id is null or l.target_user_id::text=p_target_user_id) and (p_from is null or l.created_at>=p_from::timestamptz)
    order by l.created_at desc limit 10000;
end;
$$;
revoke all on function public.admin_audit_export(text,text,date) from public,anon;
grant execute on function public.admin_audit_export(text,text,date) to authenticated;

create or replace function public.prevent_admin_log_mutation()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin raise exception 'admin_audit_log_is_immutable'; end;
$$;
drop trigger if exists admin_action_log_immutable on public.admin_action_log;
create trigger admin_action_log_immutable before update or delete on public.admin_action_log for each row execute function public.prevent_admin_log_mutation();
revoke all on function public.prevent_admin_log_mutation() from public,anon,authenticated;

create or replace function public.admin_account_is_active(p_user_id uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select coalesce((select s.status='active' or (s.status='suspended' and s.expires_at<=now()) from public.admin_account_status s where s.user_id=p_user_id),true)
$$;
revoke all on function public.admin_account_is_active(uuid) from public,anon;
grant execute on function public.admin_account_is_active(uuid) to authenticated;

create or replace function public.photographer_is_approved(p_user_id uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select exists(select 1 from public.photographer_profiles pp where pp.id=p_user_id and pp.admin_review_status='approved')
$$;
revoke all on function public.photographer_is_approved(uuid) from public,anon;
grant execute on function public.photographer_is_approved(uuid) to authenticated;

-- Moderation states affect discovery and new contact attempts in the database,
-- so a direct API call cannot bypass a pause or suspension.
drop policy if exists "Authenticated users can read complete profile headers" on public.profiles;
create policy "Authenticated users can read complete profile headers" on public.profiles for select to authenticated
  using (profile_status='complete' and public.admin_account_is_active(id) and (role<>'photographer' or public.photographer_is_approved(id)));

drop policy if exists "Read own or complete couple profiles" on public.couple_profiles;
create policy "Read own or complete couple profiles" on public.couple_profiles for select to authenticated
  using (id=(select auth.uid()) or (exists(select 1 from public.profiles p where p.id=couple_profiles.id and p.profile_status='complete') and public.admin_account_is_active(id)));

drop policy if exists "Owners manage own couple profile" on public.couple_profiles;
create policy "Owners manage own couple profile" on public.couple_profiles for all to authenticated
  using (id=(select auth.uid()) and public.admin_account_is_active(couple_profiles.id) and exists(select 1 from public.profiles p where p.id=couple_profiles.id and p.role='couple'))
  with check (id=(select auth.uid()) and public.admin_account_is_active(couple_profiles.id) and exists(select 1 from public.profiles p where p.id=couple_profiles.id and p.role='couple'));

drop policy if exists "Read own or complete photographer profiles" on public.photographer_profiles;
create policy "Read own or complete photographer profiles" on public.photographer_profiles for select to authenticated
  using (id=(select auth.uid()) or (exists(select 1 from public.profiles p where p.id=photographer_profiles.id and p.profile_status='complete') and public.admin_account_is_active(id) and admin_review_status='approved'));

drop policy if exists "Owners manage own photographer profile" on public.photographer_profiles;
create policy "Owners manage own photographer profile" on public.photographer_profiles for all to authenticated
  using (id=(select auth.uid()) and public.admin_account_is_active(photographer_profiles.id) and exists(select 1 from public.profiles p where p.id=photographer_profiles.id and p.role='photographer'))
  with check (id=(select auth.uid()) and public.admin_account_is_active(photographer_profiles.id) and exists(select 1 from public.profiles p where p.id=photographer_profiles.id and p.role='photographer'));

drop policy if exists "Read own or complete profile photos" on public.profile_photos;
create policy "Read own or complete profile photos" on public.profile_photos for select to authenticated
  using (user_id=(select auth.uid()) or (exists(select 1 from public.profiles p where p.id=profile_photos.user_id and p.profile_status='complete') and public.admin_account_is_active(user_id) and (not exists(select 1 from public.profiles p where p.id=user_id and p.role='photographer') or public.photographer_is_approved(user_id))));

drop policy if exists "Owners manage own profile photos" on public.profile_photos;
create policy "Owners manage own profile photos" on public.profile_photos for all to authenticated
  using (user_id=(select auth.uid()) and public.admin_account_is_active(user_id))
  with check (user_id=(select auth.uid()) and public.admin_account_is_active(user_id));

drop policy if exists "Owners manage own profile avatars" on public.profile_avatars;
create policy "Owners manage own profile avatars" on public.profile_avatars for all to authenticated
  using (user_id=(select auth.uid()) and public.admin_account_is_active(user_id))
  with check (user_id=(select auth.uid()) and public.admin_account_is_active(user_id));

drop policy if exists "Read own or complete WedConnect profile photos" on storage.objects;
create policy "Read own or complete WedConnect profile photos" on storage.objects for select to authenticated
  using (bucket_id='wedconnect-profile-photos' and (
    (storage.foldername(name))[1]=(select auth.uid())::text
    or (exists(select 1 from public.profiles p where p.id::text=(storage.foldername(name))[1] and p.profile_status='complete' and public.admin_account_is_active(p.id))
      and (not exists(select 1 from public.profiles p where p.id::text=(storage.foldername(name))[1] and p.role='photographer') or exists(select 1 from public.photographer_profiles pp where pp.id::text=(storage.foldername(name))[1] and pp.admin_review_status='approved')))
  ));
drop policy if exists "Upload own WedConnect profile photos" on storage.objects;
create policy "Upload own WedConnect profile photos" on storage.objects for insert to authenticated
  with check (bucket_id='wedconnect-profile-photos' and (storage.foldername(name))[1]=(select auth.uid())::text and public.admin_account_is_active((select auth.uid())));
drop policy if exists "Update own WedConnect profile photos" on storage.objects;
create policy "Update own WedConnect profile photos" on storage.objects for update to authenticated
  using (bucket_id='wedconnect-profile-photos' and (storage.foldername(name))[1]=(select auth.uid())::text and public.admin_account_is_active((select auth.uid())))
  with check (bucket_id='wedconnect-profile-photos' and (storage.foldername(name))[1]=(select auth.uid())::text and public.admin_account_is_active((select auth.uid())));
drop policy if exists "Delete own WedConnect profile photos" on storage.objects;
create policy "Delete own WedConnect profile photos" on storage.objects for delete to authenticated
  using (bucket_id='wedconnect-profile-photos' and (storage.foldername(name))[1]=(select auth.uid())::text and public.admin_account_is_active((select auth.uid())));

-- Existing chat partners may retain conversation access, but paused or suspended
-- accounts and unapproved photographer profiles are removed from profile surfaces.
drop policy if exists "Chat partners read peer profile headers" on public.profiles;
create policy "Chat partners read peer profile headers" on public.profiles for select to authenticated
  using (public.admin_account_is_active(id) and (role<>'photographer' or public.photographer_is_approved(id)) and exists(
    select 1 from public.profile_messages pm where (pm.sender_id=(select auth.uid()) and pm.recipient_id=profiles.id) or (pm.recipient_id=(select auth.uid()) and pm.sender_id=profiles.id)));
drop policy if exists "Chat partners read peer couple profiles" on public.couple_profiles;
create policy "Chat partners read peer couple profiles" on public.couple_profiles for select to authenticated
  using (public.admin_account_is_active(id) and exists(select 1 from public.profile_messages pm where (pm.sender_id=(select auth.uid()) and pm.recipient_id=couple_profiles.id) or (pm.recipient_id=(select auth.uid()) and pm.sender_id=couple_profiles.id)));
drop policy if exists "Chat partners read peer photographer profiles" on public.photographer_profiles;
create policy "Chat partners read peer photographer profiles" on public.photographer_profiles for select to authenticated
  using (public.admin_account_is_active(id) and admin_review_status='approved' and exists(select 1 from public.profile_messages pm where (pm.sender_id=(select auth.uid()) and pm.recipient_id=photographer_profiles.id) or (pm.recipient_id=(select auth.uid()) and pm.sender_id=photographer_profiles.id)));
drop policy if exists "Chat partners read peer account avatars" on public.profile_avatars;
create policy "Chat partners read peer account avatars" on public.profile_avatars for select to authenticated
  using (public.admin_account_is_active(user_id) and exists(select 1 from public.profiles p where p.id=user_id and (p.role<>'photographer' or public.photographer_is_approved(p.id))) and exists(
    select 1 from public.profile_messages pm where (pm.sender_id=(select auth.uid()) and pm.recipient_id=profile_avatars.user_id) or (pm.recipient_id=(select auth.uid()) and pm.sender_id=profile_avatars.user_id)));
drop policy if exists "Chat partners read peer account avatar files" on storage.objects;
create policy "Chat partners read peer account avatar files" on storage.objects for select to authenticated
  using (bucket_id='wedconnect-profile-photos' and exists(select 1 from public.profile_avatars pa join public.profiles p on p.id=pa.user_id
    where pa.object_path=storage.objects.name and public.admin_account_is_active(pa.user_id) and (p.role<>'photographer' or public.photographer_is_approved(p.id)) and exists(
      select 1 from public.profile_messages pm where (pm.sender_id=(select auth.uid()) and pm.recipient_id=pa.user_id) or (pm.recipient_id=(select auth.uid()) and pm.sender_id=pa.user_id))));

drop policy if exists "Complete profiles can like opposite roles" on public.profile_likes;
create policy "Complete profiles can like opposite roles" on public.profile_likes for insert to authenticated
  with check (
    liker_id=(select auth.uid()) and liked_id<>(select auth.uid())
    and public.admin_account_is_active(liker_id) and public.admin_account_is_active(liked_id)
    and exists(select 1 from public.profiles liker join public.profiles liked on liked.id=profile_likes.liked_id
      where liker.id=(select auth.uid()) and liker.profile_status='complete' and liked.profile_status='complete'
      and liker.role in ('couple','photographer') and liked.role in ('couple','photographer') and liker.role<>liked.role
      and (liker.role<>'photographer' or public.photographer_is_approved(liker.id))
      and (liked.role<>'photographer' or public.photographer_is_approved(liked.id)))
  );

drop policy if exists "Matched users send messages" on public.profile_messages;
create policy "Matched users send messages" on public.profile_messages for insert to authenticated
  with check (
    sender_id=(select auth.uid()) and recipient_id<>(select auth.uid())
    and char_length(trim(body)) between 1 and 2000
    and public.admin_account_is_active(sender_id) and public.admin_account_is_active(recipient_id)
    and exists(select 1 from public.profile_likes sent where sent.liker_id=profile_messages.sender_id and sent.liked_id=profile_messages.recipient_id)
    and exists(select 1 from public.profile_likes received where received.liker_id=profile_messages.recipient_id and received.liked_id=profile_messages.sender_id)
  );

comment on function public.admin_account_is_active(uuid) is 'Used by RLS to prevent suspended or paused accounts from appearing in discovery or initiating new matches/messages.';

create or replace function public.admin_session_is_mfa()
returns boolean language sql stable security definer set search_path=public,auth,pg_temp as $$
  select exists(select 1 from public.admin_users a join public.admin_sessions s on s.user_id=a.user_id
    where a.user_id=auth.uid() and s.auth_session_id=nullif(auth.jwt()->>'session_id','')::uuid
      and s.started_at>now()-interval '8 hours' and s.last_activity_at>now()-interval '30 minutes'
      and (coalesce(auth.jwt()->>'aal','aal1')='aal2' or s.recovery_code_used))
$$;
revoke all on function public.admin_session_is_mfa() from public,anon;
grant execute on function public.admin_session_is_mfa() to authenticated;

drop policy if exists "WedConnect admin MFA can read profile photos" on storage.objects;
create policy "WedConnect admin MFA can read profile photos" on storage.objects for select to authenticated
  using (bucket_id='wedconnect-profile-photos' and public.admin_session_is_mfa());

create or replace function public.admin_review_detail(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_profile jsonb;v_review jsonb;v_photos jsonb;
begin
  perform public.admin_require_access(array['owner','moderator']);
  select to_jsonb(pp) into v_profile from public.photographer_profiles pp join public.profiles p on p.id=pp.id where pp.id=p_user_id and p.profile_status='complete';
  if v_profile is null then raise exception 'profile_not_found'; end if;
  select to_jsonb(r) into v_review from public.admin_photographer_reviews r where r.user_id=p_user_id;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'photo_type',photo_type,'object_path',object_path,'display_path',display_path,'sort_order',sort_order) order by sort_order,created_at),'[]'::jsonb)
    into v_photos from public.profile_photos where user_id=p_user_id;
  return jsonb_build_object('profile',v_profile,'review',coalesce(v_review,'{}'::jsonb),'photos',v_photos);
end;
$$;
revoke all on function public.admin_review_detail(uuid) from public,anon;
grant execute on function public.admin_review_detail(uuid) to authenticated;

create or replace function public.admin_issue_redemption_code(p_campaign_id uuid,p_code_hash text,p_user_id uuid default null)
returns uuid language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_admin uuid;v_redemption uuid;v_rate numeric;v_basis text;
begin
  v_admin:=public.admin_require_access(array['owner','finance']);
  if p_code_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid_code_hash'; end if;
  select p.commission_rate,p.commission_basis into v_rate,v_basis from public.partner_campaigns c join public.wedconnect_partners p on p.id=c.partner_id
    where c.id=p_campaign_id and c.status='active' and p.status='active' and c.starts_at<=current_date and c.ends_at>=current_date;
  if v_rate is null then raise exception 'campaign_not_active'; end if;
  if p_user_id is not null and not exists(select 1 from public.profiles where id=p_user_id) then raise exception 'user_not_found'; end if;
  insert into public.admin_action_log(admin_id,action,target_user_id,reason,new_value)
    values(v_admin,'partner_code_issued',p_user_id,'Partnercode ausgegeben',jsonb_build_object('campaign_id',p_campaign_id));
  insert into public.partner_redemptions(campaign_id,code_hash,user_id,commission_rate,commission_basis)
    values(p_campaign_id,p_code_hash,p_user_id,v_rate,v_basis) returning id into v_redemption;
  return v_redemption;
end;
$$;
revoke all on function public.admin_issue_redemption_code(uuid,text,uuid) from public,anon;
grant execute on function public.admin_issue_redemption_code(uuid,text,uuid) to authenticated;

create or replace function public.admin_redemption_list()
returns table(id uuid,campaign_id uuid,campaign_title text,partner_name text,user_id uuid,status text,redeemed_at timestamptz,reported_amount numeric,confirmed_amount numeric,commission_amount numeric,commission_rate numeric,commission_basis text,created_at timestamptz)
language plpgsql security definer set search_path=public,auth,pg_temp as $$
begin
  perform public.admin_require_access(array['owner','finance','read_only']);
  return query select r.id,r.campaign_id,c.title,p.name,r.user_id,r.status,r.redeemed_at,r.reported_amount,r.confirmed_amount,r.commission_amount,r.commission_rate,r.commission_basis,r.created_at
    from public.partner_redemptions r join public.partner_campaigns c on c.id=r.campaign_id join public.wedconnect_partners p on p.id=c.partner_id order by r.created_at desc limit 500;
end;
$$;
revoke all on function public.admin_redemption_list() from public,anon;
grant execute on function public.admin_redemption_list() to authenticated;

create or replace function public.admin_redemption_update(p_redemption_id uuid,p_status text,p_amount numeric,p_reason text)
returns void language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_admin uuid;v_old text;v_old_amount numeric;v_rate numeric;v_commission numeric;v_basis text;
begin
  v_admin:=public.admin_require_access(array['owner','finance']);
  if p_status not in ('reported','confirmed','reversed','settled','paid') then raise exception 'invalid_redemption_status'; end if;
  if char_length(btrim(coalesce(p_reason,'')))<2 then raise exception 'reason_required'; end if;
  select status,confirmed_amount,commission_rate,commission_basis into v_old,v_old_amount,v_rate,v_basis from public.partner_redemptions where id=p_redemption_id for update;
  if v_old is null then raise exception 'redemption_not_found'; end if;
  if v_old='paid' or (v_old='issued' and p_status not in ('reported','reversed')) or (v_old='reported' and p_status not in ('confirmed','reversed')) or (v_old='confirmed' and p_status not in ('settled','reversed')) or (v_old='settled' and p_status not in ('paid','reversed')) then raise exception 'invalid_status_transition'; end if;
  if p_status in ('confirmed','settled','paid') and (p_amount is null or p_amount<0) then raise exception 'amount_required'; end if;
  v_commission:=case when p_status in ('confirmed','settled','paid') then round(p_amount*v_rate/100,2) else null end;
  insert into public.admin_action_log(admin_id,action,reason,old_value,new_value) values(v_admin,'partner_redemption_'||p_status,btrim(p_reason),jsonb_build_object('status',v_old,'amount',v_old_amount),jsonb_build_object('status',p_status,'amount',p_amount,'commission',v_commission,'basis',v_basis));
  update public.partner_redemptions set status=p_status,redeemed_at=case when p_status='reported' then coalesce(redeemed_at,now()) else redeemed_at end,
    reported_amount=case when p_status='reported' then p_amount else reported_amount end,
    confirmed_amount=case when p_status in ('confirmed','settled','paid') then p_amount when p_status='reversed' then null else confirmed_amount end,
    commission_amount=case when p_status in ('confirmed','settled','paid') then v_commission when p_status='reversed' then null else commission_amount end
    where id=p_redemption_id;
end;
$$;
revoke all on function public.admin_redemption_update(uuid,text,numeric,text) from public,anon;
grant execute on function public.admin_redemption_update(uuid,text,numeric,text) to authenticated;
