import type {HoldStore} from './holdStore.ts';
const cookieName='__Host-salesbeyond_fan';
const id=/^[A-Za-z0-9_-]{1,128}$/,uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,hash=/^[0-9a-f]{64}$/;
const errorCodes=new Set(['invalid_request','not_found','event_closed','catalog_changed','seat_limit','active_hold_exists','held','unavailable','single_seat_gap','idempotency_key_reused']);
type Obj=Record<string,unknown>;
const object=(value:unknown):value is Obj=>!!value&&typeof value==='object'&&!Array.isArray(value);
const integer=(value:unknown)=>Number.isSafeInteger(value)&&Number(value)>=0;
const safeId=(value:unknown):value is string=>typeof value==='string'&&id.test(value);
const hex=(value:ArrayBuffer)=>Array.from(new Uint8Array(value),byte=>byte.toString(16).padStart(2,'0')).join('');
export async function sessionHash(secret:string){return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(secret)));}
/** Hash a trusted platform client address; never persist the raw address or reuse a public salt. */
export async function holdRateKey(address:string,secret:string){
 if(secret.length<32||!address||address.length>256)throw new Error('Rate limit configuration unavailable');
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(address)));
}
function sessionCookie(request:Request){
 for(const item of (request.headers.get('cookie')??'').split(';')){const part=item.trim();if(part.startsWith(`${cookieName}=`)){const value=part.slice(cookieName.length+1);return hash.test(value)?value:null;}}
 return null;
}
function holdRecord(value:unknown){
 if(!object(value)||typeof value.id!=='string'||!uuid.test(value.id)||!safeId(value.eventId)||(typeof value.status!=='string'||!['active','released','expired'].includes(value.status))||typeof value.expiresAt!=='string'||!Number.isFinite(Date.parse(value.expiresAt))||!integer(value.version)||!integer(value.subtotalMinor)||typeof value.currency!=='string'||!/^[A-Z]{3}$/.test(value.currency)||!Array.isArray(value.items)||value.items.length<1||value.items.length>10)throw new Error('Invalid backend result');
 const items=value.items.map(item=>{if(!object(item)||!safeId(item.seatId)||!integer(item.priceMinor))throw new Error('Invalid backend item');return {seatId:item.seatId,priceMinor:Number(item.priceMinor)};});
 if(new Set(items.map(item=>item.seatId)).size!==items.length||items.reduce((sum,item)=>sum+item.priceMinor,0)!==value.subtotalMinor)throw new Error('Invalid backend amount');
 return {id:value.id,eventId:value.eventId,status:value.status,expiresAt:value.expiresAt,version:value.version,currency:value.currency,subtotalMinor:value.subtotalMinor,items};
}
function inventoryRecord(value:Obj){
 if(!safeId(value.eventId)||(typeof value.status!=='string'||!['open','paused','closed','cancelled'].includes(value.status))||!integer(value.version)||typeof value.currency!=='string'||!/^[A-Z]{3}$/.test(value.currency)||!integer(value.maxSeats)||Number(value.maxSeats)>10||!integer(value.holdSeconds)||typeof value.preventSingle!=='boolean')throw new Error('Invalid inventory');
 const base={ok:true,eventId:value.eventId,status:value.status,version:value.version,currency:value.currency,maxSeats:value.maxSeats,holdSeconds:value.holdSeconds,preventSingle:value.preventSingle};
 if(Array.isArray(value.sections)){
 if(value.sections.length>1000)throw new Error('Inventory too large');
 return {...base,sections:value.sections.map(section=>{if(!object(section)||!safeId(section.sectionId)||!integer(section.total)||!integer(section.available)||Number(section.available)>Number(section.total)||section.minPriceMinor!==null&&!integer(section.minPriceMinor))throw new Error('Invalid inventory section');return {sectionId:section.sectionId,total:section.total,available:section.available,minPriceMinor:section.minPriceMinor};})};
 }
 if(!Array.isArray(value.seats)||value.seats.length>10000)throw new Error('Invalid inventory seats');
 return {...base,seats:value.seats.map(seat=>{if(!object(seat)||!safeId(seat.seatId)||!safeId(seat.sectionId)||!integer(seat.row)||!integer(seat.number)||!integer(seat.priceMinor)||(typeof seat.status!=='string'||!['available','blocked','sold','closed','held'].includes(seat.status)))throw new Error('Invalid inventory seat');return {seatId:seat.seatId,sectionId:seat.sectionId,row:seat.row,number:seat.number,priceMinor:seat.priceMinor,status:seat.status};})};
}
async function jsonBody(request:Request){
 if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')??''))throw new Error('unsupported_media');
 const length=request.headers.get('content-length');if(length!==null&&(!/^\d+$/.test(length)||Number(length)>8192))throw new Error('too_large');
 if(!request.body)throw new Error('invalid_json');
 const reader=request.body.getReader(),chunks:Uint8Array[]=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8192){await reader.cancel();throw new Error('too_large');}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let position=0;for(const chunk of chunks){bytes.set(chunk,position);position+=chunk.byteLength;}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw new Error('invalid_json');}
}
export function createHoldApi(config:{store:HoldStore|null;origin:string;rateKey?:(request:Request)=>Promise<string>;log?:(code:string,requestId:string)=>void}){
 const origin=new URL(config.origin).origin;
 return async(request:Request):Promise<Response>=>{
 const requestId=crypto.randomUUID(),headers=new Headers({'Cache-Control':'no-store',Vary:'Cookie, Origin','X-SalesBeyond-Request-Id':requestId});
 const respond=(body:unknown,status=200)=>Response.json(body,{status,headers});
 const fail=(code:string,status:number,details?:Obj)=>respond({ok:false,error:{code,requestId,...details}},status);
 if(!config.store)return fail('backend_not_configured',503);
 const store=config.store;
 try{
 const url=new URL(request.url),method=request.method.toUpperCase();
 if(['POST','DELETE'].includes(method)&&request.headers.get('origin')!==origin)return fail('origin_not_allowed',403);
 if(url.pathname==='/api/seat-session'){
 if(method!=='GET'){headers.set('Allow','GET');return fail('method_not_allowed',405);}
 if(request.headers.get('sec-fetch-site')==='cross-site'||request.headers.has('origin')&&request.headers.get('origin')!==origin)return fail('origin_not_allowed',403);
 if(!sessionCookie(request)){const secret=hex(crypto.getRandomValues(new Uint8Array(32)).buffer);headers.set('Set-Cookie',`${cookieName}=${secret}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`);}
 return respond({ok:true});
 }
 const eventPath=/^\/api\/events\/([A-Za-z0-9_-]{1,80})\/(inventory|holds(?:\/current)?)$/.exec(url.pathname);
 const ownHold=/^\/api\/holds\/([0-9a-f-]{36})$/i.exec(url.pathname);
 const currentEventId=eventPath?.[2]==='holds/current'?eventPath[1]:undefined;
 let result:unknown;let create=false;
 if(eventPath?.[2]==='inventory'){
 if(method!=='GET'){headers.set('Allow','GET');return fail('method_not_allowed',405);}
 const section=url.searchParams.get('sectionId');if(section!==null&&!safeId(section))return fail('invalid_request',400);
 result=await store.inventory(eventPath[1],section);
 }else if(eventPath||ownHold){
 const methods=currentEventId?['GET']:eventPath?['POST']:['GET','DELETE'];
 if(!methods.includes(method)){headers.set('Allow',methods.join(', '));return fail('method_not_allowed',405);}
 const secret=sessionCookie(request);if(!secret){if(currentEventId)return respond({ok:true,hold:null});return fail('session_required',401);}const owner=await sessionHash(secret);
 if(currentEventId)result=await store.current(currentEventId,owner);
 else if(ownHold){if(!uuid.test(ownHold[1]))return fail('not_found',404);result=method==='DELETE'?await store.release(ownHold[1],owner):await store.get(ownHold[1],owner);}
 else{
 let body:unknown;try{body=await jsonBody(request);}catch(error){const code=error instanceof Error?error.message:'invalid_json';return fail(code,code==='too_large'?413:code==='unsupported_media'?415:400);}
 if(!object(body)||!Array.isArray(body.seatIds)||body.seatIds.length<1||body.seatIds.length>10||!body.seatIds.every(safeId)||new Set(body.seatIds).size!==body.seatIds.length||(!integer(body.expectedCatalogVersion)||Number(body.expectedCatalogVersion)<1)||typeof body.idempotencyKey!=='string'||!/^[A-Za-z0-9_-]{8,128}$/.test(body.idempotencyKey)||body.avoidSingle!==undefined&&typeof body.avoidSingle!=='boolean')return fail('invalid_request',400);
 if(!config.rateKey)return fail('backend_not_configured',503);
 const key=await config.rateKey(request);if(!hash.test(key))throw new Error('Invalid rate key');
 const quota=await store.consumeRate(key);if(!object(quota)||quota.ok!==true||typeof quota.allowed!=='boolean')throw new Error('Invalid quota result');
 if(!quota.allowed){headers.set('Retry-After','60');return fail('rate_limited',429);}
 result=await store.create({eventId:eventPath![1],sessionHash:owner,seatIds:body.seatIds,expectedVersion:Number(body.expectedCatalogVersion),idempotencyKey:body.idempotencyKey,avoidSingle:body.avoidSingle===true});create=true;
 }
 }else return fail('not_found',404);
 if(!object(result)||typeof result.ok!=='boolean'||result.replayed!==undefined&&typeof result.replayed!=='boolean')throw new Error('Invalid backend result');
 if(!result.ok){
 if(currentEventId){
 if(result.code!=='not_found')throw new Error('Invalid backend error');
 return respond({ok:true,hold:null});
 }
 if(typeof result.code!=='string'||!errorCodes.has(result.code))throw new Error('Invalid backend error');
 const details:Obj={};if(Array.isArray(result.seatIds)&&result.seatIds.every(safeId))details.seatIds=result.seatIds;if(typeof result.holdId==='string'&&uuid.test(result.holdId))details.holdId=result.holdId;
 return fail(result.code,result.code==='not_found'?404:result.code==='invalid_request'||result.code==='seat_limit'?400:409,details);
 }
 if(eventPath?.[2]==='inventory')return respond(inventoryRecord(result));
 const hold=holdRecord(result.hold);
 if(currentEventId&&(hold.eventId!==currentEventId||hold.status!=='active'))throw new Error('Invalid current hold');
 return respond({ok:true,hold,replayed:result.replayed===true},create&&result.replayed!==true?201:200);
 }catch{try{config.log?.('hold_backend_failure',requestId);}catch{/* Logging cannot change the API failure response. */}return fail('backend_unavailable',502);}
 };
}
