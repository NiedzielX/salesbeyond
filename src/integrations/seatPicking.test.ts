import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BackSide,BoxGeometry,Color,DoubleSide,FrontSide,Group,InstancedMesh,Matrix4,MeshBasicMaterial,Raycaster,Vector3,type Intersection} from 'three';
import {sectorSeats} from '../data/stadium.ts';
import {createSeatColors,writeSeatTransforms} from './seatInstances.ts';
import {installSeatPicking} from './seatPicking.ts';

function makeSector(id:string){
 const seats=sectorSeats(id),geometry=new BoxGeometry(1,.16,.44),material=new MeshBasicMaterial({side:FrontSide});
 const parent=new Group(),mesh=new InstancedMesh(geometry,material,seats.length),backs=new InstancedMesh(geometry,material,seats.length);parent.add(mesh);writeSeatTransforms(seats,mesh,backs);
 parent.updateMatrixWorld(true);return {seats,geometry,material,parent,mesh};
}
function rayAt(mesh:InstancedMesh,index:number,fromAbove=true){
 const instance=new Matrix4();mesh.getMatrixAt(index,instance);
 const origin=fromAbove?new Vector3(0,2,0):new Vector3(0,-2,0),direction=fromAbove?new Vector3(0,-1,0):new Vector3(0,1,0);
 origin.applyMatrix4(instance);direction.transformDirection(instance);
 origin.applyMatrix4(mesh.matrixWorld);direction.transformDirection(mesh.matrixWorld);
 return new Raycaster(origin,direction);
}
function normalized(mesh:InstancedMesh,ray:Raycaster){
 const found:Intersection[]=[];
 mesh.raycast(ray,found);
 return found.map(hit=>({instanceId:hit.instanceId,distance:hit.distance,point:hit.point})).sort((a,b)=>(a.instanceId??-1)-(b.instanceId??-1)||a.distance-b.distance);
}
function assertSameHits(actual:ReturnType<typeof normalized>,expected:ReturnType<typeof normalized>){
 assert.equal(actual.length,expected.length);
 for(let i=0;i<actual.length;i++){
  assert.equal(actual[i].instanceId,expected[i].instanceId);
  assert.ok(Math.abs(actual[i].distance-expected[i].distance)<1e-5);
  assert.ok(actual[i].point.distanceTo(expected[i].point)<1e-5);
 }
}
function withBaseline(mesh:InstancedMesh,ray:Raycaster){
 const accelerated=normalized(mesh,ray),indexed=mesh.raycast;
 mesh.raycast=InstancedMesh.prototype.raycast;
 const baseline=normalized(mesh,ray);
 mesh.raycast=indexed;
 assertSameHits(accelerated,baseline);
}

test('BVH candidates preserve Three intersections for straight and corner seats',()=>{
 for(const sector of ['101','C1']){
  const {seats,mesh,geometry,material}=makeSector(sector),dispose=installSeatPicking(mesh);
  for(const index of [0,Math.floor(seats.length/2),seats.length-1])withBaseline(mesh,rayAt(mesh,index));
  dispose.dispose();geometry.dispose();material.dispose();
 }
});

test('BVH picking respects parent translation, rotation, scaling, material side, and near/far',()=>{
 const {seats,mesh,parent,geometry,material}=makeSector('C1');
 parent.position.set(13,-4,27);parent.rotation.set(.13,.42,-.08);parent.scale.set(1.2,.85,1.1);parent.updateMatrixWorld(true);
 const dispose=installSeatPicking(mesh),index=Math.floor(seats.length*.61);
 for(const side of [FrontSide,BackSide,DoubleSide]){
  material.side=side;
  for(const above of [true,false]){
   const ray=rayAt(mesh,index,above);withBaseline(mesh,ray);
   const full=normalized(mesh,ray);ray.near=full[0]?.distance??0;ray.far=(full[0]?.distance??0)+.01;withBaseline(mesh,ray);
   ray.near=0;ray.far=1e-4;withBaseline(mesh,ray);
  }
 }
 const miss=new Raycaster(new Vector3(10000,10000,10000),new Vector3(0,-1,0));
 withBaseline(mesh,miss);
 dispose.dispose();geometry.dispose();material.dispose();
});

test('BVH tests far fewer seat boxes than a full instance scan and disposal restores raycast',()=>{
 const {seats,mesh,geometry,material}=makeSector('C1'),original=mesh.raycast,dispose=installSeatPicking(mesh);
 const ray=rayAt(mesh,Math.floor(seats.length/2));
 assert.ok(normalized(mesh,ray).length>0);
 assert.ok(dispose.stats.instanceTests<seats.length/8,`tested ${dispose.stats.instanceTests} of ${seats.length}`);
 dispose.dispose();assert.equal(mesh.raycast,original);geometry.dispose();material.dispose();
});

