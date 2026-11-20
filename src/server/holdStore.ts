export type CreateHold={eventId:string;sessionHash:string;seatIds:string[];expectedVersion:number;idempotencyKey:string;avoidSingle:boolean};
export type HoldStore={inventory:(eventId:string,sectionId:string|null)=>Promise<unknown>;create:(input:CreateHold)=>Promise<unknown>;current:(eventId:string,sessionHash:string)=>Promise<unknown>;get:(holdId:string,sessionHash:string)=>Promise<unknown>;release:(holdId:string,sessionHash:string)=>Promise<unknown>;consumeRate:(key:string)=>Promise<unknown>};
/** Server-only adapter. Never pass the service key through Vite environment variables. */
export function createSupabaseHoldStore(config:{url:string;serviceKey:string;fetcher?:typeof fetch}):HoldStore{
 const url=new URL(config.url);
 if(url.protocol!=='https:'||!/^[-a-z0-9]+\.supabase\.co$/i.test(url.hostname)||url.username||url.password||url.search||url.hash||!config.serviceKey)throw new Error('Invalid backend configuration');
 const fetcher=config.fetcher??fetch;
 async function rpc(name:string,body:Record<string,unknown>){
 const response=await fetcher(new URL(`/rest/v1/rpc/${name}`,url),{method:'POST',headers:{'Content-Type':'application/json',apikey:config.serviceKey,Authorization:`Bearer ${config.serviceKey}`},body:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw new Error('Inventory backend request failed');
 return response.json() as Promise<unknown>;
 }
 return {
 inventory:(eventId,sectionId)=>rpc('sb_inventory',{p_event_id:eventId,p_section_id:sectionId}),
 create:input=>rpc('sb_create_hold',{p_event_id:input.eventId,p_session_hash:input.sessionHash,p_seat_ids:input.seatIds,p_expected_version:input.expectedVersion,p_idempotency_key:input.idempotencyKey,p_avoid_single:input.avoidSingle}),
 current:(eventId,sessionHash)=>rpc('sb_current_hold',{p_event_id:eventId,p_session_hash:sessionHash}),
 get:(holdId,sessionHash)=>rpc('sb_get_hold',{p_hold_id:holdId,p_session_hash:sessionHash}),
 release:(holdId,sessionHash)=>rpc('sb_release_hold',{p_hold_id:holdId,p_session_hash:sessionHash}),
 consumeRate:key=>rpc('sb_consume_hold_request',{p_key:key,p_limit:20}),
 };
}
