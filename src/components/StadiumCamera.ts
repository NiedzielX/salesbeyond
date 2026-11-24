import {useFrame,useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import {createElement,useEffect,useLayoutEffect,useMemo,useRef} from 'react';
import * as THREE from 'three';
import type {OrbitControls as OrbitControlsType} from 'three-stdlib';
import {sectorBounds,sectorFrame,sectorMinDistance,type SectorId,type Seat} from '../data/stadium.ts';
import {eyePosition,flightDuration,flightPoint,flightProgress,lookTarget,overviewPosition,overviewScale,seatTransferControl,type Point} from '../domain/camera.ts';
import type {View} from '../domain/selection.ts';
import {aimRotation,rotateFlight} from './cameraRotation.ts';
import {constrainOrbitTarget,pauseOrbit,recenterCamera,sectorMaxPolarAngle,sectorPanBounds} from './cameraControls.ts';
import {captureSeatPreview} from './seatPreview.ts';

export type RecenterRequest=Readonly<{token:number;seatId:string}>;
export type StadiumCameraProps={
 view:View;seat:Seat|null;sector:SectorId|null;row:number;rowFocused?:boolean;reset:number;crowd:boolean;flying:boolean;
 navigationGeneration:number;recenterRequest:RecenterRequest|null;onReady:(generation:number)=>void;onPreview:(image:string|null)=>void;
};

export function StadiumCamera({view,seat,sector,row,rowFocused,reset,crowd,flying,navigationGeneration,recenterRequest,onReady,onPreview}:StadiumCameraProps){
 const controls=useRef<OrbitControlsType>(null);const lastNavigation=useRef<{key:string;view:View}|null>(null);const manualCamera=useRef(false);const {camera,gl,size,scene}=useThree();
 const aspect=size.width/Math.max(1,size.height);const framingAspect=view==='seat'?1.5:aspect;const focusedRow=view==='sector'&&rowFocused?row:undefined;
 const panBounds=useMemo(()=>{const bounds=view==='sector'&&sector?sectorBounds(sector):null;return bounds?sectorPanBounds(new THREE.Box3(new THREE.Vector3(...bounds.min),new THREE.Vector3(...bounds.max))):null;},[view,sector]);
 const flight=useRef(true);const elapsed=useRef(0);const from=useRef<Point>([0,0,0]);const fromRotation=useRef(new THREE.Quaternion());const toRotation=useRef(new THREE.Quaternion());const to=useRef<Point>([0,0,0]);const target=useRef<Point>([0,0,0]);const angles=useRef({yaw:0,pitch:0});const consumedRecenter=useRef(recenterRequest?.token??0);const flightControl=useRef<Point|undefined>(undefined);
 useLayoutEffect(()=>{const navigation=`${view}:${seat?.id??''}:${sector??''}:${reset}:${focusedRow??''}`;const previous=lastNavigation.current;if(previous?.key===navigation&&manualCamera.current)return;if(previous?.key!==navigation)manualCamera.current=false;from.current=camera.position.toArray() as Point;fromRotation.current.copy(camera.quaternion);elapsed.current=0;flight.current=true;
 if(view==='seat'&&seat){to.current=eyePosition(seat);target.current=[0,1,0];}else if(view==='sector'){const frame=sectorFrame(sector??'',framingAspect,focusedRow);to.current=frame.position;target.current=frame.target;}else{to.current=overviewPosition(framingAspect);target.current=[0,0,0];}
 flightControl.current=previous?.view==='seat'&&view==='seat'&&seat?seatTransferControl(from.current,to.current):undefined;toRotation.current.copy(aimRotation(to.current,target.current,camera.up));if(controls.current)pauseOrbit(controls.current,camera);
 if(previous===null||previous.key===navigation){camera.position.set(...to.current);camera.quaternion.copy(toRotation.current);flight.current=false;const direction=new THREE.Vector3(...target.current).sub(camera.position);angles.current={yaw:Math.atan2(direction.x,direction.z),pitch:Math.atan2(direction.y,Math.hypot(direction.x,direction.z))};if(controls.current){controls.current.target.set(...target.current);controls.current.enabled=view!=='seat';}onReady(navigationGeneration);}
 lastNavigation.current={key:navigation,view};},[view,seat?.id,sector,reset,camera,framingAspect,focusedRow,navigationGeneration,onReady]);
 useLayoutEffect(()=>{if(!recenterRequest||recenterRequest.token===consumedRecenter.current)return;consumedRecenter.current=recenterRequest.token;if(view!=='seat'||recenterRequest.seatId!==seat?.id||flying||flight.current)return;const next=recenterCamera(camera.position.toArray() as Point);camera.quaternion.copy(next.quaternion);camera.updateMatrixWorld();angles.current={yaw:next.yaw,pitch:next.pitch};target.current=[0,1,0];controls.current?.target.set(...target.current);},[recenterRequest?.token,recenterRequest?.seatId,view,seat?.id,flying,camera]);
 useLayoutEffect(()=>{if(view==='seat'&&seat&&!flying&&!flight.current)onPreview(captureSeatPreview(()=>gl.render(scene,camera),gl.domElement));},[view,seat?.id,flying,crowd,aspect,camera,gl,scene]);
 useEffect(()=>{const canvas=gl.domElement;let pointer:number|null=null;let last=[0,0];const down=(e:PointerEvent)=>{if(view!=='seat'||flight.current)return;pointer=e.pointerId;last=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId)};const move=(e:PointerEvent)=>{if(pointer!==e.pointerId||view!=='seat'||flight.current)return;angles.current.yaw-=(e.clientX-last[0])*.004;angles.current.pitch=Math.max(-.75,Math.min(.65,angles.current.pitch+(e.clientY-last[1])*.004));last=[e.clientX,e.clientY];camera.lookAt(...lookTarget(camera.position.toArray() as Point,angles.current.yaw,angles.current.pitch))};const up=()=>{pointer=null};canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);return()=>{canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up)};},[view,camera,gl]);
 useFrame((_,delta)=>{if(!controls.current)return;if(!flight.current){if(panBounds&&controls.current.enabled)constrainOrbitTarget(camera,controls.current.target,panBounds);return;}elapsed.current+=delta;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;camera.position.set(...flightPoint(from.current,to.current,elapsed.current,reduced,flightControl.current));rotateFlight(fromRotation.current,toRotation.current,flightProgress(elapsed.current,reduced),camera.quaternion);if(reduced||elapsed.current>=flightDuration){flight.current=false;const d=new THREE.Vector3(...target.current).sub(camera.position);angles.current={yaw:Math.atan2(d.x,d.z),pitch:Math.atan2(d.y,Math.hypot(d.x,d.z))};controls.current.target.set(...target.current);controls.current.enabled=view!=='seat';onReady(navigationGeneration);}});
 const maxDistance=330*overviewScale(view==='sector'?1.5:aspect);
 return createElement(OrbitControls,{ref:controls,onStart:()=>{manualCamera.current=true;},makeDefault:true,enableDamping:true,enablePan:panBounds!==null,minDistance:view==='sector'?sectorMinDistance:45,maxDistance,minPolarAngle:.15,maxPolarAngle:view==='sector'?sectorMaxPolarAngle:Math.PI*.47,enableZoom:view!=='seat',rotateSpeed:.5});
}