test('hover, selection, and basket color changes leave transform buffers untouched and write only changed seats',()=>{
 const seats=sectorSeats('101'),geometry=new BoxGeometry(1,.16,.44),material=new MeshBasicMaterial();
 const base=new InstancedMesh(geometry,material,seats.length),backs=new InstancedMesh(geometry,material,seats.length);
 writeSeatTransforms(seats,base,backs);
 const baseMatrices=Array.from(base.instanceMatrix.array),backMatrices=Array.from(backs.instanceMatrix.array);
 const updates=createSeatColors(seats,base,backs),writes:number[]=[];
 const backWrites:number[]=[],original=base.setColorAt.bind(base),originalBack=backs.setColorAt.bind(backs);
 base.setColorAt=(index,color)=>{writes.push(index);original(index,color);};
 backs.setColorAt=(index,color)=>{backWrites.push(index);originalBack(index,color);};
 const feedback={selectedId:null as string|null,hoveredId:null as string|null,row:null as number|null,emphasized:false,chosen:new Set<string>()};
 assert.equal(updates.update(feedback),seats.length);assert.equal(backWrites.length,seats.length);
 writes.length=0;backWrites.length=0;feedback.hoveredId=seats.find(seat=>seat.available)!.id;
 const hoveredIndex=seats.findIndex(seat=>seat.id===feedback.hoveredId);
 assert.equal(updates.update(feedback),1);assert.deepEqual(writes,[hoveredIndex]);assert.deepEqual(backWrites,[hoveredIndex]);
 writes.length=0;backWrites.length=0;feedback.selectedId=feedback.hoveredId;feedback.hoveredId=null;
 assert.equal(updates.update(feedback),1);assert.deepEqual(writes,[hoveredIndex]);assert.deepEqual(backWrites,[hoveredIndex]);
 writes.length=0;backWrites.length=0;feedback.selectedId=null;feedback.chosen.add(seats.find(seat=>seat.available&&seat.id!==seats[hoveredIndex].id)!.id);
 const chosenIndex=seats.findIndex(seat=>feedback.chosen.has(seat.id));
 assert.equal(updates.update(feedback),2);assert.deepEqual(writes,[hoveredIndex,chosenIndex]);assert.deepEqual(backWrites,[hoveredIndex,chosenIndex]);
 assert.deepEqual(Array.from(base.instanceMatrix.array),baseMatrices);assert.deepEqual(Array.from(backs.instanceMatrix.array),backMatrices);
 geometry.dispose();material.dispose();
});

test('inventory availability updates only changed seat colors and keeps hover deltas bounded',()=>{
 const seats=sectorSeats('101'),geometry=new BoxGeometry(1,.16,.44),material=new MeshBasicMaterial();
 const base=new InstancedMesh(geometry,material,seats.length),backs=new InstancedMesh(geometry,material,seats.length);
 writeSeatTransforms(seats,base,backs);
 const baseMatrices=Array.from(base.instanceMatrix.array),backMatrices=Array.from(backs.instanceMatrix.array);
 const updates=createSeatColors(seats,base,backs),writes:number[]=[],original=base.setColorAt.bind(base);
 base.setColorAt=(index,color)=>{writes.push(index);original(index,color);};
 const inventory=new Map<string,typeof seats[number]&{ownedHold?:boolean}>(),hovered=seats.find(seat=>seat.available)!,target=seats.find(seat=>seat.available&&seat.id!==hovered.id)!;
 const feedback={selectedId:null as string|null,hoveredId:hovered.id,row:null as number|null,emphasized:false,chosen:new Set<string>(),inventory};
 assert.equal(updates.update(feedback),seats.length);writes.length=0;
 const changed={...target,available:false};const nextInventory=new Map(inventory);nextInventory.set(target.id,changed);feedback.inventory=nextInventory;
 const targetIndex=seats.findIndex(seat=>seat.id===target.id);
 assert.equal(updates.update(feedback),1);assert.deepEqual(writes,[targetIndex]);
 const color=new Color();base.getColorAt(targetIndex,color);assert.equal(`#${color.getHexString()}`,'#88929c');
 feedback.chosen.add(target.id);assert.equal(updates.update(feedback),0,'another session hold stays gray in an unconfirmed cart');
 feedback.inventory=new Map([[target.id,{...target,available:false,ownedHold:true}]]);assert.equal(updates.update(feedback),1);base.getColorAt(targetIndex,color);assert.equal(`#${color.getHexString()}`,'#199b7a');
 feedback.inventory=new Map([[target.id,{...target,available:false,ownedHold:false}]]);assert.equal(updates.update(feedback),1);base.getColorAt(targetIndex,color);assert.equal(`#${color.getHexString()}`,'#88929c');
 writes.length=0;feedback.hoveredId=seats.find(seat=>seat.available&&seat.id!==hovered.id&&seat.id!==target.id)!.id;
 const hoveredIndex=seats.findIndex(seat=>seat.id===feedback.hoveredId);
 assert.equal(updates.update(feedback),2);assert.deepEqual(writes,[seats.findIndex(seat=>seat.id===hovered.id),hoveredIndex]);
 assert.deepEqual(Array.from(base.instanceMatrix.array),baseMatrices);assert.deepEqual(Array.from(backs.instanceMatrix.array),backMatrices);
 geometry.dispose();material.dispose();
});


test('przestrzenny wybór zachowuje również skośne trafienia kamery z boiska i panoramy',()=>{
 const {seats,mesh,geometry,material}=makeSector('C2'),index=installSeatPicking(mesh);
 for(const origin of [new Vector3(0,8,0),new Vector3(135,180,155),new Vector3(-30,40,20)]){
 for(const position of [seats[10].position,seats[Math.floor(seats.length*.7)].position]){
 const target=new Vector3(...position);withBaseline(mesh,new Raycaster(origin,target.clone().sub(origin).normalize()));
 }}
 index.dispose();geometry.dispose();material.dispose();
});
