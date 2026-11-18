import type {PreparedVenue3D} from '@seatlayer/core/view3d';
import {createVenueGeometry} from '../data/venueShell.ts';
type Model=PreparedVenue3D['model'];

/** The public mesh contract labels 5 as generated concrete, distinct from authored architecture.
 * Specific to our synthetic chart with no surveyed barriers: keep native treads/risers and replace un-authored parapets.
 * Do not apply this policy to an imported real-venue plan.
 */
export function applyAuthoredArchitecture(model:Model,roof:boolean){
 const native=model.solids;
 const remove=new Uint8Array(native.count);
 for(const range of model.sectionSolidRanges){
  for(let vertex=range.start;vertex<range.start+range.count;vertex+=3){
   if([0,1,2].every(offset=>native.material[vertex+offset]===5))remove.fill(1,vertex,vertex+3);
  }
 }
 const prefix=new Uint32Array(native.count+1),kept:number[]=[];
 for(let vertex=0;vertex<native.count;vertex++){
  if(!remove[vertex])kept.push(vertex);
  prefix[vertex+1]=kept.length;
 }
 for(const range of model.sectionSolidRanges){const end=range.start+range.count;range.count=prefix[end]-prefix[range.start];range.start=prefix[range.start];}
 const authored=createVenueGeometry(roof);
 const result={...native,count:kept.length+authored.count};
 for(const name of ['position','normal','color','floor','material'] as const){
  const stride=name==='floor'||name==='material'?1:3;
  const values=new Float32Array(result.count*stride);
  kept.forEach((vertex,index)=>values.set(native[name].subarray(vertex*stride,(vertex+1)*stride),index*stride));
  values.set(authored[name],kept.length*stride);result[name]=values;
 }
 model.solids=result;
 // All authored solids, including the site, participate in clipping. Navigation bounds exclude the site.
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<result.position.length;i++){min[i%3]=Math.min(min[i%3],result.position[i]);max[i%3]=Math.max(max[i%3],result.position[i]);}
 const center=min.map((value,axis)=>(value+max[axis])/2) as [number,number,number];
 const radius=Math.hypot(...max.map((value,axis)=>(value-min[axis])/2));
 model.renderBounds={center,radius};model.clipBounds={center,radius};
 return model;
}
