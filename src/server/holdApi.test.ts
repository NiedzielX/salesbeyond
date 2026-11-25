import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHoldApi,holdRateKey,sessionHash} from './holdApi.ts';
import {createSupabaseHoldStore,type HoldStore,type CreateHold,type CreateQuote,type CreateHoldV2} from './holdStore.ts';
const origin='https://salesbeyond.test',secret='a'.repeat(64),cookie=`__Host-salesbeyond_fan=${secret}`,holdId='12345678-1234-4321-9876-123456789abc';
const hold={id:holdId,eventId:'enea-demo',status:'active',expiresAt:'2030-01-01T12:00:00Z',version:1,currency:'PLN',subtotalMinor:17000,items:[{seatId:'101-6-1',priceMinor:8500},{seatId:'101-6-2',priceMinor:8500}]};
function fixture(){
 const creates:CreateHold[]=[],quotes:CreateQuote[]=[],createsV2:CreateHoldV2[]=[],lookups:string[]=[],rates:string[]=[];
 const rateOperations:(string|undefined)[]=[];
 const store:HoldStore={inventory:async()=>({ok:true,eventId:'enea-demo',status:'open',version:1,currency:'PLN',maxSeats:10,holdSeconds:600,preventSingle:false,sections:[{sectionId:'101',total:200,available:150,minPriceMinor:6500}]}),create:async input=>{creates.push(input);return {ok:true,hold:{...hold,sessionHash:'must-not-leak'}}},quote:async input=>{quotes.push(input);return {ok:true,quote:{...quote,requestHash:'private-hash'}}},createV2:async input=>{createsV2.push(input);return {ok:true,hold:{...hold,items:typedItems}}},current:async()=>({ok:false,code:'not_found'}),get:async(id,owner)=>{lookups.push(id,owner);return {ok:true,hold}},release:async()=>({ok:true,hold:{...hold,status:'released'}}),consumeRate:async(key,operation)=>{rates.push(key);rateOperations.push(operation);return {ok:true,allowed:true}}};
 return {store,creates,quotes,createsV2,lookups,rates,rateOperations};
}
function request(path:string,method='GET',body?:unknown,extra:Record<string,string>={}){
 return new Request(origin+path,{method,headers:{Origin:origin,Cookie:cookie,...(body===undefined?{}:{'Content-Type':'application/json'}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)})});
}
const payload={seatIds:['101-6-1','101-6-2'],expectedCatalogVersion:1,idempotencyKey:'retry-key-01'};
const rateKey=async()=>'b'.repeat(64);
const quoteToken='87654321-8765-4321-9876-123456789abc';
const quotePath='/api/v2/events/enea-demo/quotes',createV2Path='/api/v2/events/enea-demo/holds';
const quoteInput={items:[{seatId:'101-6-2',ticketTypeId:'child'},{seatId:'101-6-1',ticketTypeId:'standard'}],expectedCatalogVersion:1,avoidSingle:true};
const createV2Input={quoteToken,idempotencyKey:payload.idempotencyKey};
const typedItems=hold.items.map((item,index)=>({...item,ticketTypeId:index===0?'standard':'child'}));
const quote={quoteToken,eventId:hold.eventId,expiresAt:hold.expiresAt,version:hold.version,currency:hold.currency,subtotalMinor:hold.subtotalMinor,items:typedItems};

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
test('current hold reads only the cookie owner without bootstrapping a session',async()=>{
 const {store}=fixture(),calls:{eventId:string;owner:string}[]=[];
 const ownerHash=await sessionHash(secret);
 store.current=async(eventId,owner)=>{
  calls.push({eventId,owner});
  return owner===ownerHash&&eventId===hold.eventId
   ?{ok:true,hold:{...hold,sessionHash:'must-not-leak'}}
   :{ok:false,code:'not_found',holdId};
 };
 const api=createHoldApi({store,origin});
 const path='/api/events/enea-demo/holds/current';
 for(const badCookie of ['', '__Host-salesbeyond_fan=invalid']){
  const response=await api(request(path,'GET',undefined,{Cookie:badCookie}));
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{ok:true,hold:null});
  assert.equal(response.headers.get('set-cookie'),null);
 }
 const method=await api(request(path,'DELETE'));
 assert.equal(method.status,405);
 assert.equal(method.headers.get('allow'),'GET');
 assert.equal(calls.length,0);
 const own=await api(request(path));
 assert.equal(own.status,200);
 assert.equal(own.headers.get('set-cookie'),null);
 assert.equal(own.headers.get('cache-control'),'no-store');
 assert.equal(own.headers.get('vary'),'Cookie, Origin');
 assert.deepEqual(await own.json(),{ok:true,hold,replayed:false});
 assert.deepEqual(calls,[{eventId:'enea-demo',owner:ownerHash}]);
 const foreign=await api(request(path+'?sessionHash='+ownerHash,'GET',undefined,
  {Cookie:'__Host-salesbeyond_fan='+'b'.repeat(64)}));
 assert.equal(foreign.status,200);
 assert.deepEqual(await foreign.json(),{ok:true,hold:null});
 const other=await api(request('/api/events/other-event/holds/current'));
 assert.equal(other.status,200);
 assert.deepEqual(await other.json(),{ok:true,hold:null});
});

