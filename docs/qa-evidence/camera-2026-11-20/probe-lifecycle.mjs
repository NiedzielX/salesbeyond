import { readFile, writeFile, unlink } from 'node:fs/promises';
import { build } from 'esbuild';
import assert from 'node:assert/strict';
const {createElement,useState,act}=await import('react');
await import('react-dom/client');
globalThis.window={navigator:globalThis.navigator,document:{createElement(){}},matchMedia(){return {matches:false}},devicePixelRatio:1,event:undefined};
const {createRoot}=await import('@react-three/fiber');
const {Vector3}=await import('three');
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const bundlePath = '.camera-lifecycle-probe.mjs';
const result=await build({
 stdin:{contents:(await readFile('src/components/Stadium.tsx','utf8'))+'\nexport {Camera};\n',resolveDir:process.cwd()+'/src/components',loader:'tsx'},
 bundle:true,write:false,format:'esm',packages:'external',jsx:'automatic'
});
await writeFile(bundlePath,result.outputFiles[0].text);
try{
 const {Camera}=await import('./'+bundlePath);
 function Harness(props){
  const key=[props.view,props.seat?.id,props.sector,props.reset].join(':');
  const [ready,setReady]=useState(null);
  return createElement(Camera,{...props,crowd:false,flying:ready!==key,onReady:()=>{props.onReady();setReady(key);}});
 }

 const {getSeat}=await import('./src/data/stadium.ts');
 const {eyePosition}=await import('./src/domain/camera.ts');
 class FakeCanvas extends EventTarget {
  style={};
  ownerDocument=new EventTarget();
  toDataURL(){return 'data:image/jpeg;base64,cpu';}
  setPointerCapture(){}
 }
 const canvas=new FakeCanvas();
 const frames=[];
 const gl={domElement:canvas,setPixelRatio(){},setSize(){},render(scene,camera){
  scene.updateMatrixWorld();
  if(camera.parent===null&&camera.matrixWorldAutoUpdate)camera.updateMatrixWorld();
  const direction=camera.getWorldDirection(new Vector3());
  frames.push({eye:camera.position.toArray(),forward:direction.toArray(),aspect:camera.aspect});
 }};
 const root=createRoot(canvas);
 async function configure(width,height){
  await root.configure({frameloop:'never',dpr:1,gl,camera:{position:[148,138,168],fov:43,near:.1,far:1200},size:{width,height}});
 }
 await configure(900,555);
 const seatA=getSeat('102',1,9),seatB=getSeat('III-2',46,28);
 let props={view:'seat',seat:seatA,sector:seatA.sectorId,reset:0,onReady(){},onPreview(){captures.push(frames.at(-1));}};
 const captures=[];
 let store;
 async function commit(next={}){
  props={...props,...next};
  await act(async()=>{store=root.render(createElement(Harness,props));});
 }
 await commit();
 const initialCamera=store.getState().camera;
 const controls=store.getState().controls;
 const expectSeat=seat=>{
  const {camera}=store.getState();
  const eye=new Vector3(...eyePosition(seat));
  assert.equal(camera,initialCamera);
  assert.ok(camera.position.distanceTo(eye)<.00001);
  assert.ok(camera.getWorldDirection(new Vector3()).distanceTo(new Vector3(0,1,0).sub(eye).normalize())<.00001);
  assert.equal(controls.enabled,false);
 };
 expectSeat(seatA);
 let times=0;
 async function frame(n){
   await act(async()=>{
  for(let i=0;i<n;i++)store.getState().advance(++times/60,false,store.getState());
   });
 }
 await frame(10);expectSeat(seatA);
 await act(async()=>configure(350,550));await frame(5);expectSeat(seatA);
 await commit({seat:{...seatA,price:200},onReady:()=>{}});
 await frame(5);expectSeat(seatA);
 await commit({view:'sector',seat:null,sector:seatB.sectorId,reset:1});
 await frame(30);
 await commit({view:'seat',seat:seatB,sector:seatB.sectorId,reset:2});
 await frame(70);
 await commit({view:'seat',seat:seatA,sector:seatA.sectorId,reset:3});
 await frame(150);expectSeat(seatA);
 assert.equal(captures.length,3);
 const minY=Math.min(...frames.map(f=>f.eye[1]));
 console.log(JSON.stringify({frames:frames.length,captures,minY,controls:controls.constructor.name},null,2));
 await act(async()=>root.unmount());
}finally{await unlink(bundlePath);}
