-- admin_my_access_level calls admin_require_access(), which updates the active
-- admin session. It must therefore be VOLATILE so PostgREST does not run it
-- inside a read-only transaction.
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
