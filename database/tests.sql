-- Run on an isolated PostgreSQL 17 database after 001-seat-holds.sql, as its owner.
-- Create NOLOGIN roles anon, authenticated and service_role before the migration.
begin;
set timezone = 'UTC';

create function pg_temp.assert_true(condition boolean, description text)
returns void
language plpgsql
as $$
begin
  if condition is not true then
    raise exception 'Failed: %', description;
  end if;
end;
$$;

insert into sb_hold.events (id, status, max_seats, hold_seconds, prevent_single) values
  ('fixture-core', 'open', 2, 600, false),
  ('fixture-expiry', 'open', 2, 1, false),
  ('fixture-orphan', 'open', 3, 600, true);

insert into sb_hold.seats (event_id, seat_id, section_id, row, number, run_id, run_order, price_minor, state)
values
  ('fixture-core', 'a', 'main', 1, 1, 'row1', 0, 6500, 'available'),
  ('fixture-core', 'b', 'main', 1, 2, 'row1', 1, 7500, 'available'),
  ('fixture-core', 'c', 'main', 1, 3, 'row1', 2, 8500, 'available'),
  ('fixture-core', 'd', 'main', 1, 4, 'row1', 3, 9500, 'available'),
  ('fixture-core', 'e', 'side', 2, 1, 'row2', 0, 5500, 'sold'),
  ('fixture-expiry', 'a', 'main', 1, 1, 'row1', 0, 6500, 'available'),
  ('fixture-expiry', 'b', 'main', 1, 2, 'row1', 1, 6500, 'available'),
  ('fixture-expiry', 'c', 'main', 1, 3, 'row1', 2, 6500, 'blocked'),
  ('fixture-orphan', 'a', 'main', 1, 1, 'row1', 0, 6500, 'available'),
  ('fixture-orphan', 'b', 'main', 1, 2, 'row1', 1, 6500, 'available'),
  ('fixture-orphan', 'c', 'main', 1, 3, 'row1', 2, 6500, 'available'),
  ('fixture-orphan', 'd', 'main', 1, 4, 'row1', 3, 6500, 'available'),
  ('fixture-orphan', 'e', 'main', 1, 5, 'row1', 4, 6500, 'blocked'),
  ('fixture-orphan', 'f', 'main', 1, 6, 'row1', 5, 6500, 'available'),
  ('fixture-orphan', 'g', 'main', 1, 7, 'aisle-separated', 0, 6500, 'available');

do $$
declare
  s1 constant text := repeat('a', 64);
  s2 constant text := repeat('b', 64);
  v_hold uuid;
  v_old uuid;
  v_new uuid;
  r jsonb;
