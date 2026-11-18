import {useEffect,useRef,useState} from 'react';
import type {Venue3DHandle} from '@seatlayer/core/view3d';
import type {Seat,SectorId} from '../data/stadium';
import type {Selection} from '../domain/selection';
import {domainSeat} from '../data/venueChart';
import {createVenueNavigator} from '../integrations/localVenue';
import {watchContextLoss} from './contextLoss';
type Props=Selection&{roof:boolean;reset:number;onSector:(id:SectorId)=>void;onSeat:(seat:Seat)=>void;onOverview:()=>void;onReady:(arrived:boolean)=>void;onUnavailable:()=>void;onPreview:(url:string|null)=>void};
export default function LocalVenue(props:Props){
 const host=useRef<HTMLDivElement>(null);
 const latest=useRef(props);latest.current=props;
 const navigation=useRef<ReturnType<typeof createVenueNavigator>|null>(null);
 const [mounted,setMounted]=useState(0);
 const commanding=useRef(false);
 useEffect(()=>{
  const element=host.current!;let canceled=false;let renderer:Venue3DHandle|null=null;
  let observer:ResizeObserver|null=null;let releaseContext:(()=>void)|null=null;
  const fail=()=>{if(!canceled)latest.current.onUnavailable();};
  const probe=document.createElement('canvas');
  const context=probe.getContext('webgl2');
  if(!context){console.info('Local stadium: WebGL2 is unavailable.');fail();return;}
  context.getExtension('WEBGL_lose_context')?.loseContext();
  void Promise.all([import('../integrations/localScene'),import('@seatlayer/core/view3d')]).then(([{prepareLocalScene},{mountVenue3D}])=>{
   if(canceled)return;
   const {doc,seats,prepared}=prepareLocalScene(props.roof);
   renderer=mountVenue3D(element,{doc,seats,prepared,estimate:false},
   {arriveAtSeatEye:true,seatViewStops:false,portraitOverviewCrop:false,skipInitialOverviewAnimation:true,
    chrome:{caption:false,seatStepper:false,controlDock:false},
    lookAroundHint:'Przeciągnij, aby rozejrzeć się z wybranego miejsca.',
    seatViewCaption:id=>{const seat=domainSeat(id);return seat?`Sektor ${seat.sectorId} · rząd ${seat.row} · miejsce ${seat.number}`:'';},
    onSeatPick:id=>{const seat=domainSeat(id);if(seat?.available)latest.current.onSeat(seat);},
    onSectionFocusChange:id=>{
     if(commanding.current)return;
     if(id==='101'||id==='102'||id==='103'){
      if(latest.current.sector!==id||latest.current.view!=='sector')latest.current.onSector(id);
     }else if(id===null&&latest.current.view!=='overview')latest.current.onOverview();
    },
    onViewTargetChange:id=>{
     if(commanding.current||!id)return;const seat=domainSeat(id);
     if(seat?.available&&latest.current.seat?.id!==seat.id)latest.current.onSeat(seat);
    },
   });
   if(canceled){renderer.dispose();return;}
   navigation.current=createVenueNavigator(renderer,arrived=>latest.current.onReady(arrived),url=>latest.current.onPreview(url),fail);
   const canvas=element.querySelector('canvas');
   if(!canvas){navigation.current.dispose();navigation.current=null;fail();return;}
   canvas.setAttribute('aria-label','Interaktywny model stadionu. Wybór sektora i miejsca dostępny również w panelu.');
   releaseContext=watchContextLoss(canvas,fail);
   observer=new ResizeObserver(()=>renderer?.resize());observer.observe(element);
   setMounted(value=>value+1);
  }).catch(error=>{if(!canceled){console.error('Local stadium could not mount',error);fail();}});
  return()=>{canceled=true;observer?.disconnect();releaseContext?.();navigation.current?.dispose();navigation.current=null;element.replaceChildren();};
 },[props.roof]);
 useEffect(()=>{
  const navigator=navigation.current;if(!navigator)return;
  commanding.current=true;
  void navigator.navigate({sector:props.sector,row:props.row,seat:props.seat,view:props.view});
  commanding.current=false;
 },[props.sector,props.row,props.seat,props.view,props.reset,mounted]);
 return <div className="local-venue" ref={host} onKeyDownCapture={event=>{
  if(event.key==='Escape'&&latest.current.view!=='overview'){event.preventDefault();event.stopPropagation();latest.current.onOverview();}
 }}/>
}