test('current hold rejects a released hold or a hold from a different event in the backend result',async()=>{
 const {store}=fixture(),api=createHoldApi({store,origin});
 for(const wrong of [{...hold,status:'released'},{...hold,eventId:'other-event'}]){
  store.current=async()=>({ok:true,hold:wrong});
  assert.equal((await api(request('/api/events/enea-demo/holds/current'))).status,502);
 }
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

test('v2 quote validates its selection, session and origin before applying an independent quota',async()=>{
 const {store,quotes,rates,rateOperations}=fixture(),api=createHoldApi({store,origin,rateKey});
 assert.equal((await api(request(quotePath,'POST',quoteInput,{Cookie:''}))).status,401);
 assert.equal((await api(request(quotePath,'POST',quoteInput,{Origin:'https://other.test'}))).status,403);
 for(const invalid of [
  {...quoteInput,items:[]},
  {...quoteInput,items:[quoteInput.items[0],{...quoteInput.items[0],ticketTypeId:'standard'}]},
  {...quoteInput,items:[{...quoteInput.items[0],priceMinor:0}]},
  {...quoteInput,expectedCatalogVersion:Number.MAX_SAFE_INTEGER+1},
  {...quoteInput,subtotalMinor:17000},
  {...quoteInput,avoidSingle:undefined},
 ])assert.equal((await api(request(quotePath,'POST',invalid))).status,400);
 assert.deepEqual(rates,[]);
 const result=await api(request(quotePath,'POST',quoteInput));
 assert.equal(result.status,200);
 assert.equal(result.headers.get('cache-control'),'no-store');
 assert.deepEqual(await result.json(),{ok:true,quote});
 assert.deepEqual(quotes,[{
  eventId:hold.eventId,sessionHash:await sessionHash(secret),items:quoteInput.items,expectedVersion:1,avoidSingle:true,
 }]);
 await api(request('/api/events/enea-demo/holds','POST',payload));
 assert.deepEqual(rateOperations,['quote',undefined]);
 assert.notEqual(rates[0],rates[1]);
 store.consumeRate=async(_key,operation)=>({ok:true,allowed:operation!=='quote'});
 const limited=await api(request(quotePath,'POST',quoteInput));
 assert.equal(limited.status,429);
 assert.equal(limited.headers.get('retry-after'),'60');
 assert.equal(quotes.length,1);
});

test('v2 create accepts only a token and key and distinguishes replay, conflict and a new hold',async()=>{
 const {store,creates,createsV2}=fixture(),api=createHoldApi({store,origin,rateKey});
 for(const invalid of [payload,{...createV2Input,seatIds:payload.seatIds},{...createV2Input,quoteToken:'not-a-token'}]){
  assert.equal((await api(request(createV2Path,'POST',invalid))).status,400);
 }
 assert.equal((await api(request('/api/events/enea-demo/holds','POST',createV2Input))).status,400);
 assert.deepEqual(creates,[]);
 assert.deepEqual(createsV2,[]);
 const first=await api(request(createV2Path,'POST',createV2Input));
 assert.equal(first.status,201);
 assert.deepEqual(await first.json(),{ok:true,hold:{...hold,items:typedItems},replayed:false});
 assert.deepEqual(createsV2,[{...createV2Input,eventId:hold.eventId,sessionHash:await sessionHash(secret)}]);

 store.createV2=async()=>({ok:true,replayed:true,hold:{...hold,items:typedItems}});
 assert.equal((await api(request(createV2Path,'POST',createV2Input))).status,200);
 for(const [code,status] of [['quote_expired',409],['quote_consumed',409],['not_found',404]] as const){
  store.createV2=async()=>({ok:false,code,quoteToken});
  const response=await api(request(createV2Path,'POST',createV2Input));
  assert.equal(response.status,status);
  const value=await response.json();
  assert.equal(value.error.code,code);
  assert.equal(value.error.quoteToken,undefined);
 }
});

test('v2 quote policy errors retain their bounds and invalid snapshots fail closed',async()=>{
 const {store}=fixture(),api=createHoldApi({store,origin,rateKey});
 for(const {code,detail} of [
  {code:'below_minimum',detail:{minSeats:2}},
  {code:'seat_limit',detail:{maxSeats:6}},
  {code:'invalid_ticket_type',detail:{}},
 ]){
  store.quote=async()=>({ok:false,code,...detail,requestHash:'private'});
  const response=await api(request(quotePath,'POST',quoteInput));
  assert.equal(response.status,400);
  assert.deepEqual((await response.json()).error,{code,requestId:response.headers.get('x-salesbeyond-request-id'),...detail});
 }
 for(const wrong of [{...quote,items:hold.items},{...quote,items:[{...typedItems[0],ticketTypeId:'child'},typedItems[1]]},{...quote,subtotalMinor:1}]){
  store.quote=async()=>({ok:true,quote:wrong});
  assert.equal((await api(request(quotePath,'POST',quoteInput))).status,502);
 }
});

test('current, get and release serialize both snapshot shapes by API version',async()=>{
 const {store}=fixture(),api=createHoldApi({store,origin,rateKey});
 for(const items of [hold.items,typedItems]){
  store.current=store.get=async()=>({ok:true,hold:{...hold,items}});
  store.release=async()=>({ok:true,hold:{...hold,status:'released',items}});
  for(const [prefix,expectedItems] of [['/api',hold.items],['/api/v2',items]] as const){
   for(const [path,method] of [[`/events/${hold.eventId}/holds/current`,'GET'],[`/holds/${holdId}`,'GET'],[`/holds/${holdId}`,'DELETE']]){
    const response=await api(request(prefix+path,method));
    assert.equal(response.status,200);
    assert.deepEqual((await response.json()).hold.items,expectedItems);
   }
  }
 }
});

test('adapter routes both v2 mutations with typed, session-owned payloads',async()=>{
 const calls:{name:string;body:unknown}[]=[];
 const store=createSupabaseHoldStore({url:'https://example.supabase.co',serviceKey:'test-server-key',fetcher:async(url,init)=>{
  calls.push({name:String(url).split('/').at(-1)!,body:JSON.parse(String(init?.body))});return Response.json({ok:true});
 }});
 const eventId=hold.eventId,owner=await sessionHash(secret),addressKey=await rateKey();
 await store.consumeRate(addressKey,'quote');
 await store.quote({eventId,sessionHash:owner,items:quoteInput.items,expectedVersion:1,avoidSingle:true});
 await store.createV2({eventId,sessionHash:owner,...createV2Input});
 assert.deepEqual(calls,[
  {name:'sb_consume_hold_request',body:{p_key:addressKey,p_limit:30}},
  {name:'sb_quote_v2',body:{p_event_id:eventId,p_session_hash:owner,p_items:quoteInput.items,p_expected_version:1,p_avoid_single:true}},
  {name:'sb_create_hold_v2',body:{p_event_id:eventId,p_session_hash:owner,p_quote_token:quoteToken,p_idempotency_key:createV2Input.idempotencyKey}},
 ]);
});
