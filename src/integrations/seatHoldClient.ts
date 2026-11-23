export type HoldStatus = 'active'|'released'|'expired';
export type HoldItem = {seatId:string;priceMinor:number};
export type SeatHold = {id:string;eventId:string;status:HoldStatus;expiresAt:string;version:number;currency:string;subtotalMinor:number;items:HoldItem[]};
export type HoldInventorySeat = {seatId:string;sectionId:string;row:number;number:number;priceMinor:number;status:'available'|'blocked'|'sold'|'closed'|'held'};
export type HoldInventorySection = {sectionId:string;total:number;available:number;minPriceMinor:number|null};
export type SeatInventory = {eventId:string;status:'open'|'paused'|'closed'|'cancelled';version:number;currency:string;maxSeats:number;holdSeconds:number;preventSingle:boolean;sections?:HoldInventorySection[];seats?:HoldInventorySeat[]};
export type SeatHoldErrorCode='backend_not_configured'|'backend_unavailable'|'session_required'|'invalid_request'|'not_found'|'event_closed'|'catalog_changed'|'seat_limit'|'active_hold_exists'|'held'|'unavailable'|'single_seat_gap'|'idempotency_key_reused'|'rate_limited'|'origin_not_allowed'|'invalid_response'|'network_error'|string;
export class SeatHoldClientError extends Error {
 readonly code:SeatHoldErrorCode;
 readonly status:number|null;
 readonly seatIds?:string[];
 readonly holdId?:string;
 constructor(code:SeatHoldErrorCode,status:number|null,details:{seatIds?:string[];holdId?:string}={}){
  super(code==='backend_not_configured'?'Usługa miejsc nie jest skonfigurowana.':code==='backend_unavailable'||code==='network_error'?'Usługa miejsc jest chwilowo niedostępna.':code==='invalid_response'?'Odpowiedź usługi miejsc jest nieprawidłowa.':`Operacja miejsc nie powiodła się (${code}).`);
  this.name='SeatHoldClientError';this.code=code;this.status=status;
  if(details.seatIds)this.seatIds=[...details.seatIds];if(details.holdId)this.holdId=details.holdId;
 }
}
export type CreateSeatHoldInput={eventId:string;seatIds:string[];expectedCatalogVersion:number;idempotencyKey:string;avoidSingle?:boolean};
type Fetcher=(input:RequestInfo|URL,init?:RequestInit)=>Promise<Response>;
type Obj=Record<string,unknown>;
const safeId=(value:unknown):value is string=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(value);
const uuid=(value:unknown):value is string=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const integer=(value:unknown,min=0)=>Number.isSafeInteger(value)&&Number(value)>=min;
const object=(value:unknown):value is Obj=>!!value&&typeof value==='object'&&!Array.isArray(value);
const statuses=['available','blocked','sold','closed','held'] as const;
const errorCode=(value:unknown):string=>typeof value==='string'&&/^[a-z][a-z0-9_]{0,63}$/.test(value)?value:'backend_unavailable';
function invalidResponse():never{throw new SeatHoldClientError('invalid_response',null);}
function validateHold(value:unknown):SeatHold{
 if(!object(value)||!uuid(value.id)||!safeId(value.eventId)||(typeof value.status!=='string'||!['active','released','expired'].includes(value.status))||typeof value.expiresAt!=='string'||!Number.isFinite(Date.parse(value.expiresAt))||!integer(value.version,1)||typeof value.currency!=='string'||!/^[A-Z]{3}$/.test(value.currency)||!integer(value.subtotalMinor)||!Array.isArray(value.items)||value.items.length<1||value.items.length>10)invalidResponse();
 const items=value.items.map(item=>{if(!object(item)||!safeId(item.seatId)||!integer(item.priceMinor))invalidResponse();return {seatId:item.seatId,priceMinor:Number(item.priceMinor)};});
 if(new Set(items.map(item=>item.seatId)).size!==items.length||items.reduce((sum,item)=>sum+item.priceMinor,0)!==value.subtotalMinor)invalidResponse();
 return {id:value.id,eventId:value.eventId,status:value.status as HoldStatus,expiresAt:value.expiresAt,version:Number(value.version),currency:value.currency,subtotalMinor:Number(value.subtotalMinor),items};
}
function validateInventory(value:unknown,eventId:string):SeatInventory{
 if(!object(value)||value.eventId!==eventId||(typeof value.status!=='string'||!['open','paused','closed','cancelled'].includes(value.status))||!integer(value.version,1)||typeof value.currency!=='string'||!/^[A-Z]{3}$/.test(value.currency)||!integer(value.maxSeats)||Number(value.maxSeats)>10||!integer(value.holdSeconds)||typeof value.preventSingle!=='boolean')invalidResponse();
 const result:SeatInventory={eventId,status:value.status as SeatInventory['status'],version:Number(value.version),currency:value.currency,maxSeats:Number(value.maxSeats),holdSeconds:Number(value.holdSeconds),preventSingle:value.preventSingle};
 if(Array.isArray(value.sections)){
  if(value.sections.length>1000)invalidResponse();
  result.sections=value.sections.map(section=>{if(!object(section)||!safeId(section.sectionId)||!integer(section.total)||!integer(section.available)||Number(section.available)>Number(section.total)||section.minPriceMinor!==null&&!integer(section.minPriceMinor))invalidResponse();return {sectionId:section.sectionId,total:Number(section.total),available:Number(section.available),minPriceMinor:section.minPriceMinor===null?null:Number(section.minPriceMinor)};});
 }else if(Array.isArray(value.seats)){
  if(value.seats.length>10000)invalidResponse();
  result.seats=value.seats.map(seat=>{if(!object(seat)||!safeId(seat.seatId)||!safeId(seat.sectionId)||!integer(seat.row)||!integer(seat.number)||!integer(seat.priceMinor)||(typeof seat.status!=='string'||!statuses.includes(seat.status as typeof statuses[number])))invalidResponse();return {seatId:seat.seatId,sectionId:seat.sectionId,row:Number(seat.row),number:Number(seat.number),priceMinor:Number(seat.priceMinor),status:seat.status as HoldInventorySeat['status']};});
 }else invalidResponse();
 return result;
}
function assertExactSeats(hold:SeatHold,requested:string[],eventId:string,version:number){
 const returned=hold.items.map(item=>item.seatId);
 if(hold.eventId!==eventId||hold.version!==version||returned.length!==requested.length||new Set(returned).size!==returned.length||requested.some(id=>!returned.includes(id)))invalidResponse();
}

