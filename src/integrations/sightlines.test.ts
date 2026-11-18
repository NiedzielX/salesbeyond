import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Ray,Vector3} from 'three';
import {prepareLocalScene} from './localScene.ts';
import {chartUnitsPerMetre,domainSeat} from '../data/venueChart.ts';

// Conservative two-sided opaque geometry, not a claim about the WebGL renderer's face-culling policy.
test('dwustronna geometria nie przecina linii oczu dostępnych foteli do pięciu punktów boiska',()=>{
 const {seats,prepared:{model}}=prepareLocalScene(true);
 const p=model.solids.position;
 const triangles:Array<[Vector3,Vector3,Vector3]>=[];
 for(let i=0;i<p.length;i+=9)triangles.push([new Vector3(...p.slice(i,i+3)),new Vector3(...p.slice(i+3,i+6)),new Vector3(...p.slice(i+6,i+9))]);
 const targets=[[0,.2,0],[-52.3,.2,-33.8],[52.3,.2,-33.8],[-52.3,.2,33.8],[52.3,.2,33.8]];
 const blocked:string[]=[];const ray=new Ray(),hit=new Vector3(),target=new Vector3();let rays=0;
 for(const seat of seats){
  if(!domainSeat(seat.id)?.available)continue;
  const eye=new Vector3(seat.x/chartUnitsPerMetre,seat.eyeHeightM!,seat.y/chartUnitsPerMetre);
  for(const point of targets){
   target.set(...point as [number,number,number]);const distance=eye.distanceTo(target);
   ray.set(eye,target.clone().sub(eye).normalize());
   for(const triangle of triangles){
    if(ray.intersectTriangle(...triangle,false,hit)&&eye.distanceTo(hit)<distance-.5){blocked.push(`${seat.id} → ${point.join(',')}`);break;}
   }
   rays++;
  }
 }
 assert.equal(rays,2500);assert.deepEqual(blocked,[]);
});
