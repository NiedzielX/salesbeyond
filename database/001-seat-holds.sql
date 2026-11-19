-- PostgreSQL 17 migration for the synthetic demo hold service.
-- Catalog writers must lock the event first and bump its version in the same
-- transaction as changes to seats, prices, or policy.
begin;

create schema sb_hold;
revoke all on schema sb_hold from public;

create table sb_hold.events (
  id text collate "C" primary key,
  status text not null check (status in ('open', 'paused', 'closed', 'cancelled')),
  currency text not null default 'PLN' check (currency ~ '^[A-Z]{3}$'),
  version bigint not null default 1 check (version > 0),
  max_seats integer not null default 10 check (max_seats between 1 and 10),
  hold_seconds integer not null default 600 check (hold_seconds between 1 and 1800),
  prevent_single boolean not null default false
);

create table sb_hold.holds (
  id uuid primary key default gen_random_uuid(),
  event_id text collate "C" not null references sb_hold.events (id),
  session_hash text collate "C" not null check (session_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'active' check (status in ('active', 'released')),
  expires_at timestamptz not null,
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),
  subtotal_minor bigint not null check (subtotal_minor >= 0),
  version bigint not null,
  currency text not null,
  idempotency_key text collate "C" not null,
  request_hash bytea not null check (octet_length(request_hash) = 32),
  unique (session_hash, event_id, idempotency_key),
  unique (event_id, id)
);

create index holds_active_session_event_idx
  on sb_hold.holds (session_hash, event_id, expires_at) where status = 'active';

create table sb_hold.seats (
  event_id text collate "C" not null references sb_hold.events (id),
  seat_id text collate "C" not null,
  section_id text collate "C" not null,
  row integer not null check (row > 0),
  number integer not null check (number > 0),
  run_id text collate "C" not null,
  run_order integer not null check (run_order >= 0),
  price_minor integer not null check (price_minor >= 0),
  state text not null default 'available' check (state in ('available', 'blocked', 'sold', 'closed')),
  active_hold uuid,
  expires_at timestamptz,
  primary key (event_id, seat_id),
  unique (event_id, run_id, run_order),
  foreign key (event_id, active_hold) references sb_hold.holds (event_id, id),
  check ((active_hold is null) = (expires_at is null))
);

create index seats_event_section_idx on sb_hold.seats (event_id, section_id, row, number);

-- Each key is a server-side HMAC of the trusted client address. Old buckets
-- can be deleted by separate housekeeping once their minute has ended.
create table sb_hold.request_buckets (
  request_key text collate "C" not null check (request_key ~ '^[0-9a-f]{64}$'),
  bucket bigint not null,
  request_count integer not null check (request_count between 1 and 100),
  primary key (request_key, bucket)
);

create index request_buckets_bucket_idx on sb_hold.request_buckets (bucket);

alter table sb_hold.events enable row level security;
alter table sb_hold.holds enable row level security;
alter table sb_hold.seats enable row level security;
alter table sb_hold.request_buckets enable row level security;
revoke all on all tables in schema sb_hold from public;

create function sb_hold.result(p_hold sb_hold.holds, p_now timestamptz)
returns jsonb
language sql
set search_path = pg_catalog
set timezone = 'UTC'
as $$
  select jsonb_build_object('ok', true, 'hold', jsonb_build_object(
    'id', p_hold.id,
    'status', case when p_hold.status = 'active' and p_hold.expires_at <= p_now
      then 'expired' else p_hold.status end,
    'expiresAt', p_hold.expires_at,
    'eventId', p_hold.event_id,
    'version', p_hold.version,
    'currency', p_hold.currency,
    'subtotalMinor', p_hold.subtotal_minor,
    'items', p_hold.items
  ));
$$;
revoke all on function sb_hold.result(sb_hold.holds, timestamptz) from public;

