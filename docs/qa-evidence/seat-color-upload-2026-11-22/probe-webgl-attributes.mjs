import assert from 'node:assert/strict';
import {BoxGeometry,InstancedMesh,MeshBasicMaterial} from 'three';
import {WebGLAttributes} from 'three/src/renderers/webgl/WebGLAttributes.js';
import {sectorSeats} from '../../../src/data/stadium.ts';
import {createSeatColors} from '../../../src/integrations/seatInstances.ts';

const calls=[];
const gl={
 FLOAT:5126,HALF_FLOAT:5131,UNSIGNED_SHORT:5123,SHORT:5122,UNSIGNED_INT:5125,INT:5124,BYTE:5120,UNSIGNED_BYTE:5121,
 createBuffer:()=>({}),bindBuffer(){},deleteBuffer(){},
 bufferData(_target,array){calls.push({kind:'full',bytes:array.byteLength})},
 bufferSubData(_target,offset,array,start=0,count=array.length){calls.push({kind:'partial',offset,bytes:count*array.BYTES_PER_ELEMENT,start})}
};
const gpu=WebGLAttributes(gl),seats=sectorSeats('C2'),geometry=new BoxGeometry(1,.16,.44),material=new MeshBasicMaterial();
const base=new InstancedMesh(geometry,material,seats.length),backs=new InstancedMesh(geometry,material,seats.length),matrixVersions=[base.instanceMatrix.version,backs.instanceMatrix.version];
const colors=createSeatColors(seats,base,backs),feedback={selectedId:null,hoveredId:null,row:null,emphasized:false,chosen:new Set()};
assert.equal(colors.update(feedback),seats.length);
for(const mesh of [base,backs])gpu.update(mesh.instanceColor,34962);
assert.deepEqual(calls.map(call=>call.bytes),[seats.length*3*4,seats.length*3*4]);
assert.deepEqual([base.instanceColor.updateRanges,backs.instanceColor.updateRanges],[[],[]]);
calls.length=0;
const first=seats.find((seat)=>seat.available);feedback.hoveredId=first.id;assert.equal(colors.update(feedback),1);
for(const mesh of [base,backs])gpu.update(mesh.instanceColor,34962);
assert.deepEqual(calls.map(call=>call.bytes),[12,12]);
calls.length=0;
const second=seats.find((seat,index)=>seat.available&&index>20),third=seats.find((seat,index)=>seat.available&&index>80);
feedback.selectedId=second.id;colors.update(feedback);feedback.hoveredId=null;feedback.selectedId=third.id;colors.update(feedback);
for(const mesh of [base,backs])gpu.update(mesh.instanceColor,34962);
assert.ok(calls.every(call=>call.kind==='partial'));assert.equal(calls.reduce((sum,call)=>sum+call.bytes,0),72);
assert.deepEqual([base.instanceMatrix.version,backs.instanceMatrix.version],matrixVersions);
console.log(JSON.stringify({sector:'C2',seats:seats.length,initialBytes:seats.length*3*4*2,oneSeatHoverBytes:24,queuedChangesBytes:72,matrixVersionsUnchanged:true},null,2));
geometry.dispose();material.dispose();
