import type {Venue3DHandle} from '@seatlayer/core/view3d';
import type {Selection} from '../domain/selection.ts';
import {venueRowId,venueSeatId} from '../data/venueChart.ts';
export type VenueHandle=Pick<Venue3DHandle,'focusOverview'|'focusSection'|'focusRow'|'flyToSeat'|'setSelection'|'captureImage'|'seatViewStop'|'dispose'>;

/** One navigation owner. Superseded flights cannot publish a previous seat's image. */
export function createVenueNavigator(handle:VenueHandle,onReady:(arrived:boolean)=>void,onPreview:(url:string|null)=>void,onError:()=>void){
 let generation=0,disposed=false;
 let previous:Selection|null=null;
 return {
  async navigate(selection:Selection){
   if(disposed)return;
   const request=++generation;
   const from=previous;previous=selection;
   onPreview(null);
   let arrived=false;
   try{
    if(selection.view==='seat'&&selection.seat){
     const id=venueSeatId(selection.seat);
     handle.setSelection([id]);
     await handle.flyToSeat(id);
     if(disposed||request!==generation)return;
     arrived=handle.seatViewStop()==='seat';
     onPreview(arrived?handle.captureImage(640):null);
    }else{
     handle.setSelection([]);
     if(selection.view==='sector'&&selection.sector){
      if(from?.view==='sector'&&from.sector===selection.sector&&from.row!==selection.row)handle.focusRow(venueRowId(selection.sector,selection.row));
      else handle.focusSection(selection.sector);
     }else handle.focusOverview();
    }
    if(!disposed&&request===generation)onReady(arrived);
   }catch{if(!disposed&&request===generation)onError();}
  },
  dispose(){if(disposed)return;disposed=true;generation++;handle.dispose();},
 };
}
