-- Add an isolated synthetic event with the canonical Enea chart and its own pricebook.
-- Existing records are insert-only: rerunning this migration never rewrites either event,
-- seat state, or active hold pointers.
begin;

do $$
declare
  v_seat_count bigint;
begin
  perform 1 from sb_hold.events where id = 'enea-demo' for share;
  if not found then
    raise exception 'SOURCE_EVENT_MISSING: enea-demo';
  end if;

  select count(*) into v_seat_count from sb_hold.seats where event_id = 'enea-demo';
  if v_seat_count <> 38078 then
    raise exception 'SOURCE_CATALOG_SIZE_MISMATCH: expected 38078 seats, found %', v_seat_count;
  end if;
end;
$$;

insert into sb_hold.events (id, status, currency, version, max_seats, hold_seconds, prevent_single)
values ('enea-demo-alt', 'open', 'PLN', 1, 10, 600, false)
on conflict (id) do nothing;

insert into sb_hold.seats (
  event_id, seat_id, section_id, row, number, run_id, run_order, price_minor, state
)
select
  'enea-demo-alt', seat_id, section_id, row, number, run_id, run_order,
  (round(price_minor::numeric * 1.2 / 100)::integer * 100), state
from sb_hold.seats
where event_id = 'enea-demo'
on conflict (event_id, seat_id) do nothing;

commit;
