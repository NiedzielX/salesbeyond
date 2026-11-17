import type {Point} from '../domain/camera.ts';
import type {View} from '../domain/selection.ts';
/** Front supports are cut away with the front roof when approaching a seat. */
export function columnPositions(side:number,view:View):Point[]{
 if(side===0&&view!=='overview')return [];
 return Array.from({length:side<2?9:7},(_,i)=>{
 const along=(i-(side<2?4:3))*15;
 return side<2?[along,16,(side===0?1:-1)*79]:[(side===2?1:-1)*97,16,along];
 });
}
