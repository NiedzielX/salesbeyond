import {useEffect,useRef} from 'react';
import type {Seat,SectorId} from '../data/stadium';
import type {Selection} from '../domain/selection';
import {domainSeat} from '../data/venueChart';
import {createVenueSession} from '../integrations/venueSession';
import {watchContextLoss} from './contextLoss';
type Props=Selection&{roof:boolean;reset:number;onSector:(id:SectorId)=>void;onSeat:(seat:Seat)=>void;onOverview:()=>void;onReady:(arrived:boolean)=>void;onUnavailable:()=>void;onPreview:(url:string|null)=>void};
export default function LocalVenue(props:Props){
 const host=useRef<HTMLDivElement>(null);
 const latest=useRef(props);latest.current=props;
 const session=useRef<ReturnType<typeof createVenueSession>|null>(null);
 useEffect(()=>{
  const element=host.current!;
  const probe=document.createElement('canvas'),context=probe.getContext('webgl2');
  if(!context){console.info('Local stadium: WebGL2 is unavailable.');latest.current.onUnavailable();return;}
  context.getExtension('WEBGL_lose_context')?.loseContext();
  const current=createVenueSession({
   revision:latest.current.reset,
   host:{selection:()=>latest.current,onSeat:seat=>latest.current.onSeat(seat),onSector:id=>latest.current.onSector(id),onOverview:()=>latest.current.onOverview()},
   load:async()=>{
    const [{prepareLocalScene},{mountVenue3D}]=await Promise.all([import('../integrations/localScene'),import('@seatlayer/core/view3d')]);
    return handlers=>{
     const {doc,seats,prepared}=prepareLocalScene(props.roof);
     return mountVenue3D(element,{doc,seats,prepared,estimate:false},
      {arriveAtSeatEye:true,seatViewStops:false,portraitOverviewCrop:false,skipInitialOverviewAnimation:true,
       chrome:{caption:false,seatStepper:false,controlDock:false},
       lookAroundHint:'Przeciągnij, aby rozejrzeć się z wybranego miejsca.',
       seatViewCaption:id=>{const seat=domainSeat(id);return seat?`Sektor ${seat.sectorId} · rząd ${seat.row} · miejsce ${seat.number}`:'';},
       // Only explicit picks choose seats; camera notifications may arrive after cancellation.
       ...handlers,
      });
    };
   },
   watchContext:(_venue,lost)=>{
    const canvas=element.querySelector('canvas');if(!canvas)throw new Error('Venue did not create a canvas');
    canvas.setAttribute('aria-label','Interaktywny model stadionu. Wybór sektora i miejsca dostępny również w panelu.');
    return watchContextLoss(canvas,lost);
   },
   observeResize:venue=>{
    let observing=true;
    const observer=new ResizeObserver(()=>{if(observing)venue.resize();});
    try{observer.observe(element);}catch(reason){observing=false;observer.disconnect();throw reason;}
    return()=>{observing=false;observer.disconnect();};
   },
   onReady:arrived=>latest.current.onReady(arrived),onPreview:url=>latest.current.onPreview(url),
   onUnavailable:reason=>{console.error('Local stadium could not run',reason);latest.current.onUnavailable();},
   onCleanupError:reason=>console.warn('Local stadium cleanup failed',reason),
  });
  session.current=current;
  return()=>{if(session.current===current)session.current=null;current.dispose();element.replaceChildren();};
 },[props.roof]);
 useEffect(()=>{session.current?.update({sector:props.sector,row:props.row,seat:props.seat,view:props.view},props.reset);},[props.sector,props.row,props.seat,props.view,props.reset]);
 return <div className="local-venue" ref={host} onKeyDownCapture={event=>{
  if(event.key==='Escape'&&latest.current.view!=='overview'){event.preventDefault();event.stopPropagation();latest.current.onOverview();}
 }}/>
}