create function public.sb_create_hold(
  p_event_id text, p_session_hash text, p_seat_ids text[], p_expected_version bigint,
  p_idempotency_key text, p_avoid_single boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_event sb_hold.events%rowtype;
  v_hold sb_hold.holds%rowtype;
  v_seat_ids text[];
  v_run_ids text[];
  v_failed_ids text[];
  v_request_hash bytea;
  v_items jsonb;
  v_subtotal bigint;
  v_now timestamptz;
begin
  if p_event_id is null or p_event_id !~ '^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,127}$'
    or p_session_hash is null or p_session_hash !~ '^[0-9a-f]{64}$'
    or p_expected_version is null or p_expected_version < 1
    or p_idempotency_key is null or p_idempotency_key !~ '^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,127}$'
    or p_avoid_single is null
    or array_ndims(p_seat_ids) is distinct from 1
    or cardinality(p_seat_ids) not between 1 and 100
  then
    return jsonb_build_object('ok', false, 'code', 'invalid_request');
  end if;

  if exists (
    select 1 from unnest(p_seat_ids) as ids(seat_id)
    where seat_id is null or seat_id !~ '^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,127}$'
  ) then
    return jsonb_build_object('ok', false, 'code', 'invalid_request');
  end if;

  select array_agg(distinct seat_id collate "C" order by seat_id collate "C")
    into v_seat_ids
    from unnest(p_seat_ids) as ids(seat_id);
  if cardinality(v_seat_ids) <> cardinality(p_seat_ids) then
    return jsonb_build_object('ok', false, 'code', 'invalid_request');
  end if;

  v_request_hash := sha256(convert_to(
    jsonb_build_array(p_event_id, p_expected_version, p_avoid_single, v_seat_ids)::text, 'UTF8'
  ));

  -- Serialize the whole session/event pair for both idempotency and the live hold limit.
  perform pg_advisory_xact_lock(hashtextextended(
    'sb_hold:' || jsonb_build_array(p_session_hash, p_event_id)::text, 0
  ));

  select * into v_hold from sb_hold.holds
    where event_id = p_event_id and session_hash = p_session_hash and idempotency_key = p_idempotency_key;
  if found then
    if v_hold.request_hash <> v_request_hash then
      return jsonb_build_object('ok', false, 'code', 'idempotency_key_reused');
    end if;
    return sb_hold.result(v_hold, clock_timestamp()) || jsonb_build_object('replayed', true);
  end if;

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
  if cardinality(v_seat_ids) > v_event.max_seats then
    return jsonb_build_object('ok', false, 'code', 'seat_limit');
  end if;

  select * into v_hold from sb_hold.holds
    where event_id = p_event_id and session_hash = p_session_hash
      and status = 'active' and expires_at > clock_timestamp()
    limit 1;
  if found then
    return jsonb_build_object('ok', false, 'code', 'active_hold_exists', 'holdId', v_hold.id);
  end if;

  v_run_ids := array[]::text[];
  if v_event.prevent_single or p_avoid_single then
    select array(select distinct run_id from sb_hold.seats
      where event_id = p_event_id and seat_id = any (v_seat_ids))
      into v_run_ids;
  end if;

  -- Create and release lock seats in the same global order. Expired pointers
  -- are overwritten only after validation, without locking their old holds.
  perform seat_id from sb_hold.seats
    where event_id = p_event_id and (seat_id = any (v_seat_ids) or run_id = any (v_run_ids))
    order by seat_id for update;
  v_now := clock_timestamp();

  select array_agg(ids.seat_id order by ids.seat_id collate "C") into v_failed_ids
    from unnest(v_seat_ids) as ids(seat_id)
    left join sb_hold.seats as s on s.event_id = p_event_id and s.seat_id = ids.seat_id
    where s.seat_id is null or s.state <> 'available';
  if v_failed_ids is not null then
    return jsonb_build_object('ok', false, 'code', 'unavailable', 'seatIds', v_failed_ids);
  end if;

  select array_agg(seat_id order by seat_id) into v_failed_ids from sb_hold.seats
    where event_id = p_event_id and seat_id = any (v_seat_ids) and expires_at > v_now;
  if v_failed_ids is not null then
    return jsonb_build_object('ok', false, 'code', 'held', 'seatIds', v_failed_ids);
  end if;

  if cardinality(v_run_ids) > 0 then
    with availability as (
      select seat_id, run_id, run_order::bigint as position,
        state = 'available' and (expires_at is null or expires_at <= v_now) as free_before,
        seat_id <> all (v_seat_ids) as remaining
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

  select jsonb_agg(jsonb_build_object('seatId', seat_id, 'priceMinor', price_minor) order by seat_id),
    sum(price_minor)
    into v_items, v_subtotal from sb_hold.seats
    where event_id = p_event_id and seat_id = any (v_seat_ids);

  insert into sb_hold.holds
    (event_id, session_hash, expires_at, items, subtotal_minor, version, currency, idempotency_key, request_hash)
    values (p_event_id, p_session_hash, v_now + make_interval(secs => v_event.hold_seconds),
      v_items, v_subtotal, v_event.version, v_event.currency, p_idempotency_key, v_request_hash)
    returning * into v_hold;

  update sb_hold.seats set active_hold = v_hold.id, expires_at = v_hold.expires_at
    where event_id = p_event_id and seat_id = any (v_seat_ids);

  return sb_hold.result(v_hold, v_now);
end;
$$;

create function public.sb_get_hold(p_hold_id uuid, p_session_hash text)
returns jsonb
language sql
security definer
set search_path = pg_catalog
as $$
  select coalesce((
    select sb_hold.result(h, clock_timestamp()) from sb_hold.holds as h
      where h.id = p_hold_id and h.session_hash = p_session_hash
  ), jsonb_build_object('ok', false, 'code', 'not_found'));
$$;

create function public.sb_release_hold(p_hold_id uuid, p_session_hash text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_hold sb_hold.holds%rowtype;
  v_seat_ids text[];
  v_now timestamptz;
begin
  select * into v_hold from sb_hold.holds where id = p_hold_id and session_hash = p_session_hash;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;
  if v_hold.status = 'released' then
    return sb_hold.result(v_hold, clock_timestamp());
  end if;

  select array_agg(item->>'seatId') into v_seat_ids from jsonb_array_elements(v_hold.items) as items(item);
  perform seat_id from sb_hold.seats
    where event_id = v_hold.event_id and seat_id = any (v_seat_ids)
    order by seat_id for update;
  select * into v_hold from sb_hold.holds
    where id = p_hold_id and session_hash = p_session_hash
    for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  v_now := clock_timestamp();
  if v_hold.status = 'active' then
    if v_hold.expires_at > v_now then
      update sb_hold.holds set status = 'released' where id = p_hold_id returning * into v_hold;
    end if;
    update sb_hold.seats set active_hold = null, expires_at = null
      where event_id = v_hold.event_id and seat_id = any (v_seat_ids) and active_hold = p_hold_id;
  end if;
  return sb_hold.result(v_hold, v_now);
end;
$$;

create function public.sb_inventory(p_event_id text, p_section_id text default null)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select coalesce((
    select jsonb_build_object(
      'ok', true, 'eventId', e.id, 'status', e.status, 'version', e.version,
      'currency', e.currency, 'maxSeats', e.max_seats, 'holdSeconds', e.hold_seconds,
      'preventSingle', e.prevent_single
    ) || case when p_section_id is null then jsonb_build_object('sections', coalesce((
      select jsonb_agg(jsonb_build_object(
        'sectionId', section_id, 'total', total, 'available', available, 'minPriceMinor', min_price
      ) order by section_id)
      from (
        select s.section_id, count(*) as total, count(*) filter (where availability.free) as available,
          min(s.price_minor) filter (where availability.free) as min_price
        from sb_hold.seats as s
        cross join lateral (values (
          s.state = 'available' and (s.expires_at is null or s.expires_at <= statement_timestamp())
        )) as availability(free)
        where s.event_id = e.id
        group by s.section_id
      ) as sections
    ), '[]'::jsonb))
    else jsonb_build_object('seats', coalesce((
      select jsonb_agg(jsonb_build_object(
        'seatId', s.seat_id, 'sectionId', s.section_id, 'row', s.row,
        'number', s.number, 'runId', s.run_id, 'runOrder', s.run_order,
        'priceMinor', s.price_minor,
        'status', case when s.state = 'available' and s.expires_at > statement_timestamp()
          then 'held' else s.state end
      ) order by s.row, s.number, s.seat_id)
      from sb_hold.seats as s where s.event_id = e.id and s.section_id = p_section_id
    ), '[]'::jsonb)) end
    from sb_hold.events as e where e.id = p_event_id
  ), jsonb_build_object('ok', false, 'code', 'not_found'));
$$;

create function public.sb_consume_hold_request(p_key text, p_limit integer default 20)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_bucket bigint;
  v_allowed boolean;
begin
  if p_key is null or p_key !~ '^[0-9a-f]{64}$'
    or p_limit is null or p_limit not between 1 and 100
  then
    return jsonb_build_object('ok', false, 'code', 'invalid_request');
  end if;

  v_bucket := floor(extract(epoch from clock_timestamp()) / 60)::bigint;
  insert into sb_hold.request_buckets as b (request_key, bucket, request_count)
    values (p_key, v_bucket, 1)
    on conflict (request_key, bucket) do update set request_count = b.request_count + 1
      where b.request_count < p_limit
    returning true into v_allowed;

  return jsonb_build_object('ok', true, 'allowed', coalesce(v_allowed, false));
end;
$$;

revoke all on function
  public.sb_create_hold(text, text, text[], bigint, text, boolean),
  public.sb_get_hold(uuid, text),
  public.sb_release_hold(uuid, text),
  public.sb_inventory(text, text),
  public.sb_consume_hold_request(text, integer)
from public;

-- Explicitly remove default grants some Supabase projects give to public-schema functions.
do $$
declare
  v_role text;
  v_rpcs constant text := 'public.sb_create_hold(text,text,text[],bigint,text,boolean), '
    'public.sb_get_hold(uuid,text), public.sb_release_hold(uuid,text), public.sb_inventory(text,text), '
    'public.sb_consume_hold_request(text,integer)';
begin
  foreach v_role in array array['anon', 'authenticated', 'service_role'] loop
    if exists (select 1 from pg_roles where rolname = v_role) then
      execute format('revoke all on schema sb_hold from %I', v_role);
      execute format('revoke all on all tables in schema sb_hold from %I', v_role);
      execute format('revoke all on all functions in schema sb_hold from %I', v_role);
      execute format('revoke all on function %s from %I', v_rpcs, v_role);
    end if;
  end loop;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function ' || v_rpcs || ' to service_role';
  end if;
end;
$$;

commit;
