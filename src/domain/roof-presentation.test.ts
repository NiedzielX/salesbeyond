import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DoubleSide,Mesh,MeshBasicMaterial,Plane,Raycaster,Vector3} from 'three';
import {roofCutawayNormal,showRoof} from '../components/structure.ts';
import {createEneaModel} from '../integrations/eneaModel.ts';
import {resolveSeat} from '../data/stadium.ts';
import {eyePosition,overviewPosition} from './camera.ts';
test('panorama ma pełny dach; przekrój zachowuje przeciwną połowę zamiast usuwać całość',()=>{
 assert.equal(roofCutawayNormal('overview',0),null);
 const parts=createEneaModel(),roof=parts.find(p=>p.layer==='roof')!;
 for(const side of [0,1,2,3]){
  const plane=new Plane(new Vector3(...roofCutawayNormal('sector',side)!),0),positions=roof.geometry.getAttribute('position');
  let kept=0,clipped=0;
  for(let i=0;i<positions.count;i++){const point=new Vector3().fromBufferAttribute(positions,i);if(plane.distanceToPoint(point)>=0)kept++;else clipped++;}
  assert.ok(kept>positions.count*.25);assert.ok(clipped>positions.count*.25);
  const near=side===0?new Vector3(0,40,80):side===1?new Vector3(0,40,-80):side===2?new Vector3(100,40,0):new Vector3(-100,40,0);
  assert.ok(plane.distanceToPoint(near)<0);assert.ok(plane.distanceToPoint(near.negate())>0);
 }
 parts.forEach(p=>p.geometry.dispose());
});
test('przelot z panoramy omija membranę, a po dotarciu przywraca stan dachu',()=>{
 const parts=createEneaModel(),material=new MeshBasicMaterial({side:DoubleSide});
 try{
 const seat=resolveSeat('III-3-1-29')!,origin=new Vector3(...overviewPosition(1.5));
 const offset=new Vector3(...eyePosition(seat)).sub(origin),ray=new Raycaster(origin,offset.clone().normalize(),0,offset.length());
 const plane=new Plane(new Vector3(...roofCutawayNormal('seat',seat.side!)!),0);
 const intersections=(flying:boolean)=>parts.flatMap(part=>{
 if(part.layer!=='bowl'&&!showRoof(true,flying))return [];
 const mesh=new Mesh(part.geometry,material);mesh.updateMatrixWorld();
 return ray.intersectObject(mesh).filter(hit=>part.layer==='bowl'||plane.distanceToPoint(hit.point)>=0);
 });
 assert.ok(intersections(false).length>0,'trasa kontrolna przecina pozostawioną membranę');
 assert.equal(intersections(true).length,0,'w czasie lotu żadna widoczna część modelu nie przecina trasy');
 assert.equal(showRoof(true,false),true,'po dotarciu pełny/przecięty dach wraca');
 assert.equal(showRoof(false,false),false,'wyłączony przez kibica dach pozostaje wyłączony');
 }finally{material.dispose();parts.forEach(part=>part.geometry.dispose());}
});
