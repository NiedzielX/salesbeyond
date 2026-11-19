import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHoldApi,holdRateKey,sessionHash} from './holdApi.ts';
import {createSupabaseHoldStore,type HoldStore,type CreateHold} from './holdStore.ts';
const origin='https://salesbeyond.test',secret='a'.repeat(64),cookie=`__Host-salesbeyond_fan=${secret}`,holdId='12345678-1234-4321-9876-123456789abc';
const hold={id:holdId,eventId:'enea-demo',status:'active',expiresAt:'2030-01-01T12:00:00Z',version:1,currency:'PLN',subtotalMinor:17000,items:[{seatId:'101-6-1',priceMinor:8500},{seatId:'101-6-2',priceMinor:8500}]};
function fixture(){
 const creates:CreateHold[]=[],lookups:string[]=[],rates:string[]=[];
 const store:HoldStore={inventory:async()=>({ok:true,eventId:'enea-demo',status:'open',version:1,currency:'PLN',maxSeats:10,holdSeconds:600,preventSingle:false,sections:[{sectionId:'101',total:200,available:150,minPriceMinor:6500}]}),create:async input=>{creates.push(input);return {ok:true,hold:{...hold,sessionHash:'must-not-leak'}}},get:async(id,owner)=>{lookups.push(id,owner);return {ok:true,hold}},release:async()=>({ok:true,hold:{...hold,status:'released'}}),consumeRate:async key=>{rates.push(key);return {ok:true,allowed:true}}};
 return {store,creates,lookups,rates};
}
function request(path:string,method='GET',body?:unknown,extra:Record<string,string>={}){
 return new Request(origin+path,{method,headers:{Origin:origin,Cookie:cookie,...(body===undefined?{}:{'Content-Type':'application/json'}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)})});
}
const payload={seatIds:['101-6-1','101-6-2'],expectedCatalogVersion:1,idempotencyKey:'retry-key-01'};
const rateKey=async()=>'b'.repeat(64);

