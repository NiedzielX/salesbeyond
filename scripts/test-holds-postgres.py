"""Run real hold/RLS/race tests in an owned ephemeral Postgres, without cloud access."""
import json,re,subprocess,time,uuid
from pathlib import Path

root=Path(__file__).resolve().parent.parent
image='postgres@sha256:ef257d85f76e48da1c64832459b59fcaba1a4dac97bf5d7450c77753542eee94'
name='sb-holds-test-'+uuid.uuid4().hex[:10]
created=None

def command(args,**kwargs):
    return subprocess.run(args,text=True,check=True,**kwargs)

def sql(text):
    return command(['docker','exec','-i',name,'psql','-X','-qAt','-U','postgres','-d','hold_test','-v','ON_ERROR_STOP=1'],input=text,capture_output=True)

try:
    created=command(['docker','run','--detach','--name',name,'--label','salesbeyond.test=true','--network','none','--read-only','--tmpfs','/var/lib/postgresql/data:rw','--tmpfs','/var/run/postgresql:rw','--tmpfs','/tmp:rw','-e','POSTGRES_PASSWORD=local-test-only','-e','POSTGRES_DB=hold_test',image],capture_output=True).stdout.strip()
    if not re.fullmatch('[0-9a-f]{64}',created):
        raise RuntimeError('Unexpected Docker container identifier')
    for _ in range(60):
        process_ready=subprocess.run(['docker','exec',name,'cat','/proc/1/comm'],capture_output=True,text=True).stdout.strip()=='postgres'
        ready=process_ready and subprocess.run(['docker','exec',name,'psql','-X','-qAt','-U','postgres','-d','hold_test','-c','select 1'],capture_output=True).returncode==0
        if ready: break
        time.sleep(.2)
    else: raise RuntimeError('Postgres did not become ready')
    sql('CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;')
    sql((root/'database/001-seat-holds.sql').read_text())
    sql('alter default privileges in schema public grant execute on functions to anon, authenticated;')
    sql((root/'database/20261120112649_own_current_hold.sql').read_text())
    print('Migrations: passed on PostgreSQL 17.6',flush=True)
    sql((root/'database/tests.sql').read_text())
    print('SQL behavior, expiry, policy and RLS fixture: passed (rolled back)',flush=True)
    seed=command(['node','--experimental-strip-types',str(root/'scripts/export-demo-inventory.mjs')],capture_output=True).stdout
    sql(seed)
    count=sql("select count(*) from sb_hold.seats where event_id='enea-demo';").stdout.strip()
    if count!='38078': raise AssertionError('Full demo inventory count mismatch: '+count)
    sql("select public.sb_create_hold('enea-demo',repeat('e',64),array(select seat_id from sb_hold.seats where event_id='enea-demo' and state='available' order by seat_id limit 2),1,'seed-proof');")
    try:
        sql(seed)
        raise AssertionError('Seed unexpectedly overwrote an existing event')
    except subprocess.CalledProcessError as error:
        if 'DEMO_CATALOG_EXISTS' not in error.stderr: raise
    preserved=sql("select count(*) from sb_hold.seats where event_id='enea-demo' and active_hold is not null;").stdout.strip()
    if preserved!='2': raise AssertionError('Repeated seed changed live hold pointers')
    print('Full 38,078-seat canonical seed: passed; duplicate seed refused, live hold preserved',flush=True)
    command(['python3',str(root/'scripts/test-holds-concurrency.py'),name,'hold_test'])
    print(json.dumps({'result':'passed','database':'local ephemeral PostgreSQL 17.6','cloudApplied':False}),flush=True)
except subprocess.CalledProcessError as error:
    if error.stderr: print(error.stderr)
    raise
finally:
    if created and re.fullmatch('[0-9a-f]{64}',created):
        subprocess.run(['docker','rm','-f',created],capture_output=True,check=False)
