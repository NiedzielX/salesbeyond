import assert from 'node:assert/strict';
import test from 'node:test';
import {act,createElement,Fragment} from 'react';
import {createRoot,extend,useThree,type RootState} from '@react-three/fiber';
import * as THREE from 'three';
import {StadiumCamera,type StadiumCameraProps} from '../components/StadiumCamera.ts';
import {getSeat} from '../data/stadium.ts';

class FakeCanvas extends EventTarget{
 style:Record<string,string>={};ownerDocument=new EventTarget();captures=0;
 setPointerCapture(){this.captures++}releasePointerCapture(){}
 toDataURL(){return 'data:image/jpeg;base64,AA=='}
}

function pointer(target:EventTarget,type:string,x:number,y:number){
 const event=new Event(type);Object.assign(event,{pointerType:'mouse',pointerId:1,button:0,clientX:x,clientY:y});target.dispatchEvent(event);
}

test('rzeczywista kamera centruje się jednorazowo bez ruchu oka i bez skutków ubocznych',async()=>{
 extend(THREE);
 const originalWindow=globalThis.window,originalAct=globalThis.IS_REACT_ACT_ENVIRONMENT;
 let reducedMotion=false;
 globalThis.window={matchMedia:()=>({matches:reducedMotion,addEventListener(){},removeEventListener(){}})} as unknown as Window&typeof globalThis;
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const canvas=new FakeCanvas();let latest:RootState|null=null,ready=0,previews=0;
 const root=createRoot(canvas as unknown as HTMLCanvasElement);
 const seat=getSeat('II-2',1,16);
 let props:StadiumCameraProps={view:'seat',seat,sector:seat.sectorId,row:seat.row,rowFocused:false,reset:0,crowd:false,flying:false,navigationGeneration:0,recenterRequest:null,onReady:()=>{ready++},onPreview:()=>{previews++}};
 function Observer(){latest=useThree();return null}
 const render=async()=>act(async()=>{root.render(createElement(Fragment,null,createElement(StadiumCamera,props),createElement(Observer)))});
 try{
  await root.configure({frameloop:'never',size:{width:900,height:555},camera:{position:[148,138,168],fov:43,near:.1,far:1200},gl:{domElement:canvas,setPixelRatio(){},setSize(){},render(){}} as unknown as THREE.WebGLRenderer});
  await render();
  assert.ok(latest);const state=latest as RootState;const camera=state.camera;
  const readyBaseline=ready,previewBaseline=previews;
  const eye=camera.position.clone();
  pointer(canvas,'pointerdown',100,100);pointer(canvas,'pointermove',145,122);pointer(canvas,'pointerup',145,122);
  const handAim=camera.getWorldDirection(new THREE.Vector3());
  props={...props,recenterRequest:{token:1,seatId:seat.id}};await render();
  const expected=new THREE.Vector3(0,1,0).sub(camera.position).normalize();
  assert.ok(camera.position.distanceTo(eye)<1e-6,'recenter keeps the current eye');
  assert.ok(camera.getWorldDirection(new THREE.Vector3()).distanceTo(expected)<1e-6,'camera aims at the pitch');
  assert.ok(handAim.distanceTo(expected)>.01,'precondition: the supporter had looked away');
  assert.equal(ready,readyBaseline,'recenter does not report another flight arrival');
  assert.equal(previews,previewBaseline,'recenter does not capture another thumbnail');
  assert.equal((state.controls as {enabled?:boolean}|undefined)?.enabled,false,'seat orbit remains disabled');

  pointer(canvas,'pointerdown',200,200);pointer(canvas,'pointermove',201,201);pointer(canvas,'pointerup',201,201);
  const afterSmallDrag=camera.getWorldDirection(new THREE.Vector3());
  assert.ok(afterSmallDrag.distanceTo(expected)<.01,'first small drag starts from the centered angles');
  assert.ok(afterSmallDrag.distanceTo(expected)>.001,'first small drag is applied');
  const sameTokenDirection=afterSmallDrag.clone();await render();
  assert.ok(camera.getWorldDirection(new THREE.Vector3()).distanceTo(sameTokenDirection)<1e-6,'same token is not replayed');
  props={...props,recenterRequest:{token:2,seatId:seat.id}};await render();
  assert.ok(camera.getWorldDirection(new THREE.Vector3()).distanceTo(expected)<1e-6,'a new token recenters again');
  reducedMotion=true;
  pointer(canvas,'pointerdown',250,250);pointer(canvas,'pointermove',280,265);pointer(canvas,'pointerup',280,265);
  assert.ok(camera.getWorldDirection(new THREE.Vector3()).distanceTo(expected)>.01,'reduced-motion precondition: the supporter looked away');
  props={...props,recenterRequest:{token:3,seatId:seat.id}};await render();
  assert.ok(camera.getWorldDirection(new THREE.Vector3()).distanceTo(expected)<1e-6,'accepted recenter also works with reduced motion');
  assert.ok(camera.position.distanceTo(eye)<1e-6,'reduced-motion recenter still keeps the current eye');
 }finally{
  await act(async()=>root.unmount());globalThis.window=originalWindow;globalThis.IS_REACT_ACT_ENVIRONMENT=originalAct;
 }
});

