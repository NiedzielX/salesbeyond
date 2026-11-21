import {BoxGeometry,BufferGeometry,InstancedMesh,Matrix4,Object3D,SphereGeometry} from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {Seat} from '../data/stadium.ts';

export const crowdColor='#18222c';

/** One faceless seated figure, centered on its canonical seat position. */
export function createCrowdGeometry():BufferGeometry{
 const parts=[
  new SphereGeometry(.13,6,4).translate(0,1.15,0),
  new BoxGeometry(.30,.70,.24).translate(0,.62,0),
  new BoxGeometry(.40,.20,.36).translate(0,.18,-.12),
 ];
 const merged=mergeGeometries(parts,false);
 for(const part of parts)part.dispose();
 if(!merged)throw new Error('Could not merge crowd geometry');
 merged.computeBoundingBox();merged.computeBoundingSphere();
 return merged;
}

export type CrowdController={setHidden(ids:readonly string[]):number};
/** Writes one instance per seat; availability is intentionally ignored. */
export function writeCrowdInstances(seats:readonly Seat[],mesh:InstancedMesh):CrowdController{
 const object=new Object3D(),byId=new Map<string,number>(),canonical:Matrix4[]=new Array(seats.length),hidden=new Set<number>();
 seats.forEach((seat,index)=>{
  byId.set(seat.id,index);
  object.position.set(...seat.position);object.rotation.set(0,seat.heading??0,0);object.scale.set(1,1,1);object.updateMatrix();
  canonical[index]=object.matrix.clone();mesh.setMatrixAt(index,canonical[index]);
 });
 mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.computeBoundingBox();
 mesh.raycast=()=>{};
 const zero=new Matrix4().makeScale(0,0,0);
 return {setHidden(ids){
  const next=new Set<number>();for(const id of ids){const index=byId.get(id);if(index!==undefined)next.add(index);}
  const candidates=new Set([...hidden,...next].values()),changed:number[]=[];let count=0;
  for(const index of candidates){const shouldHide=next.has(index);if(hidden.has(index)===shouldHide)continue;
   mesh.setMatrixAt(index,shouldHide?zero:canonical[index]);changed.push(index);count++;
  }
  hidden.clear();for(const index of next)hidden.add(index);
  if(count){const attribute=mesh.instanceMatrix;attribute.clearUpdateRanges();
   for(const index of changed)attribute.addUpdateRange(index*16,16);
   attribute.needsUpdate=true;
  }
  return count;
 }};
}

export type CrowdViewState={seatId:string|null;hiddenIds:readonly string[]};
/** Preserve both camera seats during a flight; settle to only the active seat after arrival. */
export function crowdMaskTransition(previous:CrowdViewState,view:'overview'|'sector'|'seat',seatId:string|null,flying:boolean):CrowdViewState{
 const currentId=view==='seat'?seatId:null;
 if(!flying)return {seatId:currentId,hiddenIds:currentId?[currentId]:[]};
 const ids=new Set(previous.hiddenIds);if(previous.seatId)ids.add(previous.seatId);if(currentId)ids.add(currentId);
 return {seatId:currentId,hiddenIds:[...ids]};
}
