import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSeatHoldClient,SeatHoldClientError,type CreateSeatHoldInput} from './seatHoldClient.ts';

const eventId='enea-demo',holdId='12345678-1234-4321-9876-123456789abc';
const hold=(patch:Record<string,unknown>={})=>({id:holdId,eventId,status:'active',expiresAt:'2035-01-01T12:00:00.000Z',version:7,currency:'PLN',subtotalMinor:17000,items:[{seatId:'101-6-1',priceMinor:8500},{seatId:'101-6-2',priceMinor:8500}],...patch});
const input:CreateSeatHoldInput={eventId,seatIds:['101-6-1','101-6-2'],expectedCatalogVersion:7,idempotencyKey:'stable-key-123'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
function fetcherFor(fn:(url:URL,init:RequestInit)=>Response|Promise<Response>){return (async(input:RequestInfo|URL,init:RequestInit={})=>fn(new URL(String(input),'https://local.test'),init)) as typeof fetch;}
const okSession=(url:URL)=>url.searchParams.get('op')==='session'?json({ok:true}):null;

test('status and inventory use same-origin, uncached gateway requests',async()=>{
 const calls:{url:URL;init:RequestInit}[]=[];
 const client=createSeatHoldClient({fetcher:fetcherFor((url,init)=>{calls.push({url,init});if(url.searchParams.get('op')==='status')return json({ok:true,configured:false,mode:'demo'});return json({ok:true,eventId,status:'open',version:7,currency:'PLN',maxSeats:10,holdSeconds:600,preventSingle:false,sections:[{sectionId:'101',total:100,available:90,minPriceMinor:6500}]});})});
 assert.deepEqual(await client.status(),{configured:false,mode:'demo'});
 assert.deepEqual(await client.inventory(eventId),{eventId,status:'open',version:7,currency:'PLN',maxSeats:10,holdSeconds:600,preventSingle:false,sections:[{sectionId:'101',total:100,available:90,minPriceMinor:6500}]});
 assert.deepEqual(calls.map(c=>c.url.searchParams.get('op')),['status','inventory']);
 assert.equal(calls[1].url.searchParams.get('eventId'),eventId);assert.equal(calls[1].url.searchParams.get('sectionId'),null);
 for(const call of calls){assert.equal(call.init.credentials,'same-origin');assert.equal(call.init.cache,'no-store');}
});

test('parallel creates share a single session bootstrap and preserve the caller idempotency keys',async()=>{
 const calls:{url:URL;init:RequestInit}[]=[];let releaseSession!:()=>void;
 const gate=new Promise<void>(resolve=>{releaseSession=resolve;});
 const client=createSeatHoldClient({fetcher:fetcherFor(async(url,init)=>{
  calls.push({url,init});const op=url.searchParams.get('op');
  if(op==='session'){await gate;return json({ok:true});}
  if(op==='create')return json({ok:true,hold:hold({items:input.seatIds.map(seatId=>({seatId,priceMinor:8500}))})},201);
  throw new Error('unexpected request');
 })});
 const first=client.create(input),second=client.create({...input,idempotencyKey:'stable-key-456'});
 await Promise.resolve();assert.equal(calls.filter(call=>call.url.searchParams.get('op')==='session').length,1);releaseSession();
 const [one,two]=await Promise.all([first,second]);assert.equal(one.id,holdId);assert.equal(two.id,holdId);
 const creates=calls.filter(call=>call.url.searchParams.get('op')==='create');assert.equal(creates.length,2);
 assert.deepEqual(creates.map(call=>JSON.parse(String(call.init.body)).idempotencyKey),['stable-key-123','stable-key-456']);
 for(const call of calls){assert.equal(call.init.credentials,'same-origin');assert.equal(call.init.cache,'no-store');}
});

test('create does not retry or accept substituted seat IDs',async()=>{
 let creates=0;const client=createSeatHoldClient({fetcher:fetcherFor(url=>{
  if(url.searchParams.get('op')==='session')return json({ok:true});creates++;
  return json({ok:true,hold:hold({items:[{seatId:'101-6-1',priceMinor:8500},{seatId:'101-6-3',priceMinor:8500}]})},201);
 })});
 await assert.rejects(client.create(input),error=>error instanceof SeatHoldClientError&&error.code==='invalid_response');assert.equal(creates,1);
});

test('create errors expose only structured safe codes and IDs',async()=>{
 const client=createSeatHoldClient({fetcher:fetcherFor(url=>{
  if(url.searchParams.get('op')==='session')return json({ok:true});
  return json({ok:false,error:{code:'held',seatIds:['101-6-1'],private:'do not expose'}},409);
 })});
 await assert.rejects(client.create(input),error=>error instanceof SeatHoldClientError&&error.code==='held'&&error.status===409&&error.seatIds?.[0]==='101-6-1'&&!error.message.includes('private'));
});

test('unconfigured service stays explicit and malformed responses fail closed',async()=>{
 const offline=createSeatHoldClient({fetcher:fetcherFor(url=>url.searchParams.get('op')==='status'?json({ok:true,configured:false,mode:'demo'}):json({ok:false,error:{code:'backend_not_configured'}},503))});
 assert.deepEqual(await offline.status(),{configured:false,mode:'demo'});
 await assert.rejects(offline.inventory(eventId),error=>error instanceof SeatHoldClientError&&error.code==='backend_not_configured');
 const malformed=createSeatHoldClient({fetcher:fetcherFor(url=>okSession(url)??json({ok:true,configured:true,mode:'demo'}))});
 await assert.rejects(malformed.status(),error=>error instanceof SeatHoldClientError&&error.code==='invalid_response');
});

test('current reads the active hold without a session bootstrap',async()=>{
 const calls:{url:URL;init:RequestInit}[]=[];
 const client=createSeatHoldClient({fetcher:fetcherFor((url,init)=>{
  calls.push({url,init});
  return json({ok:true,hold:hold()});
 })});
 assert.deepEqual(await client.current(eventId),hold());
 assert.equal(calls.length,1);
 assert.equal(calls[0].url.search,'?op=current&eventId=enea-demo');
 assert.equal(calls[0].init.method,'GET');
 assert.equal(calls[0].init.credentials,'same-origin');
 assert.equal(calls[0].init.cache,'no-store');
 await assert.rejects(client.current('invalid/event'),{code:'invalid_request'});
 assert.equal(calls.length,1);
});

test('current accepts an empty successful discovery response',async()=>{
 const client=createSeatHoldClient({fetcher:fetcherFor(()=>json({ok:true,hold:null}))});
 assert.equal(await client.current(eventId),null);
});

test('current distinguishes missing session or hold from backend failures',async()=>{
 let calls=0;
 for(const [status,code] of [[401,'session_required'],[404,'not_found']] as const){
  const client=createSeatHoldClient({fetcher:fetcherFor(()=>{
   calls++;
   return json({ok:false,error:{code}},status);
  })});
  assert.equal(await client.current(eventId),null);
 }
 assert.equal(calls,2);
 for(const [status,code] of [[502,'backend_unavailable'],[503,'backend_not_configured'],[401,'origin_not_allowed'],[502,'not_found']] as const){
  const client=createSeatHoldClient({fetcher:fetcherFor(()=>json({ok:false,error:{code}},status))});
  await assert.rejects(client.current(eventId),{code,status});
 }
});

test('current rejects another event, a non-active hold, and invalid amounts',async()=>{
 for(const patch of [{eventId:'other-event'},{status:'released'},{status:'expired'},{subtotalMinor:0}]){
  const client=createSeatHoldClient({fetcher:fetcherFor(()=>json({ok:true,hold:hold(patch)}))});
  await assert.rejects(client.current(eventId),{code:'invalid_response'});
 }
});

test('get and release use hold endpoint with session credentials and DELETE release',async()=>{
 const calls:{url:URL;init:RequestInit}[]=[];
 const client=createSeatHoldClient({fetcher:fetcherFor((url,init)=>{
  calls.push({url,init});const op=url.searchParams.get('op');if(op==='session')return json({ok:true});
  if(op==='hold')return json({ok:true,hold:hold({status:init.method==='DELETE'?'released':'active'})});
  throw new Error('unexpected request');
 })});
 assert.equal((await client.get(holdId)).status,'active');assert.equal((await client.release(holdId)).status,'released');
 const holdCalls=calls.filter(call=>call.url.searchParams.get('op')==='hold');assert.equal(holdCalls.length,2);
 assert.ok(holdCalls.every(call=>call.url.searchParams.get('holdId')===holdId));assert.deepEqual(holdCalls.map(call=>call.init.method),['GET','DELETE']);
 assert.ok(calls.every(call=>call.init.credentials==='same-origin'&&call.init.cache==='no-store'));
});

test('invalid local create input causes no fetch and network failure is not retried',async()=>{
 let calls=0;const client=createSeatHoldClient({fetcher:fetcherFor(url=>{calls++;if(url.searchParams.get('op')==='session')return json({ok:true});throw new Error('network down');})});
 await assert.rejects(client.create({...input,seatIds:['101-6-1','101-6-1']}),error=>error instanceof SeatHoldClientError&&error.code==='invalid_request');assert.equal(calls,0);
 await assert.rejects(client.create(input),error=>error instanceof SeatHoldClientError&&error.code==='network_error');assert.equal(calls,2);
});

test('hold IDs and aggregate money are validated on read',async()=>{
 const client=createSeatHoldClient({fetcher:fetcherFor(url=>okSession(url)??json({ok:true,hold:hold({subtotalMinor:16999})}))});
 await assert.rejects(client.get(holdId),error=>error instanceof SeatHoldClientError&&error.code==='invalid_response');
});

test('przy tworzeniu zachowuje pierwotne żądanie mimo zmiany wyboru w czasie bootstrap',async()=>{
 let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve});let body:Record<string,unknown>|null=null;
 const client=createSeatHoldClient({fetcher:fetcherFor(async(url,init)=>{if(url.searchParams.get('op')==='session'){await gate;return json({ok:true})}body=JSON.parse(String(init.body));return json({ok:true,hold:hold()},201)})});
 const mutable={...input,seatIds:[...input.seatIds]},pending=client.create(mutable);mutable.seatIds[0]='103-6-1';mutable.idempotencyKey='different-key';release();await pending;
 assert.deepEqual(body,{seatIds:input.seatIds,expectedCatalogVersion:7,idempotencyKey:'stable-key-123'});
});
test('idempotentny replay po wygaśnięciu zachowuje stan serwera i nie zgłasza nowej aktywnej blokady',async()=>{
 for(const status of ['expired','released']){
 const client=createSeatHoldClient({fetcher:fetcherFor(url=>okSession(url)??json({ok:true,replayed:true,hold:hold({status})}))});assert.equal((await client.create(input)).status,status);
 }
});
test('po utracie sesji dopiero jawne ponowienie inicjalizuje nową sesję, bez ślepego retry',async()=>{
 let bootstraps=0,creates=0;
 const client=createSeatHoldClient({fetcher:fetcherFor(url=>{if(url.searchParams.get('op')==='session'){bootstraps++;return json({ok:true})}creates++;return creates===1?json({ok:false,error:{code:'session_required'}},401):json({ok:true,hold:hold()})})});
 await assert.rejects(client.create(input),error=>error instanceof SeatHoldClientError&&error.code==='session_required');assert.equal(creates,1);await client.create(input);assert.equal(creates,2);assert.equal(bootstraps,2);
});
test('odrzuca zewnętrzny endpoint, nie-stringowe statusy i miejsca innego bloku',async()=>{
 assert.throws(()=>createSeatHoldClient({endpoint:'https://other.test/api'}));
 const invalid=createSeatHoldClient({fetcher:fetcherFor(url=>okSession(url)??json({ok:true,hold:hold({status:['active']})}))});await assert.rejects(invalid.create(input),error=>error instanceof SeatHoldClientError&&error.code==='invalid_response');
 const wrongBlock=createSeatHoldClient({fetcher:fetcherFor(()=>json({ok:true,eventId,status:'open',version:7,currency:'PLN',maxSeats:10,holdSeconds:600,preventSingle:false,seats:[{seatId:'102-6-1',sectionId:'102',row:6,number:1,priceMinor:8500,status:'available'}]}))});await assert.rejects(wrongBlock.inventory(eventId,'101'),error=>error instanceof SeatHoldClientError&&error.code==='invalid_response');
});

