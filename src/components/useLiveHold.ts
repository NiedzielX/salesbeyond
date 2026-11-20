import {useEffect,useRef,useState} from 'react';
import {createSeatHoldClient} from '../integrations/seatHoldClient';
import {createLiveHoldFlow,type LiveHoldState} from '../domain/liveHold';
import type {Seat} from '../data/stadium';
export function useLiveHold(catalog:readonly Seat[],enabled:boolean){
 const flow=useRef<ReturnType<typeof createLiveHoldFlow>|null>(null);
 const [mode,setMode]=useState<'loading'|'demo'|'service'|'unavailable'>(enabled?'loading':'demo');
 const [state,setState]=useState<LiveHoldState|null>(null);
 useEffect(()=>{
  if(!enabled)return;
  let current=true;let dispose:(()=>void)|undefined;
  const client=createSeatHoldClient();
  void client.status().then(status=>{
   if(!current)return;
   if(!status.configured){setMode('demo');return;}
   const storage={getItem:(key:string)=>window.localStorage.getItem(key),setItem:(key:string,value:string)=>window.localStorage.setItem(key,value),removeItem:(key:string)=>window.localStorage.removeItem(key)};
   const owned=createLiveHoldFlow({client,catalog,eventId:'enea-demo',storage});flow.current=owned;
   const update=()=>{if(current)setState(owned.getState());};
   const unsubscribe=owned.subscribe(update);dispose=()=>{unsubscribe();owned.dispose();};
   setMode('service');update();void owned.restore();
  }).catch(()=>{if(current)setMode('unavailable');});
  return()=>{current=false;dispose?.();flow.current=null;};
 },[catalog,enabled]);
 useEffect(()=>{
  if(mode!=='service')return;
  const refresh=()=>{const owned=flow.current,current=owned?.getState();if(current?.phase==='active'&&!current.operation)void owned?.refresh();};
  const interval=window.setInterval(refresh,15000);
  window.addEventListener('focus',refresh);
  return()=>{clearInterval(interval);window.removeEventListener('focus',refresh);};
 },[mode]);
 return {mode,state,quote:(ids:readonly string[],avoidSingle:boolean)=>flow.current?.quote(ids,avoidSingle),create:()=>flow.current?.create(),retry:()=>flow.current?.retry(),refresh:()=>flow.current?.refresh(),release:()=>flow.current?.release()};
}
