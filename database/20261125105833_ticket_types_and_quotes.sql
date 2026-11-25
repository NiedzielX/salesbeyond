-- Add separate v2 quote and create RPCs. Catalog writers lock the event first
-- and bump its version in the same transaction as changes to prices or policy.
begin;

alter table sb_hold.events add column if not exists min_seats integer not null default 1
  check (min_seats between 1 and max_seats);

create table if not exists sb_hold.ticket_types (
  event_id text collate "C" not null references sb_hold.events (id),
  id text collate "C" not null check (id ~ '^[A-Za-z0-9_-]{1,128}$'),
  label text not null,
  sort_order integer not null check (sort_order >= 0),
  adjustment_minor bigint not null check (adjustment_minor between -9007199254740991 and 9007199254740991),
  primary key (event_id, id)
);

create table if not exists sb_hold.quotes (
  id uuid primary key default gen_random_uuid(),
  event_id text collate "C" not null references sb_hold.events (id),
  session_hash text collate "C" not null check (session_hash ~ '^[0-9a-f]{64}$'),
  version bigint not null check (version between 1 and 9007199254740991),
  expires_at timestamptz not null,
  request_hash bytea not null check (octet_length(request_hash) = 32),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 10),
  subtotal_minor bigint not null check (subtotal_minor between 0 and 9007199254740991),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  avoid_single boolean not null,
  consumed_hold_id uuid unique,
  consumed_idempotency_key text collate "C",
  foreign key (event_id, consumed_hold_id) references sb_hold.holds (event_id, id),
  check ((consumed_hold_id is null) = (consumed_idempotency_key is null))
);

create index if not exists quotes_expires_at_idx on sb_hold.quotes (expires_at);
alter table sb_hold.ticket_types enable row level security;
alter table sb_hold.quotes enable row level security;
revoke all on sb_hold.ticket_types, sb_hold.quotes from public, anon, authenticated, service_role;

-- Lock both catalog rows before changing the policy and pricebook. Bump the
-- version once per affected event, even when both kinds of data changed.
do $$
begin
  perform id from sb_hold.events where id in ('enea-demo', 'enea-demo-alt') order by id for update;
  if not exists (select 1 from sb_hold.events where id = 'enea-demo')
    or not exists (select 1 from sb_hold.events where id = 'enea-demo-alt')
  then
    raise exception 'DEMO_EVENTS_MISSING';
  end if;
end;
$$;

with pricebook(event_id, id, label, sort_order, adjustment_minor) as (
  values
    ('enea-demo', 'standard', 'Normalny', 0, 0),
    ('enea-demo', 'reduced', 'Ulgowy', 1, -1000),
    ('enea-demo', 'child', 'Dziecko', 2, -2000),
    ('enea-demo-alt', 'standard', 'Normalny', 0, 0),
    ('enea-demo-alt', 'reduced', 'Ulgowy', 1, -1500),
    ('enea-demo-alt', 'child', 'Dziecko', 2, -3000)
), changed_types as (
  insert into sb_hold.ticket_types as t (event_id, id, label, sort_order, adjustment_minor)
    select event_id, id, label, sort_order, adjustment_minor from pricebook
  on conflict (event_id, id) do update
    set label = excluded.label, sort_order = excluded.sort_order, adjustment_minor = excluded.adjustment_minor
    where (t.label, t.sort_order, t.adjustment_minor)
      is distinct from (excluded.label, excluded.sort_order, excluded.adjustment_minor)
  returning event_id
)
update sb_hold.events as e
set min_seats = policy.min_seats, max_seats = policy.max_seats, version = e.version + 1
from (values ('enea-demo', 1, 10), ('enea-demo-alt', 2, 6)) as policy(id, min_seats, max_seats)
where e.id = policy.id and (
  (e.min_seats, e.max_seats) is distinct from (policy.min_seats, policy.max_seats)
  or exists (select 1 from changed_types where event_id = e.id)
);

create or replace function sb_hold.quote_policy(p_event sb_hold.events, p_count integer)
returns jsonb
language sql
set search_path = pg_catalog
as $$
  select case when p_count < p_event.min_seats then
    jsonb_build_object('ok', false, 'code', 'below_minimum', 'minSeats', p_event.min_seats)
  when p_count > p_event.max_seats then
    jsonb_build_object('ok', false, 'code', 'seat_limit', 'maxSeats', p_event.max_seats)
  end;
$$;

-- Both v2 operations lock seats in the same order used by v1 create/release.
create or replace function sb_hold.lock_quote_seats(
  p_event_id text, p_seat_ids text[], p_prevent_single boolean
)
returns jsonb
language plpgsql
set search_path = pg_catalog
as $$
declare
  v_run_ids text[] := array[]::text[];
  v_failed_ids text[];
  v_now timestamptz;
