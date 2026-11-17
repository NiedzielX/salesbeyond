import type {Action} from './selection.ts';
import {getSeat} from '../data/stadium.ts';
/** Cleanup owns every pending action, so manual interaction cannot be overwritten. */
export function scheduleTour(
 dispatch:(action:Action)=>void,
 finish:()=>void,
 schedule:(fn:()=>void,delay:number)=>ReturnType<typeof setTimeout>=setTimeout,
 cancel:(id:ReturnType<typeof setTimeout>)=>void=clearTimeout,
){
 let active=true;
 const ids=[
 schedule(()=>{if(active)dispatch({type:'sector',id:'102'})},6500),
 schedule(()=>{if(active)dispatch({type:'seat',seat:getSeat('102',6,10)})},14500),
 schedule(()=>{if(active)finish()},24000),
 ];
 return ()=>{active=false;ids.forEach(cancel)};
}
