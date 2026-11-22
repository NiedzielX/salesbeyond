import {useLayoutEffect,useRef} from 'react';
import type {InstancedMesh} from 'three';
import {landscapeCanopyCounts,landscapeTreeCount,writeLandscapeTreeInstances} from '../integrations/landscapeInstances';

export default function LandscapeTrees(){
 const trunks=useRef<InstancedMesh>(null),light=useRef<InstancedMesh>(null),dark=useRef<InstancedMesh>(null);
 useLayoutEffect(()=>{
  if(trunks.current&&light.current&&dark.current)writeLandscapeTreeInstances(trunks.current,light.current,dark.current);
 },[]);
 return <group name="Instanced landscape trees">
  <instancedMesh ref={trunks} args={[undefined,undefined,landscapeTreeCount]}><cylinderGeometry args={[.5,.7,4,5]}/><meshStandardMaterial color="#8b8e7a"/></instancedMesh>
  <instancedMesh ref={light} args={[undefined,undefined,landscapeCanopyCounts.light]} castShadow><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color="#a4b5a0"/></instancedMesh>
  <instancedMesh ref={dark} args={[undefined,undefined,landscapeCanopyCounts.dark]} castShadow><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color="#8eaa91"/></instancedMesh>
 </group>;
}
