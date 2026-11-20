import type {ISeatmapRenderer,RendererOptions} from '@seatlayer/core';
import {basketLimit} from '../domain/basket.ts';
import type {FullChart} from '../data/fullChart.ts';
import {seatsInRow,type Seat,type SectorId} from '../data/stadium.ts';
type Host={onSeat:(seat:Seat)=>void;onSector:(id:SectorId)=>void;onOverview:()=>void};
type Selection={sector:SectorId|null;seat:Seat|null;row:number;focusRequest?:number;chosenIds?:readonly string[];inventory?:ReadonlyMap<string,Seat&{ownedHold?:boolean}>};
export function mountNativeMap(container:HTMLDivElement,chart:FullChart,host:Host,create:(container:HTMLDivElement,opts:RendererOptions)=>ISeatmapRenderer){
 let live=true,commands=1;let renderer:ISeatmapRenderer|null=null;let previous:Selection|null=null;
 let inventory:ReadonlyMap<string,Seat&{ownedHold?:boolean}>=new Map();
 const statusOf=(id:string,source:ReadonlyMap<string,Seat&{ownedHold?:boolean}>)=>source.get(id)?.available??chart.domainByNative.get(chart.nativeByDomain.get(id)!)?.available??false;
 const updateInventory=(next:ReadonlyMap<string,Seat&{ownedHold?:boolean}>)=>{
  const changed:string[]=[];
  for(const id of new Set([...inventory.keys(),...next.keys()]))if(statusOf(id,inventory)!==statusOf(id,next))changed.push(id);
  inventory=next;
  const nativeChanged=changed.map(id=>chart.nativeByDomain.get(id)).filter((id):id is string=>!!id);
  for(const status of ['free','booked'] as const){
   const ids=nativeChanged.filter(id=>statusOf(chart.domainByNative.get(id)!.id,inventory)?status==='free':status==='booked');
   if(ids.length)renderer?.setStatus(ids,status);
  }
 };
 const command=<T>(fn:()=>T)=>{commands++;try{return fn();}finally{commands--;}};
 const restore=(selection:Selection)=>{
 renderer?.clearSelection();const id=selection.seat?chart.nativeByDomain.get(selection.seat.id):null;
 const ids=(selection.chosenIds??[]).filter(domainId=>inventory.get(domainId)?.ownedHold||statusOf(domainId,inventory)).map(domainId=>chart.nativeByDomain.get(domainId)).filter((nativeId):nativeId is string=>!!nativeId);
 if(id)ids.push(id);
 if(ids.length)renderer?.select?.([...new Set(ids)]);
 renderer?.setSelectionFocus?.(id??null);
 };
 const pick=(id:string)=>{if(!live||commands)return;const canonical=chart.domainByNative.get(id);if(!canonical)return;command(()=>renderer?.clearSelection());host.onSeat(inventory.get(canonical.id)??canonical);};
 try{
 renderer=create(container,{maxSelection:basketLimit*2+2,selectableStatuses:['free','booked'],loadingReveal:'progressive',portraitFitCrop:false,
 onSeatsRevealed:()=>{if(live&&!commands&&previous)command(()=>restore(previous!));},
 onSelect:seat=>pick(seat.id),onDeselect:seat=>pick(seat.id),
 onSectionTap:id=>{if(live&&!commands&&chart.doc.objects.some(o=>o.type==='section'&&o.id===id))host.onSector(id);},
 onBackdropTap:()=>{if(live&&!commands)host.onOverview();},
 seatPriceLabel:seat=>{const s=chart.domainByNative.get(seat.id);return s?`${inventory.get(s.id)?.price??s.price} zł · demo`:null;},
 });
 renderer.setChart(chart.doc);
 const occupied=[...chart.domainByNative].filter(([,seat])=>!seat.available).map(([id])=>id);
 renderer.setStatus(occupied,'booked');
 }catch(error){live=false;try{renderer?.destroy();}catch{/* Preserve the setup failure; the host clears the abandoned DOM. */}throw error;}finally{commands--;}
 const current=renderer;
 return {
 update(selection:Selection){if(!live)return;command(()=>{
 updateInventory(selection.inventory??new Map());
 const requestedSeat=selection.seat&&(selection.focusRequest??0)>0&&(previous?.focusRequest??0)!==selection.focusRequest?chart.nativeByDomain.get(selection.seat.id):null;
 if(requestedSeat)current.focusSeats?.([requestedSeat]);
 else if(previous?.sector!==selection.sector){if(selection.sector)current.focusSection?.(selection.sector);else current.overview?.();}
 else if(selection.sector&&previous?.row!==selection.row)current.focusSeats?.(seatsInRow(selection.sector,selection.row).map(s=>chart.nativeByDomain.get(s.id)!).filter(Boolean));
 restore(selection);
 previous={...selection,chosenIds:[...(selection.chosenIds??[])]};
 });},
 zoomIn(){if(live)current.zoomIn();},zoomOut(){if(live)current.zoomOut();},fit(){if(live)current.zoomToFit();},
 dispose(){if(!live)return;live=false;try{current.destroy();}catch{/* Host DOM cleanup/fallback must remain reachable. */}},
 };
}