begin
  if p_prevent_single then
    select array(select distinct run_id from sb_hold.seats
      where event_id = p_event_id and seat_id = any (p_seat_ids))
      into v_run_ids;
  end if;

  perform seat_id from sb_hold.seats
    where event_id = p_event_id and (seat_id = any (p_seat_ids) or run_id = any (v_run_ids))
    order by seat_id for update;
  v_now := clock_timestamp();

  select array_agg(ids.seat_id order by ids.seat_id collate "C") into v_failed_ids
    from unnest(p_seat_ids) as ids(seat_id)
    left join sb_hold.seats as s on s.event_id = p_event_id and s.seat_id = ids.seat_id
    where s.seat_id is null or s.state <> 'available';
  if v_failed_ids is not null then
    return jsonb_build_object('ok', false, 'code', 'unavailable', 'seatIds', v_failed_ids);
  end if;

  select array_agg(seat_id order by seat_id) into v_failed_ids from sb_hold.seats
    where event_id = p_event_id and seat_id = any (p_seat_ids) and expires_at > v_now;
  if v_failed_ids is not null then
    return jsonb_build_object('ok', false, 'code', 'held', 'seatIds', v_failed_ids);
  end if;

  if cardinality(v_run_ids) > 0 then
    with availability as (
      select seat_id, run_id, run_order::bigint as position,
        state = 'available' and (expires_at is null or expires_at <= v_now) as free_before,
        seat_id <> all (p_seat_ids) as remaining
      from sb_hold.seats where event_id = p_event_id and run_id = any (v_run_ids)
    ), adjacency as (
      select seat_id, position, free_before and remaining as free_after,
        lag(case when free_before then position end) over physical_run as previous_before,
        lead(case when free_before then position end) over physical_run as next_before,
        lag(case when free_before and remaining then position end) over physical_run as previous_after,
        lead(case when free_before and remaining then position end) over physical_run as next_after
      from availability
      window physical_run as (partition by run_id order by position)
    )
    select array_agg(seat_id order by seat_id) into v_failed_ids from adjacency
      where free_after
        and (previous_before = position - 1 or next_before = position + 1)
        and previous_after is distinct from position - 1
        and next_after is distinct from position + 1;
    if v_failed_ids is not null then
      return jsonb_build_object('ok', false, 'code', 'single_seat_gap', 'seatIds', v_failed_ids);
    end if;
  end if;
  return null;
end;
$$;

-- Called with the event and seats already locked. Include the configured
-- policy and source prices so a change masked by zero-clamping still invalidates the quote.
create or replace function sb_hold.quote_snapshot(
  p_event sb_hold.events, p_session_hash text, p_items jsonb, p_avoid_single boolean
)
returns table(items jsonb, subtotal_minor numeric, request_hash bytea)
language plpgsql
set search_path = pg_catalog
as $$
begin
  perform t.id from sb_hold.ticket_types as t
    where t.event_id = p_event.id and t.id in (
      select value->>'ticketTypeId' from jsonb_array_elements(p_items)
    )
    order by t.id for share;

  return query
    with selected as (
      select s.seat_id, s.price_minor as base_price, t.id as type_id, t.label, t.sort_order, t.adjustment_minor,
        greatest(0, s.price_minor::numeric + t.adjustment_minor) as price_minor
      from jsonb_to_recordset(p_items) as choices("seatId" text, "ticketTypeId" text)
      join sb_hold.seats as s on s.event_id = p_event.id and s.seat_id = choices."seatId"
      join sb_hold.ticket_types as t on t.event_id = p_event.id and t.id = choices."ticketTypeId"
    )
    select jsonb_agg(jsonb_build_object('seatId', seat_id, 'ticketTypeId', type_id, 'priceMinor', price_minor)
      order by seat_id), sum(price_minor),
      sha256(convert_to(jsonb_build_array(
        p_event.id, p_session_hash, p_event.version, p_event.currency, p_event.min_seats,
        p_event.max_seats, p_event.prevent_single, p_avoid_single,
        jsonb_agg(jsonb_build_array(seat_id, type_id, base_price, label, sort_order, adjustment_minor) order by seat_id)
      )::text, 'UTF8'))
    from selected
    having count(*) = jsonb_array_length(p_items);
end;
$$;

revoke all on function sb_hold.quote_policy(sb_hold.events,integer),
  sb_hold.lock_quote_seats(text,text[],boolean),
  sb_hold.quote_snapshot(sb_hold.events,text,jsonb,boolean)
