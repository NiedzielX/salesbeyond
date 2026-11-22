import {Color,InstancedMesh,Object3D} from 'three';
import {eneaLayout} from '../data/eneaLayout.ts';
import type {Seat} from '../data/stadium.ts';
import {seatColor} from '../components/seatFeedback.ts';
type Feedback={selectedId:string|null;hoveredId:string|null;row:number|null;emphasized:boolean;chosen:ReadonlySet<string>;inventory?:ReadonlyMap<string,Seat&{ownedHold?:boolean}>};
function markColorUpdates(mesh:InstancedMesh,indices:readonly number[]){
 const attribute=mesh.instanceColor;if(!attribute||!indices.length)return;
 const sorted=[...indices].sort((a,b)=>a-b);
 let start=sorted[0],end=start;
 for(let i=1;i<sorted.length;i++){
  const index=sorted[i];
  if(index===end+1){end=index;continue;}
  attribute.addUpdateRange(start*3,(end-start+1)*3);
  start=index;end=index;
 }
 attribute.addUpdateRange(start*3,(end-start+1)*3);
 attribute.needsUpdate=true;
}
export function writeSeatTransforms(seats:readonly Seat[],base:InstancedMesh,backs:InstancedMesh){
 const object=new Object3D();
 seats.forEach((seat,index)=>{
 const heading=seat.heading??0;
 object.rotation.set(0,heading,0);object.scale.set(eneaLayout.seatWidth,1,1);object.position.set(...seat.position);object.updateMatrix();base.setMatrixAt(index,object.matrix);
 object.position.y+=.32;object.position.x+=Math.sin(heading)*.19;object.position.z+=Math.cos(heading)*.19;object.updateMatrix();backs.setMatrixAt(index,object.matrix);
 });
 for(const mesh of [base,backs]){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();}
}
/** Hover changes colours only. Skip unchanged attributes without touching transform buffers. */
export function createSeatColors(seats:readonly Seat[],base:InstancedMesh,backs:InstancedMesh){
 const previous:string[]=[],color=new Color(),byId=new Map(seats.map((seat,index)=>[seat.id,index])),byRow=new Map<number,number[]>();
 const existingColorAttributes=new Set([base.instanceColor,backs.instanceColor].filter(attribute=>attribute!==null));
 seats.forEach((seat,index)=>{const row=byRow.get(seat.row)??[];row.push(index);byRow.set(seat.row,row);});
 const previousAvailability=seats.map(seat=>seat.available),previousOwned=seats.map(()=>false);
 let last:Feedback|null=null;
 return {update(feedback:Feedback){
  const initial=last===null,changedIndices:number[]=[],candidates=new Set<number>();
 const add=(id:string|null)=>{const index=id===null?undefined:byId.get(id);if(index!==undefined)candidates.add(index);};
 if(last&&last.inventory!==feedback.inventory){
  seats.forEach((seat,index)=>{
   const available=feedback.inventory?.get(seat.id)?.available??seat.available;
   const owned=feedback.inventory?.get(seat.id)?.ownedHold===true;
   if(previousAvailability[index]!==available||previousOwned[index]!==owned)candidates.add(index);
   previousAvailability[index]=available;previousOwned[index]=owned;
  });
 }else if(!last&&feedback.inventory){
  seats.forEach((seat,index)=>{previousAvailability[index]=feedback.inventory?.get(seat.id)?.available??seat.available;previousOwned[index]=feedback.inventory?.get(seat.id)?.ownedHold===true;});
 }
 if(!last||last.emphasized!==feedback.emphasized)seats.forEach((_,index)=>candidates.add(index));
 else{
 if(last.selectedId!==feedback.selectedId){add(last.selectedId);add(feedback.selectedId);}
 if(last.hoveredId!==feedback.hoveredId){add(last.hoveredId);add(feedback.hoveredId);}
 if(last.row!==feedback.row){if(last.row!==null)byRow.get(last.row)?.forEach(i=>candidates.add(i));if(feedback.row!==null)byRow.get(feedback.row)?.forEach(i=>candidates.add(i));}
 for(const id of last.chosen)if(!feedback.chosen.has(id))add(id);
 for(const id of feedback.chosen)if(!last.chosen.has(id))add(id);
 }
 for(const index of candidates){const seat=seats[index];
 const live=feedback.inventory?.get(seat.id),colorSeat=live?{...seat,price:live.price,available:live.available,ownedHold:live.ownedHold}:seat;
 const value=feedback.emphasized&&!feedback.chosen.has(seat.id)&&feedback.selectedId!==seat.id?'#f6a63c':seatColor(colorSeat,feedback.selectedId,feedback.hoveredId,feedback.row,feedback.chosen.has(seat.id));
  if(previous[index]===value)continue;previous[index]=value;color.set(value);base.setColorAt(index,color);backs.setColorAt(index,color);changedIndices.push(index);
 }
 last={...feedback,chosen:new Set(feedback.chosen)};
  for(const mesh of [base,backs]){
   if(initial&&mesh.instanceColor&&changedIndices.length){
    const attribute=mesh.instanceColor;
    if(existingColorAttributes.has(attribute)){
     attribute.clearUpdateRanges();
     attribute.addUpdateRange(0,attribute.count*attribute.itemSize);
    // createBuffer uploads everything but does not clear ranges queued before the first frame.
    }else attribute.onUpload(()=>attribute.clearUpdateRanges());
    attribute.needsUpdate=true;
   }
   else markColorUpdates(mesh,changedIndices);
  }
  return changedIndices.length;
 }};
}
