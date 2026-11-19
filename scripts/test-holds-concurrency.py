import concurrent.futures
from decimal import Decimal
import json
import subprocess
import time

from sys import argv

if len(argv) != 3 or not argv[1].startswith("sb-holds-test-"):
    raise SystemExit("Usage: test-holds-concurrency.py sb-holds-test-CONTAINER DATABASE")
container, database = argv[1:]

psql = ["docker", "exec", "-i", container, "psql", "-X",
        "-qAt", "-U", "postgres", "-d", database, "-v", "ON_ERROR_STOP=1"]


def query(statement):
    return subprocess.run(psql, text=True, input=statement, check=True,
                          capture_output=True, timeout=10).stdout.strip()


query("""
  insert into sb_hold.events (id,status,prevent_single) values
    ('race-direct','open',false),('race-orphan','open',true),('race-session','open',false);
  insert into sb_hold.seats (event_id,seat_id,section_id,row,number,run_id,run_order,price_minor)
    select id, seat, 'test', 1, pos, 'row-1', pos, 6500
    from sb_hold.events cross join (values ('a',1),('b',2),('c',3)) as n(seat,pos)
    where id in ('race-direct','race-orphan','race-session');
""")


def wait_until(application, expected):
    deadline = time.monotonic() + 2.5
    while time.monotonic() < deadline:
        actual = query(f"""select wait_event_type || '/' || wait_event
          from pg_stat_activity where application_name = '{application}';""")
        if actual == expected:
            return
        time.sleep(0.03)
    raise AssertionError(f"{application} waiting on {actual}, expected {expected}")


def race(event, second_seat, second_session, second_key, wait_event, second_code):
    def request(client, session, seat, key, duration=0):
        return f"""
          set application_name = 'sb-race-{client}';
          set role service_role;
          begin;
          select public.sb_create_hold('{event}', repeat('{session}',64),array['{seat}'],1,'{key}');
          {f'SELECT pg_sleep({duration});' if duration else ''}
          commit;"""

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        first = pool.submit(query, request('a', 'a', 'a', 'same', 3.0))
        wait_until('sb-race-a', 'Timeout/PgSleep')
        second = pool.submit(query, request('b', second_session, second_seat, second_key))
        wait_until('sb-race-b', wait_event)
        first_result = json.loads(first.result())
        second_result = json.loads(second.result())

    assert first_result["ok"], first_result
    if second_code == "same_hold":
        assert second_result["ok"] and first_result["hold"]["id"] == second_result["hold"]["id"], second_result
    else:
        assert not second_result["ok"] and second_result["code"] == second_code, second_result
    assert query(f"select count(*) from sb_hold.holds where event_id = '{event}';") == "1"
    print(f"{event} {wait_event} -> first active, second {second_code}; one hold row")


race('race-direct', 'a', 'b', 'other', 'Lock/transactionid', 'held')
race('race-orphan', 'c', 'b', 'other', 'Lock/transactionid', 'single_seat_gap')
race('race-session', 'c', 'a', 'other', 'Lock/advisory', 'active_hold_exists')
race('race-session', 'a', 'a', 'same', 'Lock/advisory', 'same_hold')

key = 'f' * 64
seconds_into_minute = Decimal(query("select extract(epoch from clock_timestamp()) % 60;"))
if seconds_into_minute > 55:
    time.sleep(61 - float(seconds_into_minute))

def consume(_):
    return query(f"set role service_role; select public.sb_consume_hold_request('{key}', 3)->>'allowed';")

with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    decisions = list(pool.map(consume, range(8)))
assert decisions.count('true') == 3 and decisions.count('false') == 5, decisions
assert query(f"select request_count from sb_hold.request_buckets where request_key = '{key}';") == '3'
print('rate 8 concurrent requests -> 3 allowed, 5 denied; persisted count = 3')


query("""
insert into sb_hold.events(id,status,hold_seconds) values ('race-expiry','open',1);
insert into sb_hold.seats(event_id,seat_id,section_id,row,number,run_id,run_order,price_minor)
values ('race-expiry','a','test',1,1,'row',0,6500);
""")
old=json.loads(query("set role service_role; select public.sb_create_hold('race-expiry',repeat('c',64),array['a'],1,'expiry-old');"))["hold"]["id"]
time.sleep(1.1)
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
    blocker=pool.submit(query,f"set application_name='sb-expired-lock'; begin; select id from sb_hold.holds where id='{old}' for update; select pg_sleep(3); commit;")
    wait_until('sb-expired-lock','Timeout/PgSleep')
    replacement=json.loads(query("set role service_role; select public.sb_create_hold('race-expiry',repeat('d',64),array['a'],1,'expiry-new');"))
    assert replacement["ok"],replacement
    assert query("select wait_event_type || '/' || wait_event from pg_stat_activity where application_name='sb-expired-lock';")=='Timeout/PgSleep'
    blocker.result()
new=replacement["hold"]["id"]
query(f"set role service_role; select public.sb_release_hold('{old}',repeat('c',64));")
assert query("select active_hold from sb_hold.seats where event_id='race-expiry' and seat_id='a';")==new
print('expiry replacement succeeded while old hold was locked; stale release preserved newer pointer')
