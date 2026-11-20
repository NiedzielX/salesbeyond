import type {Point} from '../domain/camera.ts';
import type {View} from '../domain/selection.ts';
/** Keep the ceiling cut away until the camera has left the bowl, including reset flights. */
export function showStructure(view:View,flying:boolean){return view==='overview'&&!flying;}
/** An incoming flight may start outside the retained half of the roof. */
export function showRoof(enabled:boolean,flying:boolean){return enabled&&!flying;}
export function columnPositions(side:number,view:View,flying=false):Point[]{
 if(!showStructure(view,flying))return [];
 return Array.from({length:side<2?9:7},(_,i)=>{
 const along=(i-(side<2?4:3))*15;
 return side<2?[along,16,(side===0?1:-1)*79]:[(side===2?1:-1)*97,16,along];
 });
}

/** Keep the opposite roof visible while opening only the near half for seat picking. */
export function roofCutawayNormal(view:View,side:number):Point|null{
 if(view==='overview')return null;
 return side===0?[0,0,-1]:side===1?[0,0,1]:side===2?[-1,0,0]:side===3?[1,0,0]:null;
}
