begin;

create function public.sb_current_hold(p_event_id text, p_session_hash text)
returns jsonb
language sql
security definer
set search_path = pg_catalog
as $$
  with lookup_time as materialized (select clock_timestamp() as checked_at)
  select coalesce((
    select sb_hold.result(h, t.checked_at)
    from lookup_time as t cross join sb_hold.holds as h
    where h.event_id = p_event_id and h.session_hash = p_session_hash
      and h.status = 'active' and h.expires_at > t.checked_at
    order by h.expires_at desc
    limit 1
  ), jsonb_build_object('ok', false, 'code', 'not_found'));
$$;

revoke all on function public.sb_current_hold(text, text) from public, anon, authenticated;
grant execute on function public.sb_current_hold(text, text) to service_role;

commit;