/** Same-origin gateway client. It never persists session credentials or retries mutations. */
export function createSeatHoldClient(options:{fetcher?:Fetcher;endpoint?:string}={}){
 const fetcher=options.fetcher??fetch,endpoint=options.endpoint??'/api/seat-api';
 if(!/^\/[A-Za-z0-9/_-]+$/.test(endpoint)||endpoint.startsWith('//'))throw new SeatHoldClientError('invalid_request',null);
 let sessionReady=false,sessionFlight:Promise<void>|null=null;
 function url(op:string,params:Record<string,string|undefined>={}){
  const query=new URLSearchParams({op});for(const [key,value] of Object.entries(params))if(value!==undefined)query.set(key,value);
  return `${endpoint}?${query.toString()}`;
 }
 async function request(op:string,params:Record<string,string|undefined>={},body?:unknown,method?:'GET'|'POST'|'DELETE'){
  let response:Response;
  try{response=await fetcher(url(op,params),{method:method??(body===undefined?'GET':'POST'),credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(12000),...(body===undefined?{}:{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})});}
  catch{throw new SeatHoldClientError('network_error',null);}
  let payload:unknown;try{payload=await response.json();}catch{if(response.ok)invalidResponse();throw new SeatHoldClientError('backend_unavailable',response.status);}
  if(!response.ok){
   if(!object(payload)||!object(payload.error))throw new SeatHoldClientError('backend_unavailable',response.status);
   const details:{seatIds?:string[];holdId?:string}={};
   if(Array.isArray(payload.error.seatIds)&&payload.error.seatIds.every(safeId))details.seatIds=[...payload.error.seatIds];
   if(uuid(payload.error.holdId))details.holdId=payload.error.holdId;
   const code=errorCode(payload.error.code);if(code==='session_required')sessionReady=false;throw new SeatHoldClientError(code,response.status,details);
  }
  if(!object(payload)||payload.ok!==true)invalidResponse();
  return payload;
 }
 function ensureSession():Promise<void>{
  if(sessionReady)return Promise.resolve();if(sessionFlight)return sessionFlight;
  sessionFlight=request('session').then(()=>{sessionReady=true;}).finally(()=>{sessionFlight=null;});return sessionFlight;
 }
 return {
  async status(){
   const value=await request('status');if(typeof value.configured!=='boolean'||!['service','demo'].includes(String(value.mode))||(value.configured&&value.mode!=='service')||(!value.configured&&value.mode!=='demo'))invalidResponse();
   return {configured:value.configured,mode:value.mode as 'service'|'demo'};
  },
  async inventory(eventId:string,sectionId?:string){
   if(!safeId(eventId)||sectionId!==undefined&&!safeId(sectionId))throw new SeatHoldClientError('invalid_request',null);
   const value=await request('inventory',{eventId,sectionId}),inventory=validateInventory(value,eventId);
   if(sectionId!==undefined&&(!inventory.seats||inventory.seats.some(seat=>seat.sectionId!==sectionId))||sectionId===undefined&&!inventory.sections)invalidResponse();return inventory;
  },
  async create(input:CreateSeatHoldInput){
   if(!safeId(input.eventId)||!Array.isArray(input.seatIds)||input.seatIds.length<1||input.seatIds.length>10||!input.seatIds.every(safeId)||new Set(input.seatIds).size!==input.seatIds.length||!integer(input.expectedCatalogVersion,1)||typeof input.idempotencyKey!=='string'||!/^[A-Za-z0-9_-]{8,128}$/.test(input.idempotencyKey)||input.avoidSingle!==undefined&&typeof input.avoidSingle!=='boolean')throw new SeatHoldClientError('invalid_request',null);
   const snapshot={...input,seatIds:[...input.seatIds]};
   await ensureSession();
   const value=await request('create',{eventId:snapshot.eventId},{seatIds:snapshot.seatIds,expectedCatalogVersion:snapshot.expectedCatalogVersion,idempotencyKey:snapshot.idempotencyKey,...(snapshot.avoidSingle===undefined?{}:{avoidSingle:snapshot.avoidSingle})});
   const hold=validateHold(value.hold);assertExactSeats(hold,snapshot.seatIds,snapshot.eventId,snapshot.expectedCatalogVersion);return hold;
  },
  async current(eventId:string):Promise<SeatHold|null>{
   if(!safeId(eventId)||eventId.length>80)throw new SeatHoldClientError('invalid_request',null);
   try{
    const value=await request('current',{eventId});if(value.hold===null)return null;const hold=validateHold(value.hold);
    if(hold.eventId!==eventId||hold.status!=='active')invalidResponse();
    return hold;
   }catch(error){
    if(error instanceof SeatHoldClientError&&(
     error.status===401&&error.code==='session_required'||error.status===404&&error.code==='not_found'
    ))return null;
    throw error;
   }
  },
  async get(holdId:string){
   if(!uuid(holdId))throw new SeatHoldClientError('invalid_request',null);await ensureSession();
   const value=await request('hold',{holdId}),hold=validateHold(value.hold);if(hold.id!==holdId)invalidResponse();return hold;
  },
  async release(holdId:string){
   if(!uuid(holdId))throw new SeatHoldClientError('invalid_request',null);await ensureSession();
   const value=await request('hold',{holdId},undefined,'DELETE'),hold=validateHold(value.hold);if(hold.id!==holdId||!['released','expired'].includes(hold.status))invalidResponse();return hold;
  },
 };
}
