import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyProps} from '@react-three/fiber';
import {BoxGeometry,Mesh,MeshBasicMaterial,Raycaster,Vector3} from 'three';
import {sectorRaycast} from '../components/interaction.ts';
test('wybór sektora działa ponownie po powrocie z widoku miejsca',()=>{
 const mesh=new Mesh(new BoxGeometry(2,2,2),new MeshBasicMaterial());
 mesh.updateMatrixWorld();
 const ray=new Raycaster(new Vector3(0,0,5),new Vector3(0,0,-1));
 for(const view of ['overview','sector','seat','overview'] as const){
 applyProps(mesh,{raycast:sectorRaycast(view)});
 assert.equal(ray.intersectObject(mesh).length>0,view==='overview',view);
 }
 mesh.geometry.dispose();mesh.material.dispose();
});
