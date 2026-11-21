import assert from 'node:assert/strict';
import {test} from 'node:test';
import {Box3,InstancedMesh,Matrix4,MeshBasicMaterial,Object3D,Quaternion,Raycaster,Vector3} from 'three';
import {stadiumSeats} from '../data/stadium.ts';
import {crowdColor,createCrowdGeometry,crowdMaskTransition,writeCrowdInstances} from './crowd.ts';

test('crowd figure is a compact faceless silhouette above its seat deck',()=>{
 const geometry=createCrowdGeometry(),bounds=new Box3().setFromBufferAttribute(geometry.getAttribute('position'));
 assert.ok(bounds.min.y>=.07);assert.ok(bounds.max.y>=1.27&&bounds.max.y<=1.30);
 assert.ok(bounds.getSize(new Object3D().position).x<=.44);assert.ok(bounds.getSize(new Object3D().position).z<=.44);
 assert.ok(geometry.getIndex()!.count/3<=64);assert.equal(crowdColor,'#18222c');
 geometry.dispose();
});

test('writes canonical matrices for every seat and ignores availability',()=>{
 const seats=stadiumSeats(),mesh=new InstancedMesh(createCrowdGeometry(),new MeshBasicMaterial(),seats.length);
 const controller=writeCrowdInstances(seats,mesh),position=new Object3D(),q=new Quaternion(),scale=new Object3D().scale,matrix=new Matrix4();
 assert.equal(seats.length,38078);assert.equal(mesh.count,seats.length);assert.ok(mesh.boundingSphere);
 seats.forEach((seat,index)=>{
  mesh.getMatrixAt(index,matrix);matrix.decompose(position.position,q,scale);
  assert.ok(position.position.toArray().every((v,i)=>Math.abs(v-seat.position[i])<1e-5),seat.id);
  const heading=new Object3D();heading.rotation.set(0,seat.heading??0,0);
  assert.ok(Math.abs(q.angleTo(heading.quaternion))<1e-5,seat.id);
  assert.ok(scale.toArray().every(v=>Math.abs(v-1)<1e-6));
 });
 const raycast=mesh.raycast;assert.doesNotThrow(()=>raycast.call(mesh,{ } as never,[]));
 assert.equal(controller.setHidden(['unknown-id']),0);
 mesh.geometry.dispose();mesh.material.dispose();
});

test('changes only hidden matrices and restores them on release',()=>{
 const seats=stadiumSeats().slice(0,3),mesh=new InstancedMesh(createCrowdGeometry(),new MeshBasicMaterial(),3),controller=writeCrowdInstances(seats,mesh);
 const ray=new Raycaster(new Vector3(...seats[0].position).add(new Vector3(0,3,0)),new Vector3(0,-1,0)),baseline:ReturnType<Raycaster['intersectObject']>=[];
 mesh.updateMatrixWorld();InstancedMesh.prototype.raycast.call(mesh,ray,baseline);
 assert.ok(baseline.length>0,'the test ray crosses an actual silhouette');
 assert.equal(ray.intersectObject(mesh).length,0,'the crowd does not intercept seat picking');
 assert.equal(controller.setHidden([seats[0].id,seats[1].id,'unknown']),2);
 const pos=new Object3D(),q=new Quaternion(),scale=new Object3D().scale,matrix=new Matrix4();
 mesh.getMatrixAt(0,matrix);matrix.decompose(pos.position,q,scale);assert.deepEqual(scale.toArray(),[0,0,0]);
 assert.equal(mesh.instanceMatrix.updateRanges.length,2);
 assert.equal(controller.setHidden([seats[0].id,seats[1].id]),0);
 assert.equal(controller.setHidden([seats[1].id]),1);
 mesh.getMatrixAt(0,matrix);matrix.decompose(pos.position,q,scale);assert.deepEqual(scale.toArray(),[1,1,1]);
 mesh.getMatrixAt(1,matrix);matrix.decompose(pos.position,q,scale);assert.deepEqual(scale.toArray(),[0,0,0]);
 assert.equal(controller.setHidden([]),1);
 mesh.getMatrixAt(1,matrix);matrix.decompose(pos.position,q,scale);assert.deepEqual(scale.toArray(),[1,1,1]);
 mesh.geometry.dispose();mesh.material.dispose();
});

test('mask keeps source and target hidden through rapid seat and reset flights',()=>{
 const seatA='101-1-1',seatB='101-1-2',seatC='101-1-3';
 let state=crowdMaskTransition({seatId:null,hiddenIds:[]},'seat',seatA,false);
 assert.deepEqual(state,{seatId:seatA,hiddenIds:[seatA]});
 state=crowdMaskTransition(state,'seat',seatB,true);assert.deepEqual(new Set(state.hiddenIds),new Set([seatA,seatB]));
 state=crowdMaskTransition(state,'seat',seatC,true);assert.deepEqual(new Set(state.hiddenIds),new Set([seatA,seatB,seatC]));
 state=crowdMaskTransition(state,'seat',seatC,false);assert.deepEqual(state,{seatId:seatC,hiddenIds:[seatC]});
 state=crowdMaskTransition(state,'overview',null,true);assert.deepEqual(state,{seatId:null,hiddenIds:[seatC]});
 state=crowdMaskTransition(state,'sector',null,false);assert.deepEqual(state,{seatId:null,hiddenIds:[]});
 state=crowdMaskTransition({seatId:seatA,hiddenIds:[seatA]},'seat',seatB,true);
 state=crowdMaskTransition(state,'overview',null,true);assert.deepEqual(state,{seatId:null,hiddenIds:[seatA,seatB]});
 state=crowdMaskTransition(state,'overview',null,false);assert.deepEqual(state,{seatId:null,hiddenIds:[]});
});

test('batched hide and restore retain every pending GPU matrix range',()=>{
 const seats=stadiumSeats().slice(0,3),mesh=new InstancedMesh(createCrowdGeometry(),new MeshBasicMaterial(),3);
 try{
 const controller=writeCrowdInstances(seats,mesh);
 mesh.instanceMatrix.clearUpdateRanges(); // Simulate the initial full upload.
 controller.setHidden([seats[0].id]);controller.setHidden([seats[1].id]);controller.setHidden([seats[2].id]);
 for(let index=0;index<3;index++)assert.ok(mesh.instanceMatrix.updateRanges.some(range=>range.start<=index*16&&range.start+range.count>=(index+1)*16),`pending matrix ${index} was dropped`);
 }finally{mesh.geometry.dispose();mesh.material.dispose();}
});
