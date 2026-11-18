import type {Selection} from '../domain/selection.ts';
import type {Seat,SectorId} from '../data/stadium.ts';
import {domainSeat} from '../data/venueChart.ts';
type Host={selection:()=>Selection;onSeat:(seat:Seat)=>void;onSector:(id:SectorId)=>void;onOverview:()=>void};

/** Only explicit seat picks change the chosen seat. Camera-target notifications can outlive a canceled flight. */
export function createVenueEvents(host:Host){
 let active=true,commands=0,pending:string|null=null,lastState='';
 const selection=()=>{
  const state=host.selection();const signature=`${state.view}:${state.sector}:${state.row}:${state.seat?.id}`;
  if(signature!==lastState){pending=null;lastState=signature;}
  return state;
 };
 const emit=(key:string,action:()=>void)=>{if(pending===key)return;pending=key;action();};
 const handlers={
  onSeatPick(id:string){
   if(!active||commands)return;const seat=domainSeat(id);if(!seat?.available)return;
   const state=selection();if(state.view==='seat'&&state.seat?.id===seat.id)return;
   emit(`seat:${seat.id}`,()=>host.onSeat(seat));
  },
  onSectionFocusChange(id:string|null){
   if(!active||commands)return;const state=selection();
   if(id==='101'||id==='102'||id==='103'){
    if(state.sector!==id||state.view!=='sector')emit(`sector:${id}`,()=>host.onSector(id));
   }else if(id===null&&state.view!=='overview')emit('overview',host.onOverview);
  },
 };
 return {handlers,
  command<T>(action:()=>T){commands++;try{return action();}finally{commands--; }},
  dispose(){active=false;pending=null;},
 };
}
