import assert from 'node:assert/strict';
import test from 'node:test';
import {Mesh,MeshBasicMaterial,Raycaster,Vector3} from 'three';
import {getSeat} from '../data/stadium.ts';
import {eyePosition} from '../domain/camera.ts';
import {createBeyondAdvertising} from './beyondAdvertising.ts';

test('goal advertising does not block the nearby pitch from the first row',()=>{
 const material=new MeshBasicMaterial();
 const advertising=createBeyondAdvertising();
 const meshes=advertising.map(part=>new Mesh(part.geometry,material));
 try{
  const panels=advertising.find(part=>part.name==='Grey goal-back panels')!.geometry;
  panels.computeBoundingBox();
  assert.ok(panels.boundingBox!.min.y>2.44,'the goal panel starts above the crossbar');
  for(const [sector,end] of [['II-2',1],['IV-2',-1]] as const){
   const eye=new Vector3(...eyePosition(getSeat(sector,1,16)));
   const target=new Vector3(end*52.3,.2,eye.z);
   const offset=target.clone().sub(eye),distance=offset.length();
   const ray=new Raycaster(eye,offset.normalize(),0,distance-.01);
   const hits=meshes.flatMap(mesh=>ray.intersectObject(mesh,false));
   assert.equal(hits.length,0,`${sector} first-row sightline is blocked by ${hits.length} advertising surface(s)`);
  }
 }finally{
  meshes.forEach(mesh=>mesh.geometry.dispose());
  material.dispose();
 }
});
