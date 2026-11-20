import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Plane,Vector3} from 'three';
import {roofCutawayNormal} from '../components/structure.ts';
import {createEneaModel} from '../integrations/eneaModel.ts';
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
