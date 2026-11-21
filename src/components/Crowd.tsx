import {useLayoutEffect,useMemo,useRef} from 'react';
import type {InstancedMesh} from 'three';
import {stadiumSeats} from '../data/stadium';
import type {View} from '../domain/selection';
import {createCrowdGeometry,crowdColor,crowdMaskTransition,writeCrowdInstances} from '../integrations/crowd';

function CrowdMesh({hiddenIds}:{hiddenIds:readonly string[]}){
 const mesh=useRef<InstancedMesh>(null);
 const seats=useMemo(()=>stadiumSeats(),[]);
 const geometry=useMemo(()=>createCrowdGeometry(),[]);
 const controller=useRef<ReturnType<typeof writeCrowdInstances>|null>(null);
 useLayoutEffect(()=>{
  if(!mesh.current)return;
  controller.current=writeCrowdInstances(seats,mesh.current);
  controller.current.setHidden(hiddenIds);
  return()=>{controller.current=null;geometry.dispose();};
 },[seats,geometry]);
 useLayoutEffect(()=>{controller.current?.setHidden(hiddenIds);},[hiddenIds]);
 return <instancedMesh name="Simulated crowd" ref={mesh} args={[geometry,undefined,seats.length]} receiveShadow>
  <meshStandardMaterial color={crowdColor} roughness={1}/>
 </instancedMesh>;
}

/** Keep observer history while the optional geometry is absent. */
export default function Crowd({enabled,view,seatId,flying}:{enabled:boolean;view:View;seatId:string|null;flying:boolean}){
 const previous=useRef<{seatId:string|null;hiddenIds:readonly string[]}>({seatId:null,hiddenIds:[]});
 const mask=useMemo(()=>crowdMaskTransition(previous.current,view,seatId,flying),[view,seatId,flying]);
 useLayoutEffect(()=>{previous.current=mask;},[mask]);
 return enabled?<CrowdMesh hiddenIds={mask.hiddenIds}/>:null;
}
