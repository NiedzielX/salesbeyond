import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHoldRuntime} from './holdRuntime.ts';
const origin='https://salesbeyond.vercel.app';
const env={SEAT_HOLDS_ENABLED:'1',APP_ORIGIN:origin,SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'fake-server-only',HOLD_RATE_LIMIT_SECRET:'z'.repeat(32)};
test('publiczny status ujawnia konfigurację wyłącznie jako boolean, bez danych środowiska',async()=>{
 const runtime=createHoldRuntime({}),response=await runtime(new Request(origin+'/api/seat-api?op=status'));
 assert.deepEqual(await response.json(),{ok:true,configured:false,mode:'demo'});
 assert.equal((await runtime(new Request(origin+'/api/seat-api?op=inventory&eventId=enea-demo'))).status,503);
});
test('bramka Vercel przekazuje body, sesję i origin bez tworzenia dodatkowej sesji',async()=>{
 const seen:string[]=[];
 const runtime=createHoldRuntime(env,(async(url,_init)=>{seen.push(String(url));const name=String(url).split('/').at(-1);return Response.json(name==='sb_consume_hold_request'?{ok:true,allowed:true}:{ok:false,code:'held',seatIds:['101-6-1']});}) as typeof fetch);
 const request=new Request(origin+'/api/seat-api?op=create&eventId=enea-demo',{method:'POST',headers:{Origin:origin,Cookie:'__Host-salesbeyond_fan='+'a'.repeat(64),'Content-Type':'application/json','X-Forwarded-For':'192.0.2.10'},body:JSON.stringify({seatIds:['101-6-1'],expectedCatalogVersion:1,idempotencyKey:'runtime-retry-01'})});
 const response=await runtime(request);assert.equal(response.status,409);assert.equal((await response.json()).error.code,'held');assert.equal(seen.length,2);assert.ok(seen[1].endsWith('/sb_create_hold'));
});
test('brak sekretu limitera lub zła konfiguracja pozostają zamknięte, bez wywołania RPC',async()=>{
 const noRate={...env,HOLD_RATE_LIMIT_SECRET:''};const runtime=createHoldRuntime(noRate,async()=>{throw new Error('should not call')});
 assert.equal((await runtime(new Request(origin+'/api/seat-api?op=session'))).status,503);
 const off=createHoldRuntime({...env,SEAT_HOLDS_ENABLED:'0'});assert.equal((await off(new Request(origin+'/api/seat-api?op=session'))).status,503);
 const badOrigin=createHoldRuntime({...env,APP_ORIGIN:'not-a-url'});assert.equal((await badOrigin(new Request(origin+'/api/seat-api?op=session'))).status,503);
 const invalid=createHoldRuntime({...env,SUPABASE_URL:'http://untrusted.test'});assert.equal((await invalid(new Request(origin+'/api/seat-api?op=session'))).status,503);
});
