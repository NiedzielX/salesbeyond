import type {ISeatmapRenderer,RendererOptions} from '@seatlayer/core';
import type {FullChart} from '../data/fullChart.ts';
import {seatsInRow,type Seat,type SectorId} from '../data/stadium.ts';
type Host={onSeat:(seat:Seat)=>void;onSector:(id:SectorId)=>void;onOverview:()=>void};
type Selection={sector:SectorId|null;seat:Seat|null;row:number};
export function mountNativeMap(container:HTMLDivElement,chart:FullChart,host:Host,create:(container:HTMLDivElement,opts:RendererOptions)=>ISeatmapRenderer){
 let live=true,commands=1;let renderer:ISeatmapRenderer|null=null;let previous:Selection|null=null;
 const command=<T>(fn:()=>T)=>{commands++;try{return fn();}finally{commands--;}};
 const restore=(selection:Selection)=>{
 renderer?.clearSelection();const id=selection.seat?chart.nativeByDomain.get(selection.seat.id):null;
 if(id){renderer?.select?.([id]);renderer?.setSelectionFocus?.(id);}else renderer?.setSelectionFocus?.(null);
 };
 const pick=(id:string)=>{if(!live||commands)return;const seat=chart.domainByNative.get(id);if(!seat)return;command(()=>renderer?.clearSelection());host.onSeat(seat);};
 try{
 renderer=create(container,{maxSelection:2,selectableStatuses:['free','booked'],loadingReveal:'progressive',portraitFitCrop:false,
 onSeatsRevealed:()=>{if(live&&!commands&&previous)command(()=>restore(previous!));},
 onSelect:seat=>pick(seat.id),onDeselect:seat=>pick(seat.id),
 onSectionTap:id=>{if(live&&!commands&&chart.doc.objects.some(o=>o.type==='section'&&o.id===id))host.onSector(id);},
 onBackdropTap:()=>{if(live&&!commands)host.onOverview();},
 seatPriceLabel:seat=>{const s=chart.domainByNative.get(seat.id);return s?`${s.price} zł · demo`:null;},
 });
 renderer.setChart(chart.doc);
 const occupied=[...chart.domainByNative].filter(([,seat])=>!seat.available).map(([id])=>id);
 renderer.setStatus(occupied,'booked');
 }catch(error){live=false;try{renderer?.destroy();}catch{/* Preserve the setup failure; the host clears the abandoned DOM. */}throw error;}finally{commands--;}
 const current=renderer;
 return {
 update(selection:Selection){if(!live)return;command(()=>{
 if(previous?.sector!==selection.sector){if(selection.sector)current.focusSection?.(selection.sector);else current.overview?.();}
 else if(selection.sector&&previous?.row!==selection.row)current.focusSeats?.(seatsInRow(selection.sector,selection.row).map(s=>chart.nativeByDomain.get(s.id)!).filter(Boolean));
 restore(selection);
 previous={...selection};
 });},
 zoomIn(){if(live)current.zoomIn();},zoomOut(){if(live)current.zoomOut();},fit(){if(live)current.zoomToFit();},
 dispose(){if(!live)return;live=false;try{current.destroy();}catch{/* Host DOM cleanup/fallback must remain reachable. */}},
 };
}