begin
  r := public.sb_create_hold('fixture-core', s1, array['c','b'], 1, 'initial');
  v_hold := (r #>> '{hold,id}')::uuid;
  perform pg_temp.assert_true(
    r->>'ok' = 'true' and r #>> '{hold,status}' = 'active' and r #>> '{hold,currency}' = 'PLN'
      and r #>> '{hold,subtotalMinor}' = '16000' and r #>> '{hold,version}' = '1'
      and r #> '{hold,items}' = '[{"seatId":"b","priceMinor":7500},{"seatId":"c","priceMinor":8500}]',
    'create atomically snapshots canonical sorted prices');
  r := public.sb_inventory('fixture-core');
  perform pg_temp.assert_true(
    r->'sections' = '[{"sectionId":"main","total":4,"available":2,"minPriceMinor":6500},{"sectionId":"side","total":1,"available":0,"minPriceMinor":null}]'
      and not r ? 'seats', 'compact inventory uses live availability');
  r := public.sb_inventory('fixture-core', 'main');
  perform pg_temp.assert_true(
    r->'seats'->1 = '{"seatId":"b","sectionId":"main","row":1,"number":2,"runId":"row1","runOrder":1,"priceMinor":7500,"status":"held"}'
      and not r ? 'sections' and jsonb_array_length(r->'seats') = 4,
    'section inventory exposes no ownership fields');
  perform pg_temp.assert_true(
    public.sb_inventory('fixture-core', 'missing')->'seats' = '[]'
      and public.sb_inventory('missing')->>'code' = 'not_found', 'empty section and unknown event');

  r := public.sb_create_hold('fixture-core', s2, array['a','c'], 1, 'conflict');
  perform pg_temp.assert_true(r->>'code' = 'held' and r->'seatIds' = '["c"]', 'held conflict');
  r := public.sb_create_hold('fixture-core', s2, array['d','missing'], 1, 'missing');
  perform pg_temp.assert_true(r->>'code' = 'unavailable' and r->'seatIds' = '["missing"]', 'missing seat conflict');
  perform pg_temp.assert_true((
    select count(*) = 2 and bool_and(active_hold = v_hold) from sb_hold.seats
      where event_id = 'fixture-core' and active_hold is not null
  ), 'conflicting requests leave every pointer unchanged');
  perform pg_temp.assert_true((
    select count(*) = 1 from sb_hold.holds where event_id = 'fixture-core'
  ), 'conflicting requests create no hold');

  r := public.sb_create_hold('fixture-core', s1, array['a'], 1, 'another');
  perform pg_temp.assert_true(r->>'code' = 'active_hold_exists' and r->>'holdId' = v_hold::text,
    'one active hold per session and event');
  perform pg_temp.assert_true(
    public.sb_create_hold('fixture-core', s2, array['a','b','c'], 1, 'limit')->>'code' = 'seat_limit'
      and public.sb_create_hold('fixture-core', s2, array['a','a'], 1, 'duplicate')->>'code' = 'invalid_request'
      and public.sb_create_hold('fixture-core', s2, array[]::text[], 1, 'empty')->>'code' = 'invalid_request',
    'limit, duplicate, and empty requests');
  perform pg_temp.assert_true(
    public.sb_get_hold(v_hold, s2)->>'code' = 'not_found' and public.sb_release_hold(v_hold, s2)->>'code' = 'not_found',
    'foreign session cannot read or release hold');

  update sb_hold.events set status = 'closed' where id = 'fixture-core';
  r := public.sb_create_hold('fixture-core', s1, array['b','c'], 1, 'initial');
  perform pg_temp.assert_true(r #>> '{hold,id}' = v_hold::text and r #>> '{hold,status}' = 'active' and r->>'replayed' = 'true',
    'canonical retry after close preserves original hold');
  perform pg_temp.assert_true(
    public.sb_create_hold('fixture-core', s1, array['a','c'], 1, 'initial')->>'code' = 'idempotency_key_reused'
      and public.sb_create_hold('fixture-core', s1, array['b','c'], 1, 'initial', true)->>'code' = 'idempotency_key_reused'
      and public.sb_create_hold('fixture-core', s2, array['a'], 1, 'closed')->>'code' = 'event_closed',
    'mismatched retry and closed event');
  update sb_hold.events set status = 'open', version = 2 where id = 'fixture-core';
  update sb_hold.seats set price_minor = 7650 where event_id = 'fixture-core' and seat_id = 'b';
  perform pg_temp.assert_true(
    public.sb_create_hold('fixture-core', s2, array['a'], 1, 'stale')->>'code' = 'catalog_changed'
      and public.sb_get_hold(v_hold, s1) #>> '{hold,subtotalMinor}' = '16000', 'catalog version and immutable price');
  perform pg_temp.assert_true(
    public.sb_release_hold(v_hold, s1) #>> '{hold,status}' = 'released'
      and public.sb_release_hold(v_hold, s1) #>> '{hold,status}' = 'released'
      and public.sb_create_hold('fixture-core', s1, array['b','c'], 1, 'initial') #>> '{hold,status}' = 'released',
    'release and create retry remain idempotent');
  perform pg_temp.assert_true((
    select count(*) = 0 from sb_hold.seats where event_id = 'fixture-core' and active_hold is not null
  ), 'release clears all matching pointers');

  r := public.sb_create_hold('fixture-expiry', s1, array['a','b'], 1, 'expiring');
  v_old := (r #>> '{hold,id}')::uuid;
  perform pg_sleep(1.1);
  perform pg_temp.assert_true(public.sb_get_hold(v_old, s1) #>> '{hold,status}' = 'expired',
    'get derives expiry from live wall clock inside one transaction');
  r := public.sb_create_hold('fixture-expiry', s2, array['b','c'], 1, 'blocked');
  perform pg_temp.assert_true(r->>'code' = 'unavailable' and (
    select active_hold = v_old from sb_hold.seats where event_id = 'fixture-expiry' and seat_id = 'b'
  ), 'failed group does not clear an already expired pointer');
  r := public.sb_create_hold('fixture-expiry', s2, array['a'], 1, 'replacement');
  v_new := (r #>> '{hold,id}')::uuid;
  perform pg_temp.assert_true(v_new <> v_old and r #>> '{hold,status}' = 'active', 'expired seat can be claimed again');
  perform pg_temp.assert_true(
    public.sb_create_hold('fixture-expiry', s1, array['b','a'], 1, 'expiring') #>> '{hold,status}' = 'expired'
      and public.sb_release_hold(v_old, s1) #>> '{hold,status}' = 'expired',
    'exact retry and late release derive old expiry');
  perform pg_temp.assert_true((
    select count(*) = 1 and bool_and(active_hold = v_new) from sb_hold.seats
      where event_id = 'fixture-expiry' and active_hold is not null
  ), 'late release clears stale pointer and preserves new hold');

  r := public.sb_create_hold('fixture-orphan', s1, array['b','c'], 1, 'orphan');
  perform pg_temp.assert_true(r->>'code' = 'single_seat_gap' and r->'seatIds' = '["a","d"]',
    'mandatory rule rejects new singletons');
  r := public.sb_create_hold('fixture-core', s1, array['b','c'], 2, 'opt-in', true);
  perform pg_temp.assert_true(r->>'code' = 'single_seat_gap' and r->'seatIds' = '["a","d"]',
    'optional preference applies when event policy is disabled');
  r := public.sb_create_hold('fixture-orphan', s1, array['a','b'], 1, 'pair');
  v_hold := (r #>> '{hold,id}')::uuid;
  perform pg_temp.assert_true(r->>'ok' = 'true', 'pre-existing singletons remain grandfathered');
  r := public.sb_create_hold('fixture-orphan', s2, array['c'], 1, 'held-neighbor');
  perform pg_temp.assert_true(r->>'code' = 'single_seat_gap' and r->'seatIds' = '["d"]',
    'live holds are unavailable neighbors when comparing before and after');
  perform pg_temp.assert_true(public.sb_release_hold(v_hold, s1) #>> '{hold,status}' = 'released',
    'orphan policy never blocks release');
end;
$$;

do $$
declare
  rpc text;
begin
  foreach rpc in array array[
    'public.sb_create_hold(text,text,text[],bigint,text,boolean)',
    'public.sb_get_hold(uuid,text)', 'public.sb_release_hold(uuid,text)',
    'public.sb_inventory(text,text)', 'public.sb_consume_hold_request(text,integer)'
  ] loop
    perform pg_temp.assert_true(
      not has_function_privilege('anon', rpc, 'execute') and not has_function_privilege('authenticated', rpc, 'execute')
        and has_function_privilege('service_role', rpc, 'execute'), 'RPC access limited to service role: ' || rpc);
  end loop;
  perform pg_temp.assert_true(
    not has_schema_privilege('service_role', 'sb_hold', 'usage')
      and not has_schema_privilege('anon', 'sb_hold', 'usage')
      and not has_schema_privilege('authenticated', 'sb_hold', 'usage')
      and not has_table_privilege('service_role', 'sb_hold.seats', 'update'),
    'ordinary roles have no private schema or direct write grants');
  perform pg_temp.assert_true((
    select count(*) = 4 and bool_and(c.relrowsecurity)
    from pg_class as c join pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'sb_hold' and c.relkind = 'r'
  ), 'RLS is enabled on every table');
end;
$$;

set local role anon;
do $$
begin
  begin
    perform public.sb_consume_hold_request(repeat('c', 64), 20);
    raise exception 'Anonymous RPC unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    update sb_hold.seats set state = 'sold' where event_id = 'fixture-core';
    raise exception 'Anonymous write unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

set local role service_role;
do $$
begin
  if public.sb_inventory('fixture-core')->>'version' <> '2'
    or public.sb_consume_hold_request(repeat('d', 64), 100)->>'allowed' <> 'true'
    or public.sb_consume_hold_request('invalid', 100)->>'code' <> 'invalid_request'
    or public.sb_consume_hold_request(repeat('d', 64), 0)->>'code' <> 'invalid_request'
  then
    raise exception 'Service role RPC validation failed';
  end if;
end;
$$;
reset role;

rollback;