test('stary, błędny i odrzucony request nie odtwarza się po renderze ani remouncie',async()=>{
 extend(THREE);
 const originalWindow=globalThis.window,originalAct=globalThis.IS_REACT_ACT_ENVIRONMENT;
 globalThis.window={matchMedia:()=>({matches:true,addEventListener(){},removeEventListener(){}})} as unknown as Window&typeof globalThis;
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const seat=getSeat('IV-2',3,12);const canvas=new FakeCanvas();let latest:RootState|null=null;
 const base:StadiumCameraProps={view:'seat',seat,sector:seat.sectorId,row:seat.row,rowFocused:false,reset:0,crowd:false,flying:false,navigationGeneration:0,recenterRequest:{token:10,seatId:seat.id},onReady:()=>undefined,onPreview:()=>undefined};
 async function mount(props:StadiumCameraProps){
  const root=createRoot(canvas as unknown as HTMLCanvasElement);function Observer(){latest=useThree();return null}
  await root.configure({frameloop:'never',size:{width:390,height:844},camera:{position:[148,138,168],fov:43,near:.1,far:1200},gl:{domElement:canvas,setPixelRatio(){},setSize(){},render(){}} as unknown as THREE.WebGLRenderer});
  await act(async()=>root.render(createElement(Fragment,null,createElement(StadiumCamera,props),createElement(Observer))));return root;
 }
 let root=await mount(base);
 try{
  const camera=(latest as RootState).camera;pointer(canvas,'pointerdown',50,50);pointer(canvas,'pointermove',90,65);pointer(canvas,'pointerup',90,65);const direction=camera.getWorldDirection(new THREE.Vector3());
  await act(async()=>root.render(createElement(StadiumCamera,base)));
  assert.ok(camera.getWorldDirection(new THREE.Vector3()).distanceTo(direction)<1e-6,'token present at mount is only a baseline');
  await act(async()=>root.unmount());latest=null;root=await mount(base);
  const remounted=(latest as RootState).camera;pointer(canvas,'pointerdown',60,60);pointer(canvas,'pointermove',85,70);pointer(canvas,'pointerup',85,70);const remountDirection=remounted.getWorldDirection(new THREE.Vector3());
  await act(async()=>root.render(createElement(StadiumCamera,{...base,recenterRequest:{token:11,seatId:'other-seat'}})));
  assert.ok(remounted.getWorldDirection(new THREE.Vector3()).distanceTo(remountDirection)<1e-6,'wrong-seat request is consumed without applying');
  await act(async()=>root.render(createElement(StadiumCamera,{...base,recenterRequest:{token:11,seatId:seat.id}})));
  assert.ok(remounted.getWorldDirection(new THREE.Vector3()).distanceTo(remountDirection)<1e-6,'consumed token is not replayed when its seat later matches');
  await act(async()=>root.render(createElement(StadiumCamera,{...base,flying:true,recenterRequest:{token:12,seatId:seat.id}})));
  await act(async()=>root.render(createElement(StadiumCamera,{...base,flying:false,recenterRequest:{token:12,seatId:seat.id}})));
  assert.ok(remounted.getWorldDirection(new THREE.Vector3()).distanceTo(remountDirection)<1e-6,'request rejected during flight is not replayed after arrival');
 }finally{
  await act(async()=>root.unmount());globalThis.window=originalWindow;globalThis.IS_REACT_ACT_ENVIRONMENT=originalAct;
 }
});

test('stare zakończenie lotu nie odblokowuje nowszego wyboru ani nie gubi jego miniatury',async()=>{
 extend(THREE);
 const originalWindow=globalThis.window,originalAct=globalThis.IS_REACT_ACT_ENVIRONMENT;
 globalThis.window={matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}})} as unknown as Window&typeof globalThis;
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const canvas=new FakeCanvas();let latest:RootState|null=null,parentGeneration=0,parentFlying=false;
 const emitted:number[]=[],accepted:number[]=[],previews:number[]=[];
 const root=createRoot(canvas as unknown as HTMLCanvasElement);
 function Observer(){latest=useThree();return null}
 const onReady=(generation:number)=>{emitted.push(generation);if(generation===parentGeneration){parentFlying=false;accepted.push(generation)}};
 let renderedSeat=16;
 const onPreview=()=>previews.push(renderedSeat);
 const props=(number:number,flying:boolean):StadiumCameraProps=>({
  view:'seat',seat:getSeat('II-2',1,number),sector:'II-2',row:1,rowFocused:true,reset:0,crowd:false,flying,
  navigationGeneration:parentGeneration,recenterRequest:null,
  onReady,onPreview,
 });
 const render=async(number:number,flying:boolean)=>{renderedSeat=number;await act(async()=>root.render(createElement(Fragment,null,createElement(StadiumCamera,props(number,flying)),createElement(Observer))))};
 try{
  await root.configure({frameloop:'never',size:{width:900,height:555},camera:{position:[148,138,168],fov:43,near:.1,far:1200},gl:{domElement:canvas,setPixelRatio(){},setSize(){},render(){}} as unknown as THREE.WebGLRenderer});
  await render(16,false);
  parentGeneration=1;parentFlying=true;await render(17,true);
  (latest as RootState).advance(2.39,false,latest as RootState);
  parentGeneration=2;parentFlying=true; // The parent chose seat 18 before the separate R3F root committed its props.
  (latest as RootState).advance(2.41,false,latest as RootState);
  assert.equal(parentFlying,true,'arrival from generation 1 is rejected after generation 2 was requested');
  await render(18,parentFlying);
  (latest as RootState).advance(4.83,false,latest as RootState);
  await render(18,parentFlying);
  assert.deepEqual(emitted,[0,1,2]);
  assert.deepEqual(accepted,[0,2]);
  assert.deepEqual(previews,[16,18],'the final seat receives its own thumbnail after the accepted arrival');
 }finally{
  await act(async()=>root.unmount());globalThis.window=originalWindow;globalThis.IS_REACT_ACT_ENVIRONMENT=originalAct;
 }
});