test('v2 quote wysyła wyłącznie pary fotel-typ, a create używa tylko tokenu i klucza',async()=>{
 const typedItems=[{seatId:'101-6-1',ticketTypeId:'child'},{seatId:'101-6-2',ticketTypeId:'standard'}];
 const quoteToken='87654321-8765-4321-9876-123456789abc';
 const calls:{op:string|null;body:unknown}[]=[];
 const client=createSeatHoldClient({fetcher:fetcherFor((url,init)=>{
  const op=url.searchParams.get('op');if(op==='session')return json({ok:true});
  calls.push({op,body:JSON.parse(String(init.body))});
  if(op==='quote-v2')return json({ok:true,quote:{quoteToken,eventId,expiresAt:'2035-01-01T11:02:00.000Z',version:7,currency:'PLN',subtotalMinor:15000,items:[{...typedItems[0],priceMinor:6500},{...typedItems[1],priceMinor:8500}]}});
  return json({ok:true,hold:hold({items:[{...typedItems[0],priceMinor:6500},{...typedItems[1],priceMinor:8500}],subtotalMinor:15000})},201);
 })});
 const quote=await client.quoteV2({eventId,items:typedItems,expectedCatalogVersion:7,avoidSingle:true});
 assert.equal(quote.quoteToken,quoteToken);assert.equal(quote.items[0].ticketTypeId,'child');
 const created=await client.createV2({eventId,quoteToken,idempotencyKey:'stable-v2-key'});assert.equal(created.items[1].ticketTypeId,'standard');
 assert.deepEqual(calls,[
  {op:'quote-v2',body:{items:typedItems,expectedCatalogVersion:7,avoidSingle:true}},
  {op:'create-v2',body:{quoteToken,idempotencyKey:'stable-v2-key'}},
 ]);
});

