-- Run on an isolated PostgreSQL 17 database after the seat hold migrations, as their owner.
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
  perform pg_temp.assert_true(
    public.sb_current_hold('fixture-core', s1) = r
      and public.sb_current_hold('fixture-core', s2) = '{"ok":false,"code":"not_found"}'
      and public.sb_current_hold('fixture-expiry', s1) = '{"ok":false,"code":"not_found"}',
    'current lookup returns a live hold for its session and event only');
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
  perform pg_temp.assert_true(
    public.sb_current_hold('fixture-core', s1) = '{"ok":false,"code":"not_found"}',
    'current lookup omits released holds');
  perform pg_temp.assert_true((
    select count(*) = 0 from sb_hold.seats where event_id = 'fixture-core' and active_hold is not null
  ), 'release clears all matching pointers');

  r := public.sb_create_hold('fixture-expiry', s1, array['a','b'], 1, 'expiring');
  v_old := (r #>> '{hold,id}')::uuid;
  perform pg_sleep(1.1);
  perform pg_temp.assert_true(public.sb_get_hold(v_old, s1) #>> '{hold,status}' = 'expired',
    'get derives expiry from live wall clock inside one transaction');
  perform pg_temp.assert_true(
    public.sb_current_hold('fixture-expiry', s1) = '{"ok":false,"code":"not_found"}',
    'current lookup omits expired holds');
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

insert into sb_hold.events (id, status, min_seats, max_seats)
values ('quote-a', 'open', 1, 3), ('quote-b', 'open', 2, 3);

insert into sb_hold.seats (event_id, seat_id, section_id, row, number, run_id, run_order, price_minor)
select e.id, s.id, 'main', 1, s.pos, 'row', s.pos, s.price
from sb_hold.events as e cross join (values ('a',1,1000),('b',2,8000),('c',3,8500),('d',4,9000)) as s(id,pos,price)
where e.id in ('quote-a','quote-b');

insert into sb_hold.ticket_types (event_id,id,label,sort_order,adjustment_minor) values
  ('quote-a','standard','Normalny',0,0), ('quote-a','child','Dziecko',1,-2000),
  ('quote-b','standard','Normalny',0,0), ('quote-b','child','Dziecko',1,-3000),
  ('quote-b','event-only','Osobny',2,0);

do $$
declare
  s1 constant text := repeat('a', 64);
  s2 constant text := repeat('b', 64);
  a constant jsonb := '{"seatId":"a","ticketTypeId":"child"}';
  b constant jsonb := '{"seatId":"b","ticketTypeId":"child"}';
  c constant jsonb := '{"seatId":"c","ticketTypeId":"standard"}';
  d constant jsonb := '{"seatId":"d","ticketTypeId":"standard"}';
  selections constant jsonb := jsonb_build_array(b,a);
  t1 uuid;
  t2 uuid;
  t3 uuid;
  h1 uuid;
  h2 uuid;
  q jsonb;
  r jsonb;
begin
  perform pg_temp.assert_true((
    select (min_seats,max_seats)=(1,10) from sb_hold.events where id='enea-demo'
  ) and (
    select (min_seats,max_seats)=(2,6) from sb_hold.events where id='enea-demo-alt'
  ) and (
    select count(*)=6 from sb_hold.ticket_types where event_id in ('enea-demo','enea-demo-alt')
  ), 'demo event policies and ticket types are isolated');

  perform pg_temp.assert_true(
    public.sb_quote_v2('quote-a',s1,'[{"seatId":"a","ticketTypeId":"event-only"}]',1,false)->>'code' = 'invalid_ticket_type'
      and public.sb_quote_v2('quote-a',s1,'[{"seatId":"a","ticketTypeId":"missing"}]',1,false)->>'code' = 'invalid_ticket_type'
      and public.sb_quote_v2('quote-a',s1,jsonb_build_array(a,a),1,false)->>'code' = 'invalid_request'
      and public.sb_quote_v2('quote-a',s1,'[]',1,false)->>'code' = 'invalid_request'
      and public.sb_quote_v2('quote-b',s1,jsonb_build_array(a),1,false) @> '{"code":"below_minimum","minSeats":2}'
      and public.sb_quote_v2('quote-b',s1,jsonb_build_array(a,b,c,d),1,false) @> '{"code":"seat_limit","maxSeats":3}'
      and public.sb_quote_v2('quote-a',s1,jsonb_build_array(b,c),1,true)->>'code' = 'single_seat_gap',
    'quote rejects invalid types, duplicates, counts and orphan seats');

  q := public.sb_quote_v2('quote-a',s1,selections,1,false)->'quote';
  t1 := (q->>'quoteToken')::uuid;
  perform pg_temp.assert_true(q @> '{"eventId":"quote-a","version":1,"currency":"PLN","subtotalMinor":6000}'
    and q->'items' = '[{"seatId":"a","ticketTypeId":"child","priceMinor":0},{"seatId":"b","ticketTypeId":"child","priceMinor":6000}]'
    and (q->>'expiresAt')::timestamptz between clock_timestamp() + interval '110 seconds'
      and clock_timestamp() + interval '120 seconds', 'quote is sorted, integer, clamped, and time limited');
  t2 := (public.sb_quote_v2('quote-a',s1,jsonb_build_array(a,b),1,false)#>>'{quote,quoteToken}')::uuid;
  perform pg_temp.assert_true(t1<>t2 and (
    select count(*)=2 and count(distinct request_hash)=1 from sb_hold.quotes where id in (t1,t2)
  ), 'order-independent mapping can be quoted with independent tokens');

  perform pg_temp.assert_true(
    public.sb_create_hold_v2('quote-a',s2,t1,'retry-key')->>'code'='not_found'
      and public.sb_create_hold_v2('quote-b',s1,t1,'retry-key')->>'code'='not_found',
    'token scope is tied to the session and event');
  r := public.sb_create_hold_v2('quote-a',s1,t1,'retry-key');
  h1 := (r#>>'{hold,id}')::uuid;
  perform pg_temp.assert_true(r#>'{hold,items}'=q->'items' and r#>'{hold,subtotalMinor}'=q->'subtotalMinor'
    and public.sb_current_hold('quote-a',s1)=r and public.sb_get_hold(h1,s1)=r,
    'create, restore and get preserve immutable typed items');
  perform pg_temp.assert_true(
    public.sb_create_hold_v2('quote-a',s1,t1,'other-key')->>'code'='quote_consumed'
      and public.sb_create_hold_v2('quote-a',s1,t2,'retry-key')->>'code'='idempotency_key_reused'
      and public.sb_create_hold_v2('quote-a',s1,t2,'other-key')->>'code'='active_hold_exists'
      and public.sb_quote_v2('quote-a',s2,selections,1,false)->>'code'='held',
    'a consumed token or idempotency key cannot create another hold');

  q := public.sb_quote_v2('quote-b',s1,selections,1,false)->'quote';
  h2 := (public.sb_create_hold_v2('quote-b',s1,(q->>'quoteToken')::uuid,'retry-key')#>>'{hold,id}')::uuid;
  perform pg_temp.assert_true(h1<>h2 and q#>>'{items,1,priceMinor}'='5000',
    'same session and seats in another event have independent prices and hold');
  perform pg_temp.assert_true(public.sb_release_hold(h1,s1)#>'{hold,items}'=r#>'{hold,items}'
    and public.sb_release_hold(h2,s1)#>>'{hold,status}'='released', 'release preserves typed snapshots');

  update sb_hold.quotes set expires_at=clock_timestamp()-interval '1 minute' where id in (t1,t2);
  perform pg_temp.assert_true(
    public.sb_create_hold_v2('quote-a',s1,t1,'retry-key') @> jsonb_build_object(
      'replayed',true,'hold',jsonb_build_object('id',h1,'status','released'))
      and public.sb_create_hold_v2('quote-a',s1,t2,'other-key')->>'code'='quote_expired',
    'same-key replay survives TTL but unconsumed tokens expire');

  q := public.sb_quote_v2('quote-a',s1,selections,1,false)->'quote';
  t3 := (q->>'quoteToken')::uuid;
  update sb_hold.events set version=2 where id='quote-a';
  perform pg_temp.assert_true(public.sb_create_hold_v2('quote-a',s1,t3,'other-key')->>'code'='catalog_changed',
    'changed event version invalidates a quote');
  update sb_hold.events set version=1, prevent_single=true where id='quote-a';
  perform pg_temp.assert_true(public.sb_create_hold_v2('quote-a',s1,t3,'other-key')->>'code'='catalog_changed',
    'changed orphan policy invalidates a quote even if selected seats still pass');
  update sb_hold.events set prevent_single=false where id='quote-a';
  update sb_hold.ticket_types set adjustment_minor=-1999 where event_id='quote-a' and id='child';
  perform pg_temp.assert_true(public.sb_create_hold_v2('quote-a',s1,t3,'other-key')->>'code'='catalog_changed',
    'changed ticket adjustment invalidates a quote');
  update sb_hold.ticket_types set adjustment_minor=-2000 where event_id='quote-a' and id='child';
  update sb_hold.seats set price_minor=900 where event_id='quote-a' and seat_id='a';
  perform pg_temp.assert_true(public.sb_create_hold_v2('quote-a',s1,t3,'other-key')->>'code'='catalog_changed',
    'changed source price invalidates a quote even if clamped price remains zero');
  update sb_hold.seats set price_minor=1000 where event_id='quote-a' and seat_id='a';
  update sb_hold.quotes set avoid_single=true where id=t3;
  perform pg_temp.assert_true(public.sb_create_hold_v2('quote-a',s1,t3,'other-key')->>'code'='catalog_changed',
    'stored quote rule must match the original hash');

  update sb_hold.ticket_types set adjustment_minor=9007199254740991 where event_id='quote-a' and id='child';
  perform pg_temp.assert_true(public.sb_quote_v2('quote-a',s1,selections,1,false)->>'code'='invalid_price',
    'unsafe integer prices are rejected without inserting a token');
  update sb_hold.ticket_types set adjustment_minor=5000000000000000 where event_id='quote-a' and id='child';
  perform pg_temp.assert_true(public.sb_quote_v2('quote-a',s1,selections,1,false)->>'code'='invalid_price',
    'unsafe subtotal is rejected even if each price is safe');

  update sb_hold.quotes set expires_at=clock_timestamp()-interval '61 minutes' where id=t1;
  r := public.sb_quote_v2('quote-a',s2,jsonb_build_array(c),1,false);
  perform pg_temp.assert_true(r->>'ok'='true' and (
    select count(*)=2 from sb_hold.quotes where id in (t2,t3)
  ) and not exists (select 1 from sb_hold.quotes where id=t1) and exists (
    select 1 from sb_hold.holds where id=h1
  ), 'cleanup removes only tokens beyond retention and preserves their holds');
end;
$$;

do $$
declare
  rpc text;
begin
  foreach rpc in array array[
    'public.sb_create_hold(text,text,text[],bigint,text,boolean)',
    'public.sb_current_hold(text,text)', 'public.sb_get_hold(uuid,text)', 'public.sb_release_hold(uuid,text)',
    'public.sb_inventory(text,text)', 'public.sb_consume_hold_request(text,integer)',
    'public.sb_quote_v2(text,text,jsonb,bigint,boolean)', 'public.sb_create_hold_v2(text,text,uuid,text)'
  ] loop
    perform pg_temp.assert_true(
      not has_function_privilege('anon', rpc, 'execute') and not has_function_privilege('authenticated', rpc, 'execute')
        and has_function_privilege('service_role', rpc, 'execute'), 'RPC access limited to service role: ' || rpc);
  end loop;
  perform pg_temp.assert_true(
    not has_schema_privilege('service_role', 'sb_hold', 'usage')
      and not has_schema_privilege('anon', 'sb_hold', 'usage')
      and not has_schema_privilege('authenticated', 'sb_hold', 'usage')
      and not has_table_privilege('service_role', 'sb_hold.seats', 'update')
      and not has_table_privilege('service_role', 'sb_hold.quotes', 'select')
      and not has_table_privilege('anon', 'sb_hold.ticket_types', 'select'),
    'ordinary roles have no private schema or direct write grants');
  perform pg_temp.assert_true((
    select count(*) = 6 and bool_and(c.relrowsecurity)
    from pg_class as c join pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'sb_hold' and c.relkind = 'r'
  ), 'RLS is enabled on every table');
end;
$$;

set local role anon;
do $$
begin
  begin
    perform public.sb_current_hold('fixture-core', repeat('a',64));
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
    or public.sb_current_hold('fixture-core', repeat('a',64)) is distinct from '{"ok":false,"code":"not_found"}'::jsonb
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
