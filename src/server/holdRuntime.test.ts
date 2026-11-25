import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sessionHash} from './holdApi.ts';
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
test('gateway forwards current as a cookie-bound event lookup to Supabase',async()=>{
 const seen:{url:string;init?:RequestInit}[]=[];
 const runtime=createHoldRuntime(env,async(url,init)=>{
  seen.push({url:String(url),init});
  return Response.json({ok:false,code:'not_found'});
 });
 const path=origin+'/api/seat-api?op=current&eventId=enea-demo';
 const missingSession=await runtime(new Request(path));
 assert.equal(missingSession.status,200);
 assert.deepEqual(await missingSession.json(),{ok:true,hold:null});
 assert.equal(missingSession.headers.get('set-cookie'),null);
 const secret='d'.repeat(64);
 const headers={Cookie:'__Host-salesbeyond_fan='+secret};
 const missingEvent=await runtime(new Request(origin+'/api/seat-api?op=current',{headers}));
 assert.equal(missingEvent.status,404);
 assert.equal(seen.length,0);
 const missingHold=await runtime(new Request(path,{headers}));
 assert.equal(missingHold.status,200);
 assert.deepEqual(await missingHold.json(),{ok:true,hold:null});
 assert.equal(seen.length,1);
 assert.equal(seen[0].url,'https://test.supabase.co/rest/v1/rpc/sb_current_hold');
 assert.equal(seen[0].init?.method,'POST');
 assert.deepEqual(JSON.parse(String(seen[0].init?.body)),{p_event_id:'enea-demo',p_session_hash:await sessionHash(secret)});
});

test('brak sekretu limitera lub zła konfiguracja pozostają zamknięte, bez wywołania RPC',async()=>{
 const noRate={...env,HOLD_RATE_LIMIT_SECRET:''};const runtime=createHoldRuntime(noRate,async()=>{throw new Error('should not call')});
 assert.equal((await runtime(new Request(origin+'/api/seat-api?op=session'))).status,503);
 const off=createHoldRuntime({...env,SEAT_HOLDS_ENABLED:'0'});assert.equal((await off(new Request(origin+'/api/seat-api?op=session'))).status,503);
 const badOrigin=createHoldRuntime({...env,APP_ORIGIN:'not-a-url'});assert.equal((await badOrigin(new Request(origin+'/api/seat-api?op=session'))).status,503);
 const invalid=createHoldRuntime({...env,SUPABASE_URL:'http://untrusted.test'});assert.equal((await invalid(new Request(origin+'/api/seat-api?op=session'))).status,503);
});

test('v2 gateway dispatches canonical and query routes to the same guarded RPCs',async()=>{
 const seen:string[]=[];
 const runtime=createHoldRuntime(env,async(url)=>{
  const name=String(url).split('/').at(-1)!;
  seen.push(name);
  return Response.json(name==='sb_consume_hold_request'?{ok:true,allowed:true}:{ok:false,code:'not_found'});
 });
 const eventId='enea-demo',holdId='12345678-1234-4321-9876-123456789abc';
 const headers={Origin:origin,Cookie:'__Host-salesbeyond_fan='+'a'.repeat(64),'Content-Type':'application/json','X-Forwarded-For':'192.0.2.10'};
 const quote={items:[{seatId:'a',ticketTypeId:'standard'}],expectedCatalogVersion:1,avoidSingle:false};
 const operations=[
  {paths:[`/api/v2/events/${eventId}/quotes`,`/api/seat-api?op=quote-v2&eventId=${eventId}`],method:'POST',body:quote,expected:['sb_consume_hold_request','sb_quote_v2'],status:404},
  {paths:[`/api/v2/events/${eventId}/holds`,`/api/seat-api?op=create-v2&eventId=${eventId}`],method:'POST',body:{quoteToken:holdId,idempotencyKey:'runtime-v2'},expected:['sb_consume_hold_request','sb_create_hold_v2'],status:404},
  {paths:[`/api/v2/events/${eventId}/holds/current`,`/api/seat-api?op=current-v2&eventId=${eventId}`],method:'GET',expected:['sb_current_hold'],status:200},
  {paths:[`/api/v2/holds/${holdId}`,`/api/seat-api?op=hold-v2&holdId=${holdId}`],method:'GET',expected:['sb_get_hold'],status:404},
  {paths:[`/api/v2/holds/${holdId}`,`/api/seat-api?op=hold-v2&holdId=${holdId}`],method:'DELETE',expected:['sb_release_hold'],status:404},
 ];
 for(const {paths,method,body,expected,status} of operations){
  for(const path of paths){
   const response=await runtime(new Request(origin+path,{method,headers,body:JSON.stringify(body)}));
   assert.equal(response.status,status);
   assert.deepEqual(seen.splice(0),expected);
  }
 }
});
