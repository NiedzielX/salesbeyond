import {createHoldApi,holdRateKey} from './holdApi.ts';
import {createSupabaseHoldStore} from './holdStore.ts';
type BackendEnv=Readonly<Record<string,string|undefined>>;
/** Runtime boundary only; no database credentials are read by the client bundle. */
export function createHoldRuntime(env:BackendEnv,fetcher?:typeof fetch){
 let origin='https://salesbeyond.vercel.app',validOrigin=true;
 try{const candidate=new URL(env.APP_ORIGIN??origin);if(candidate.protocol!=='https:')validOrigin=false;else origin=candidate.origin;}catch{validOrigin=false;}
 let store=null;const rateSecret=env.HOLD_RATE_LIMIT_SECRET;
 if(env.SEAT_HOLDS_ENABLED==='1'&&validOrigin&&env.SUPABASE_URL&&env.SUPABASE_SERVICE_ROLE_KEY&&rateSecret&&rateSecret.length>=32){
 try{store=createSupabaseHoldStore({url:env.SUPABASE_URL,serviceKey:env.SUPABASE_SERVICE_ROLE_KEY,fetcher});}catch{/* Invalid configuration remains unavailable. */}
 }
 const configured=store!==null;
 const api=createHoldApi({store,origin,rateKey:async request=>{
 // Vercel overwrites this header at its edge. An additional proxy needs its own trust review.
 const address=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
 if(!address||!rateSecret)throw new Error('Trusted client address unavailable');return holdRateKey(address,rateSecret);
 },log:(code,requestId)=>console.error('Seat hold backend failure',{code,requestId})});
 return async(request:Request)=>{
 const url=new URL(request.url),op=url.searchParams.get('op');
 if(url.pathname==='/api/seat-api'&&op==='status'&&request.method!=='GET')return Response.json({ok:false,error:{code:'method_not_allowed'}},{status:405,headers:{Allow:'GET','Cache-Control':'no-store'}});
 if(url.pathname==='/api/seat-api'&&op==='status')return Response.json({ok:true,configured,mode:configured?'service':'demo'},{headers:{'Cache-Control':'no-store'}});
 if(url.pathname==='/api/seat-api'){
 const eventId=url.searchParams.get('eventId')??'',holdId=url.searchParams.get('holdId')??'';
 if(op==='session')url.pathname='/api/seat-session';
 else if(['inventory','create'].includes(op??'')&&/^[A-Za-z0-9_-]{1,80}$/.test(eventId))url.pathname=`/api/events/${eventId}/${op==='create'?'holds':'inventory'}`;
 else if(op==='hold'&&/^[0-9a-f-]{36}$/i.test(holdId))url.pathname=`/api/holds/${holdId}`;
 else return Response.json({ok:false,error:{code:'not_found'}},{status:404,headers:{'Cache-Control':'no-store'}});
 url.searchParams.delete('op');url.searchParams.delete('eventId');url.searchParams.delete('holdId');
 return api(new Request(url,request));
 }
 return api(request);
 };
}
