import type {Point} from '../domain/camera.ts';
import type {View} from '../domain/selection.ts';
/** Keep the ceiling cut away until the camera has left the bowl, including reset flights. */
export function showStructure(view:View,flying:boolean){return view==='overview'&&!flying;}
export function columnPositions(side:number,view:View,flying=false):Point[]{
 if(!showStructure(view,flying))return [];
 return Array.from({length:side<2?9:7},(_,i)=>{
 const along=(i-(side<2?4:3))*15;
 return side<2?[along,16,(side===0?1:-1)*79]:[(side===2?1:-1)*97,16,along];
 });
}