test('backend niewłączony nie udaje holda i nie wydaje cookie',async()=>{
 const api=createHoldApi({store:null,origin});const response=await api(request('/api/seat-session'));
 assert.equal(response.status,503);assert.equal(response.headers.get('set-cookie'),null);assert.equal(response.headers.get('cache-control'),'no-store');
});
test('bootstrap sesji ma bezpieczne cookie, zachowuje istniejącą sesję i odrzuca obcy kontekst',async()=>{
 const {store}=fixture(),api=createHoldApi({store,origin,rateKey});
 const response=await api(new Request(origin+'/api/seat-session'));
 assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true});
 const set=response.headers.get('set-cookie')!;assert.match(set,/^__Host-salesbeyond_fan=[0-9a-f]{64};/);for(const flag of ['Path=/','HttpOnly','Secure','SameSite=Lax'])assert.ok(set.includes(flag));
 assert.equal((await api(request('/api/seat-session'))).headers.get('set-cookie'),null);
 assert.equal((await api(request('/api/seat-session','GET',undefined,{'Sec-Fetch-Site':'cross-site'}))).status,403);
});
test('dodanie wymaga wcześniejszej sesji i właściwego Origin, dane są weryfikowane przed RPC',async()=>{
 const {store,creates}=fixture(),api=createHoldApi({store,origin,rateKey});
 assert.equal((await api(request('/api/events/enea-demo/holds','POST',payload,{Cookie:''}))).status,401);
 assert.equal((await api(request('/api/events/enea-demo/holds','POST',payload,{Origin:'https://other.test'}))).status,403);
 for(const invalid of [{...payload,seatIds:[]},{...payload,seatIds:['101-6-1','101-6-1']},{...payload,expectedCatalogVersion:1.1},{...payload,expectedCatalogVersion:0},{...payload,seatIds:['<script>']},{...payload,avoidSingle:'yes'}])assert.equal((await api(request('/api/events/enea-demo/holds','POST',invalid))).status,400);
 assert.equal((await api(request('/api/events/enea-demo/holds','POST',payload,{'Content-Type':'text/plain'}))).status,415);
 assert.equal((await api(new Request(origin+'/api/events/enea-demo/holds',{method:'POST',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},body:'x'.repeat(8193)}))).status,413);
 assert.equal(creates.length,0);
});
test('RPC dostaje hash zamiast sekretu, a odpowiedź usuwa pola wewnętrzne i ceny są spójne',async()=>{
 const {store,creates,rates}=fixture(),api=createHoldApi({store,origin,rateKey});
 const response=await api(request('/api/events/enea-demo/holds','POST',{...payload,avoidSingle:true}));
 assert.equal(response.status,201);assert.equal(creates.length,1);assert.equal(creates[0].sessionHash,await sessionHash(secret));assert.notEqual(creates[0].sessionHash,secret);assert.equal(creates[0].avoidSingle,true);assert.deepEqual(rates,['b'.repeat(64)]);
 const body=await response.json();assert.deepEqual(body.hold,hold);assert.ok(!JSON.stringify(body).includes('sessionHash'));assert.ok(!JSON.stringify(body).includes(secret));
});
test('idempotentny retry, konflikt i odmowa właściciela mają jawne kody bez wycieku informacji',async()=>{
 const {store}=fixture();store.create=async()=>({ok:true,hold,replayed:true});const api=createHoldApi({store,origin,rateKey});
 assert.equal((await api(request('/api/events/enea-demo/holds','POST',payload))).status,200);
 store.create=async()=>({ok:false,code:'held',seatIds:['101-6-2'],sessionHash:'private'});
 const conflict=await api(request('/api/events/enea-demo/holds','POST',payload));assert.equal(conflict.status,409);assert.ok(!(await conflict.text()).includes('private'));
 store.get=async()=>({ok:false,code:'not_found'});assert.equal((await api(request('/api/holds/'+holdId))).status,404);
 assert.equal((await api(request('/api/holds/'+holdId,'DELETE',undefined,{Origin:'https://other.test'}))).status,403);
});
test('wyczerpanie współdzielonego limitu blokuje create, brak konfiguracji zamyka operację',async()=>{
 const {store,creates}=fixture();store.consumeRate=async()=>({ok:true,allowed:false});
 const response=await createHoldApi({store,origin,rateKey})(request('/api/events/enea-demo/holds','POST',payload));assert.equal(response.status,429);assert.equal(response.headers.get('retry-after'),'60');assert.equal(creates.length,0);
 assert.equal((await createHoldApi({store,origin})(request('/api/events/enea-demo/holds','POST',payload))).status,503);
});
test('błąd bazy, nieprawidłowa suma lub błąd loggera nie ujawniają sekretów i nie kończą wyjątkiem',async()=>{
 const {store}=fixture();store.create=async()=>{throw new Error('raw-private-service-key')};
 const api=createHoldApi({store,origin,rateKey,log(){throw new Error('logger failed')}});
 const failed=await api(request('/api/events/enea-demo/holds','POST',payload));assert.equal(failed.status,502);assert.ok(!(await failed.text()).includes('raw-private-service-key'));
 store.create=async()=>({ok:true,hold:{...hold,subtotalMinor:1}});assert.equal((await api(request('/api/events/enea-demo/holds','POST',payload))).status,502);
 store.create=async()=>({ok:true,hold,replayed:'true'});assert.equal((await api(request('/api/events/enea-demo/holds','POST',payload))).status,502);
 store.create=async()=>({ok:true,hold:{...hold,status:['active']}});assert.equal((await api(request('/api/events/enea-demo/holds','POST',payload))).status,502);
});
test('inventory zwraca tylko publiczne metadane, a własny hold pozostaje związany z sesją',async()=>{
 const {store,lookups}=fixture(),api=createHoldApi({store,origin,rateKey});
 const inventory=await api(request('/api/events/enea-demo/inventory'));assert.equal(inventory.status,200);assert.equal((await inventory.json()).sections[0].available,150);
 const own=await api(request('/api/holds/'+holdId));assert.equal(own.status,200);assert.deepEqual(lookups,[holdId,await sessionHash(secret)]);
 const released=await api(request('/api/holds/'+holdId,'DELETE'));assert.equal((await released.json()).hold.status,'released');
 assert.equal((await api(request('/api/events/enea-demo/inventory','POST',{}))).status,405);
});
test('klucz rate limit jest deterministycznym HMAC i nie ujawnia adresu klienta',async()=>{
 const value=await holdRateKey('192.0.2.1','s'.repeat(32));assert.match(value,/^[0-9a-f]{64}$/);assert.equal(value,await holdRateKey('192.0.2.1','s'.repeat(32)));assert.notEqual(value,await holdRateKey('192.0.2.2','s'.repeat(32)));await assert.rejects(()=>holdRateKey('192.0.2.1','short'));
});
test('adapter RPC używa serwerowego klucza, kontrolowanego adresu, timeout i nie ujawnia błędu transportu',async()=>{
 const calls:{url:string;init:RequestInit}[]=[];
 const store=createSupabaseHoldStore({url:'https://example.supabase.co',serviceKey:'test-server-key',fetcher:(async(url,init)=>{calls.push({url:String(url),init:init!});return Response.json({ok:true,allowed:true})}) as typeof fetch});
 await store.consumeRate('b'.repeat(64));assert.equal(calls[0].url,'https://example.supabase.co/rest/v1/rpc/sb_consume_hold_request');assert.equal(new Headers(calls[0].init.headers).get('apikey'),'test-server-key');assert.equal(calls[0].init.cache,'no-store');assert.ok(calls[0].init.signal);assert.deepEqual(JSON.parse(String(calls[0].init.body)),{p_key:'b'.repeat(64),p_limit:20});
 const broken=createSupabaseHoldStore({url:'https://example.supabase.co',serviceKey:'test-server-key',fetcher:(async()=>new Response('private db data',{status:500})) as typeof fetch});await assert.rejects(()=>broken.inventory('enea-demo',null),{message:'Inventory backend request failed'});
 assert.throws(()=>createSupabaseHoldStore({url:'http://untrusted.test',serviceKey:'x'}));assert.throws(()=>createSupabaseHoldStore({url:'https://untrusted.test',serviceKey:'x'}));
});