test('v2 odrzuca podmieniony typ, cenę i niepełny snapshot',async()=>{
 const items=[{seatId:'101-6-1',ticketTypeId:'child'}],quoteToken='87654321-8765-4321-9876-123456789abc';
 for(const quote of [
  {quoteToken,eventId,expiresAt:'2035-01-01T11:02:00.000Z',version:7,currency:'PLN',subtotalMinor:6500,items:[{seatId:'101-6-1',ticketTypeId:'standard',priceMinor:6500}]},
  {quoteToken,eventId,expiresAt:'2035-01-01T11:02:00.000Z',version:7,currency:'PLN',subtotalMinor:1,items:[{seatId:'101-6-1',ticketTypeId:'child',priceMinor:6500}]},
  {quoteToken,eventId,expiresAt:'2035-01-01T11:02:00.000Z',version:7,currency:'PLN',subtotalMinor:6500,items:[{seatId:'101-6-1',priceMinor:6500}]},
 ]){
  const client=createSeatHoldClient({fetcher:fetcherFor(url=>url.searchParams.get('op')==='session'?json({ok:true}):json({ok:true,quote}))});
  await assert.rejects(client.quoteV2({eventId,items,expectedCatalogVersion:7}),{code:'invalid_response'});
 }
});

test('v2 current/get/release zachowują typ, a legacy snapshot pozostaje czytelny',async()=>{
 const typed=hold({items:[{seatId:'101-6-1',ticketTypeId:'child',priceMinor:8500}],subtotalMinor:8500});
 const client=createSeatHoldClient({fetcher:fetcherFor((url,init)=>{
  const op=url.searchParams.get('op');if(op==='session')return json({ok:true});
  return json({ok:true,hold:op==='current-v2'?typed:{...typed,status:init.method==='DELETE'?'released':'active'}});
 })});
 assert.equal((await client.currentV2(eventId))?.items[0].ticketTypeId,'child');
 assert.equal((await client.getV2(holdId)).items[0].ticketTypeId,'child');
 assert.equal((await client.releaseV2(holdId)).status,'released');
 const legacy=createSeatHoldClient({fetcher:fetcherFor(()=>json({ok:true,hold:hold()}))});
 assert.equal((await legacy.currentV2(eventId))?.items[0].ticketTypeId,undefined);
});
