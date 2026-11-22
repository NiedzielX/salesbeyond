import assert from 'node:assert/strict';
import test from 'node:test';
import {CylinderGeometry,IcosahedronGeometry,InstancedMesh,Matrix4,MeshBasicMaterial,Quaternion,Vector3} from 'three';
import {landscapeCanopyCounts,landscapeTreeCount,writeLandscapeTreeInstances} from './landscapeInstances.ts';

function readInstance(mesh:InstancedMesh,index:number){
 const matrix=new Matrix4(),position=new Vector3(),rotation=new Quaternion(),scale=new Vector3();
 mesh.getMatrixAt(index,matrix);matrix.decompose(position,rotation,scale);return {position,scale};
}

test('decorative tree ring uses three batches while preserving all positions and sizes',()=>{
 const material=new MeshBasicMaterial();
 const trunks=new InstancedMesh(new CylinderGeometry(.5,.7,4,5),material,landscapeTreeCount);
 const light=new InstancedMesh(new IcosahedronGeometry(1,1),material,landscapeCanopyCounts.light);
 const dark=new InstancedMesh(new IcosahedronGeometry(1,1),material,landscapeCanopyCounts.dark);
 const counts=writeLandscapeTreeInstances(trunks,light,dark);
 assert.deepEqual(counts,{trunks:65,light:33,dark:32});
 const firstTrunk=readInstance(trunks,0),firstCanopy=readInstance(light,0);
 assert.deepEqual(firstTrunk.position.toArray(),[181,2,0]);
 assert.deepEqual(firstTrunk.scale.toArray(),[1,1,1]);
 assert.deepEqual(firstCanopy.position.toArray(),[181,5,0]);
 assert.deepEqual(firstCanopy.scale.toArray(),[3,3,3]);
 for(const mesh of [trunks,light,dark]){
  assert.ok(mesh.boundingBox&&!mesh.boundingBox.isEmpty());
  assert.ok(mesh.boundingSphere&&mesh.boundingSphere.radius>0);
  assert.equal(mesh.raycast.length,0);
 }
 trunks.geometry.dispose();light.geometry.dispose();dark.geometry.dispose();material.dispose();
});
