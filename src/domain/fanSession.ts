import {canonicalBasket} from './basket.ts';
import {defaultSeatFilters,type SeatFilters} from './seatSearch.ts';
import {initialSelection,selectionReducer,type Selection} from './selection.ts';
import {resolveSeat,sectors,sectorRows,type Seat} from '../data/stadium.ts';
export type FanState={basket:Seat[];selection:Selection;filters:SeatFilters;stand:number;surface:'map'|'3d';avoidSingles?:boolean};
export type FanStorage=Pick<Storage,'getItem'|'setItem'>;
export type SeatResolver=(id:string)=>Seat|null;
const scope=(legacyOnly:boolean)=>legacyOnly?'legacy':'full';
const legacyFanSessionKey=(legacyOnly=false)=>`salesbeyond:enea-demo:fan:v1:${scope(legacyOnly)}`;
export const fanSessionKey=(legacyOnly=false,eventId='enea-demo')=>`salesbeyond:${eventId}:fan:v2:${scope(legacyOnly)}`;
export const freshFanState=():FanState=>({basket:[],selection:{...initialSelection},filters:{...defaultSeatFilters},stand:-1,surface:'3d'});
const allowed=(id:string,legacyOnly:boolean)=>!legacyOnly||sectors.some(s=>id.startsWith(`${s.id}-`));
export function decodeFanSession(raw:string|null,legacyOnly=false,resolve:SeatResolver=resolveSeat){
 const fallback={state:freshFanState(),restored:false,discarded:0,invalid:false};
 if(raw===null)return fallback;
 try{
 if(raw.length>16000)return {...fallback,invalid:true};
 const doc=JSON.parse(raw);
 if(!doc||typeof doc!=='object'||doc.version!==1||doc.scope!==scope(legacyOnly)||!Array.isArray(doc.cart)||doc.cart.length>256)return {...fallback,invalid:true};
 const cart=canonicalBasket(doc.cart,id=>allowed(id,legacyOnly)?resolve(id):null);
 let selection={...initialSelection};
 if(['overview','sector','seat'].includes(doc.view)){
 if(typeof doc.sector==='string'&&(!legacyOnly||sectors.some(s=>s.id===doc.sector))){
 selection=selectionReducer(selection,{type:'sector',id:doc.sector});
 if(Number.isInteger(doc.row)&&sectorRows(doc.sector).includes(doc.row))selection=selectionReducer(selection,{type:'row',row:doc.row});
 }
 if(doc.view==='overview')selection={...initialSelection};
 else if(doc.view==='seat'&&typeof doc.seatId==='string'&&allowed(doc.seatId,legacyOnly)){
 const seat=resolve(doc.seatId);if(seat)selection=selectionReducer(selection,{type:'seat',seat,canonical:seat});
 }
 }
 const filters={maxPrice:[0,65,75,85,95].includes(doc.filters?.maxPrice)?doc.filters.maxPrice:0,availableOnly:typeof doc.filters?.availableOnly==='boolean'?doc.filters.availableOnly:true};
 const stand=[-1,0,1,2,3].includes(doc.stand)&&(!legacyOnly||doc.stand===0||doc.stand===-1)?doc.stand:-1;
 const state:FanState={basket:cart.seats,selection,filters,stand,surface:doc.surface==='map'?'map':'3d',...(typeof doc.avoidSingles==='boolean'?{avoidSingles:doc.avoidSingles}:{})};
 return {state,restored:true,discarded:cart.discarded,invalid:false};
 }catch{return {...fallback,invalid:true};}
}
export function encodeFanSession(state:FanState,legacyOnly=false){
 return JSON.stringify({version:1,scope:scope(legacyOnly),cart:state.basket.map(s=>s.id),seatId:state.selection.view==='seat'?state.selection.seat?.id??null:null,sector:state.selection.sector,row:state.selection.row,view:state.selection.view,filters:state.filters,stand:state.stand,surface:state.surface,...(typeof state.avoidSingles==='boolean'?{avoidSingles:state.avoidSingles}:{})});
}
export function readFanSession(storage:FanStorage|null,legacyOnly=false,eventId='enea-demo',resolve:SeatResolver=resolveSeat){
 if(!storage)return {...decodeFanSession(null,legacyOnly,resolve),unavailable:true};
 try{
  const current=storage.getItem(fanSessionKey(legacyOnly,eventId));
  const raw=current??(eventId==='enea-demo'?storage.getItem(legacyFanSessionKey(legacyOnly)):null);
  return {...decodeFanSession(raw,legacyOnly,resolve),unavailable:false};
 }catch{return {...decodeFanSession(null,legacyOnly,resolve),unavailable:true};}
}
export function saveFanSession(storage:FanStorage|null,state:FanState,legacyOnly=false,eventId='enea-demo'){
 if(!storage)return false;
 try{storage.setItem(fanSessionKey(legacyOnly,eventId),encodeFanSession(state,legacyOnly));return true;}catch{return false;}
}
export function applySeatLink(state:FanState,search:string,legacyOnly=false,resolve:SeatResolver=resolveSeat){
 const id=new URLSearchParams(search).get('seat');
 if(!id)return {state,invalidLink:false};
 const seat=id.length<=128&&allowed(id,legacyOnly)?resolve(id):null;
 return seat?{state:{...state,selection:selectionReducer(state.selection,{type:'seat',seat,canonical:seat}),stand:seat.side??0},invalidLink:false}:{state,invalidLink:true};
}
export function seatLink(href:string,id:string,legacyOnly=false,eventId='enea-demo',resolve:SeatResolver=resolveSeat){
 const seat=allowed(id,legacyOnly)?resolve(id):null;if(!seat)return null;
 try{const url=new URL(href);if(!['http:','https:'].includes(url.protocol))return null;
 url.username='';url.password='';url.search='';url.hash='';url.searchParams.set('event',eventId);url.searchParams.set('seat',seat.id);if(legacyOnly)url.searchParams.set('renderer','local');return url.toString();}catch{return null;}
}


export function selectionUrl(href:string,selection:Selection,eventId='enea-demo',resolve:SeatResolver=resolveSeat){
 try{
 const url=new URL(href);if(!['http:','https:'].includes(url.protocol))return null;
 url.searchParams.set('event',eventId);url.searchParams.delete('seat');
 if(selection.view==='seat'&&selection.seat&&resolve(selection.seat.id))url.searchParams.set('seat',selection.seat.id);
 return url.toString();
 }catch{return null;}
}

/** Restore choices, then begin the stadium tour only when the URL explicitly names a seat. */
export function launchFanState(saved:FanState,search:string,legacyOnly=false,resolve:SeatResolver=resolveSeat){
 return applySeatLink({...saved,selection:{...initialSelection},stand:-1},search,legacyOnly,resolve);
}