from public, anon, authenticated, service_role;

create or replace function public.sb_quote_v2(
  p_event_id text, p_session_hash text, p_items jsonb, p_expected_version bigint, p_avoid_single boolean
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
set timezone = 'UTC'
as $$
declare
  v_event sb_hold.events%rowtype;
  v_quote sb_hold.quotes%rowtype;
  v_seat_ids text[];
  v_error jsonb;
  v_snapshot record;
  v_cleanup_before timestamptz;
begin
  if p_event_id is null or p_event_id !~ '^[A-Za-z0-9_-]{1,80}$'
    or p_session_hash is null or p_session_hash !~ '^[0-9a-f]{64}$'
    or p_expected_version is null or p_expected_version not between 1 and 9007199254740991
    or p_avoid_single is null or jsonb_typeof(p_items) is distinct from 'array'
  then
    return jsonb_build_object('ok', false, 'code', 'invalid_request');
  end if;
  if jsonb_array_length(p_items) not between 1 and 100 or exists (
    select 1 from jsonb_array_elements(p_items) as item
    where jsonb_typeof(item) <> 'object'
      or jsonb_typeof(item->'seatId') is distinct from 'string'
      or item->>'seatId' !~ '^[A-Za-z0-9_-]{1,128}$'
      or jsonb_typeof(item->'ticketTypeId') is distinct from 'string'
      or item->>'ticketTypeId' !~ '^[A-Za-z0-9_-]{1,128}$'
  ) then
    return jsonb_build_object('ok', false, 'code', 'invalid_request');
  end if;
  select array_agg(distinct seat_id order by seat_id) into v_seat_ids
    from (select (value->>'seatId') collate "C" as seat_id from jsonb_array_elements(p_items)) as selected;
  if cardinality(v_seat_ids) <> jsonb_array_length(p_items) then
    return jsonb_build_object('ok', false, 'code', 'invalid_request');
  end if;

  -- Reap old tokens without waiting for a concurrent consumer or another cleanup.
  v_cleanup_before := clock_timestamp() - interval '1 hour';
  delete from sb_hold.quotes as q using (
    select id from sb_hold.quotes where expires_at < v_cleanup_before
    for update skip locked
  ) as expired where q.id = expired.id;

  select * into v_event from sb_hold.events where id = p_event_id for share;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;
  if v_event.status <> 'open' then
    return jsonb_build_object('ok', false, 'code', 'event_closed');
  end if;
  if v_event.version <> p_expected_version then
    return jsonb_build_object('ok', false, 'code', 'catalog_changed');
  end if;
  v_error := sb_hold.quote_policy(v_event, cardinality(v_seat_ids));
  if v_error is not null then
    return v_error;
  end if;
  v_error := sb_hold.lock_quote_seats(p_event_id, v_seat_ids, v_event.prevent_single or p_avoid_single);
  if v_error is not null then
    return v_error;
  end if;
  select * into v_snapshot from sb_hold.quote_snapshot(v_event, p_session_hash, p_items, p_avoid_single);
  if not found then
    return jsonb_build_object('ok', false, 'code', 'invalid_ticket_type');
  end if;
  -- Nonnegative items cannot exceed the safe integer range when their sum fits.
  if v_snapshot.subtotal_minor > 9007199254740991 then
    return jsonb_build_object('ok', false, 'code', 'invalid_price');
  end if;

  insert into sb_hold.quotes
    (event_id, session_hash, version, expires_at, request_hash, items, subtotal_minor, currency, avoid_single)
    values (p_event_id, p_session_hash, v_event.version, clock_timestamp() + interval '120 seconds',
      v_snapshot.request_hash, v_snapshot.items, v_snapshot.subtotal_minor, v_event.currency, p_avoid_single)
    returning * into v_quote;

  return jsonb_build_object('ok', true, 'quote', jsonb_build_object(
    'quoteToken', v_quote.id, 'eventId', v_quote.event_id, 'version', v_quote.version,
    'expiresAt', v_quote.expires_at, 'items', v_quote.items,
    'subtotalMinor', v_quote.subtotal_minor, 'currency', v_quote.currency
  ));
end;
$$;

create or replace function public.sb_create_hold_v2(
  p_event_id text, p_session_hash text, p_quote_token uuid, p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_event sb_hold.events%rowtype;
  v_quote sb_hold.quotes%rowtype;
  v_hold sb_hold.holds%rowtype;
  v_seat_ids text[];
  v_error jsonb;
  v_snapshot record;
  v_now timestamptz;
  v_request_hash bytea;
begin
  if p_event_id is null or p_event_id !~ '^[A-Za-z0-9_-]{1,80}$'
    or p_session_hash is null or p_session_hash !~ '^[0-9a-f]{64}$'
    or p_quote_token is null or p_idempotency_key is null or p_idempotency_key !~ '^[A-Za-z0-9_-]{8,128}$'
  then
    return jsonb_build_object('ok', false, 'code', 'invalid_request');
  end if;

  select * into v_quote from sb_hold.quotes
    where id = p_quote_token and event_id = p_event_id and session_hash = p_session_hash for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;
  if v_quote.consumed_hold_id is not null then
    if v_quote.consumed_idempotency_key <> p_idempotency_key then
      return jsonb_build_object('ok', false, 'code', 'quote_consumed');
    end if;
    select * into strict v_hold from sb_hold.holds where id = v_quote.consumed_hold_id;
    return sb_hold.result(v_hold, clock_timestamp()) || jsonb_build_object('replayed', true);
  end if;
  if v_quote.expires_at <= clock_timestamp() then
    return jsonb_build_object('ok', false, 'code', 'quote_expired');
  end if;

  -- Coordinate the active-hold limit and idempotency key with v1 and other tokens.
  perform pg_advisory_xact_lock(hashtextextended(
    'sb_hold:' || jsonb_build_array(p_session_hash, p_event_id)::text, 0
  ));
  if exists (select 1 from sb_hold.holds
    where event_id = p_event_id and session_hash = p_session_hash and idempotency_key = p_idempotency_key)
  then
    return jsonb_build_object('ok', false, 'code', 'idempotency_key_reused');
  end if;

  select * into strict v_event from sb_hold.events where id = p_event_id for share;
  if v_event.status <> 'open' then
    return jsonb_build_object('ok', false, 'code', 'event_closed');
  end if;
  if (v_event.version, v_event.currency) is distinct from (v_quote.version, v_quote.currency) then
    return jsonb_build_object('ok', false, 'code', 'catalog_changed');
  end if;
  select array_agg(value->>'seatId') into v_seat_ids from jsonb_array_elements(v_quote.items);
  v_error := sb_hold.quote_policy(v_event, cardinality(v_seat_ids));
  if v_error is not null then
    return v_error;
  end if;

  select * into v_hold from sb_hold.holds where event_id = p_event_id and session_hash = p_session_hash
    and status = 'active' and expires_at > clock_timestamp()
    limit 1;
  if found then
    return jsonb_build_object('ok', false, 'code', 'active_hold_exists', 'holdId', v_hold.id);
  end if;

  v_error := sb_hold.lock_quote_seats(p_event_id, v_seat_ids, v_event.prevent_single or v_quote.avoid_single);
  if v_error is not null then
    return v_error;
  end if;
  select * into v_snapshot from sb_hold.quote_snapshot(v_event, p_session_hash, v_quote.items, v_quote.avoid_single);
  if not found or (v_snapshot.request_hash, v_snapshot.items, v_snapshot.subtotal_minor)
    is distinct from (v_quote.request_hash, v_quote.items, v_quote.subtotal_minor::numeric)
  then
    return jsonb_build_object('ok', false, 'code', 'catalog_changed');
  end if;

  v_now := clock_timestamp();
  if v_quote.expires_at <= v_now then
    return jsonb_build_object('ok', false, 'code', 'quote_expired');
  end if;

  v_request_hash := sha256(convert_to(jsonb_build_array(p_quote_token, encode(v_quote.request_hash, 'hex'))::text, 'UTF8'));
  insert into sb_hold.holds
    (event_id, session_hash, expires_at, items, subtotal_minor, version, currency, idempotency_key, request_hash)
    values (p_event_id, p_session_hash, v_now + make_interval(secs => v_event.hold_seconds),
      v_quote.items, v_quote.subtotal_minor, v_quote.version, v_quote.currency, p_idempotency_key, v_request_hash)
    returning * into v_hold;

  update sb_hold.seats set active_hold = v_hold.id, expires_at = v_hold.expires_at
    where event_id = p_event_id and seat_id = any (v_seat_ids);
  update sb_hold.quotes set consumed_hold_id = v_hold.id, consumed_idempotency_key = p_idempotency_key
    where id = v_quote.id;

  return sb_hold.result(v_hold, v_now);
end;
$$;

revoke all on function public.sb_quote_v2(text,text,jsonb,bigint,boolean),
  public.sb_create_hold_v2(text,text,uuid,text) from public, anon, authenticated, service_role;
grant execute on function public.sb_quote_v2(text,text,jsonb,bigint,boolean),
  public.sb_create_hold_v2(text,text,uuid,text) to service_role;

commit;
