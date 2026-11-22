import {InstancedMesh,Object3D} from 'three';

export const landscapeTreeCount=65;
export const landscapeCanopyCounts={light:33,dark:32} as const;

/** Collapse the decorative tree ring to three static GPU batches. */
export function writeLandscapeTreeInstances(trunks:InstancedMesh,light:InstancedMesh,dark:InstancedMesh){
 const object=new Object3D();let lightIndex=0,darkIndex=0;
 const write=(mesh:InstancedMesh,index:number,x:number,y:number,z:number,scale:number)=>{
  object.position.set(x,y,z);object.quaternion.identity();object.scale.setScalar(scale);object.updateMatrix();mesh.setMatrixAt(index,object.matrix);
 };
 for(let i=0;i<landscapeTreeCount;i++){
  const angle=i*2.399,radius=181+(i%5)*8,x=Math.cos(angle)*radius,z=Math.sin(angle)*radius;
  write(trunks,i,x,2,z,1);
  const size=3+i%3;
  if(i%2)write(dark,darkIndex++,x,5+i%3,z,size);
  else write(light,lightIndex++,x,5+i%3,z,size);
 }
 for(const mesh of [trunks,light,dark]){
  mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.computeBoundingBox();mesh.raycast=()=>{};
 }
 return {trunks:landscapeTreeCount,light:lightIndex,dark:darkIndex};
}
