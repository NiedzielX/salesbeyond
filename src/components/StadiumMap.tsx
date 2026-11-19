import {useEffect,useRef,useState} from 'react';
import {Plus,Minus,LocateFixed} from 'lucide-react';
import type {Seat,SectorId} from '../data/stadium';
import type {mountNativeMap} from '../integrations/nativeMap';
import FallbackMap from './FallbackMap';
type Props={sector:SectorId|null;seat:Seat|null;row:number;chosenIds:readonly string[];legacyOnly?:boolean;onSector:(id:SectorId)=>void;onSeat:(seat:Seat)=>void;onOverview:()=>void};
export default function StadiumMap(props:Props){
 const container=useRef<HTMLDivElement>(null),latest=useRef(props);latest.current=props;
 const map=useRef<ReturnType<typeof mountNativeMap>|null>(null);
 const [failed,setFailed]=useState(false),[loading,setLoading]=useState(true);
 useEffect(()=>{
 let cancelled=false;let current:ReturnType<typeof mountNativeMap>|null=null;
 const element=container.current!;
 void Promise.all([import('@seatlayer/core'),import('../data/fullChart'),import('../integrations/nativeMap')]).then(async([core,{createFullChart},{mountNativeMap}])=>{
  // Locale dictionaries are shipped by the package; no external API/event is involved.
  try{await core.loadLocale('pl');}catch{/* Map interaction remains available with the built-in dictionary. */}
  if(cancelled)return;core.setLocale('pl');
  const chart=createFullChart(props.legacyOnly);
  current=mountNativeMap(element,chart,{onSeat:seat=>latest.current.onSeat(seat),onSector:id=>latest.current.onSector(id),onOverview:()=>latest.current.onOverview()},core.createRenderer);
  map.current=current;current.update(latest.current);setLoading(false);
 }).catch(reason=>{if(cancelled)return;cancelled=true;current?.dispose();map.current=null;element.replaceChildren();console.warn('Map could not initialize; using the simplified plan.',reason);setLoading(false);setFailed(true);});
 return()=>{cancelled=true;if(map.current===current)map.current=null;current?.dispose();element.replaceChildren();};
 },[props.legacyOnly]);
 useEffect(()=>{map.current?.update(props);},[props.sector,props.seat,props.row,props.chosenIds]);
 if(failed)return <FallbackMap key={props.sector??'overview'} {...props}/>;
 return <div className="stadium-map">
  <div className="native-map" ref={container} aria-label="Plan stadionu z wyborem bloków i foteli"/>
  {loading&&<div className="scene-loading map-loading" role="status">Przygotowujemy pełny plan stadionu…</div>}
  <div className="map-tools" aria-label="Powiększenie planu"><button aria-label="Przybliż plan" disabled={loading} onClick={()=>map.current?.zoomIn()}><Plus size={16}/></button><button aria-label="Oddal plan" disabled={loading} onClick={()=>map.current?.zoomOut()}><Minus size={16}/></button><button aria-label="Wyśrodkuj plan" disabled={loading} onClick={()=>map.current?.fit()}><LocateFixed size={16}/></button></div>
  <div className="map-caption" role="status">{props.seat?`Blok ${props.seat.sectorId} · rząd ${props.seat.row} · miejsce ${props.seat.number}`:props.sector?`Blok ${props.sector} · rząd ${props.row}`:'Wybierz blok na stadionie lub trybunę w panelu'}</div>
 </div>;
}
