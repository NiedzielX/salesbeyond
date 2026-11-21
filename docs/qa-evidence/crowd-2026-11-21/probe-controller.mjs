// CPU component/controller verification only. No browser or graphics context.
import {readFile,writeFile,unlink} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const {createElement,Fragment,StrictMode,useState,act}=await import('react');
await import('react-dom/client');
let reduced=false;
globalThis.window={navigator:globalThis.navigator,document:{createElement(){}},matchMedia(){return {matches:reduced}},devicePixelRatio:1};
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const {createRoot,extend}=await import('@react-three/fiber');
extend(await import('three'));
const {Matrix4,Vector3}=await import('three');
const {stadiumSeats,resolveSeat,allSectors,sectorRows,seatsInRow}=await import('./src/data/stadium.ts');
const {eyePosition}=await import('./src/domain/camera.ts');
const ids=new Map(stadiumSeats().map((s,i)=>[s.id,i]));
const bundlePath='.crowd-controller-probe.mjs';
const result=await build({stdin:{contents:(await readFile('src/components/Stadium.tsx','utf8'))+'\nexport {Camera,Crowd};',resolveDir:process.cwd()+'/src/components',loader:'tsx'},bundle:true,write:false,format:'esm',packages:'external',jsx:'automatic'});
await writeFile(bundlePath,result.outputFiles[0].text);
let root;
try{
 const {Camera,Crowd}=await import('./'+bundlePath);
 class FakeCanvas extends EventTarget{style={};ownerDocument=new EventTarget();toDataURL(){return 'data:image/jpeg;base64,CPU_TEST_ONLY';}setPointerCapture(){}}
 const canvas=new FakeCanvas(),captures=[],frames=[];let latestScene;
 const gl={domElement:canvas,setPixelRatio(){},setSize(){},render(scene,camera){scene.updateMatrixWorld();camera.updateMatrixWorld();latestScene=scene;frames.push(camera.position.toArray());}};
 root=createRoot(canvas);await root.configure({frameloop:'never',gl,dpr:1,camera:{position:[148,138,168],fov:43,near:.1,far:1200},size:{width:900,height:555}});
 const seatA=resolveSeat('II-3-54-19'),seatB=resolveSeat('101-1-10'),seatC=resolveSeat('III-2-46-28');
 assert.ok(seatA&&seatB&&seatC);
 function hidden(mesh,id){const matrix=new Matrix4();mesh.getMatrixAt(ids.get(id),matrix);return matrix.elements[0]===0&&matrix.elements[5]===0&&matrix.elements[10]===0;}
 function Harness(props){
  const key=[props.view,props.seat?.id??'',props.sector??'',props.reset].join(':');
  const [arrived,setArrived]=useState(null);const flying=arrived!==key;
  return createElement(Fragment,null,
   createElement(Crowd,{enabled:props.crowd,view:props.view,seatId:props.seat?.id??null,flying}),
   createElement(Camera,{...props,flying,onReady:()=>setArrived(key),onPreview:()=>{
    const mesh=latestScene.getObjectByName('Simulated crowd');
    captures.push({seatId:props.seat?.id,crowd:props.crowd,meshPresent:!!mesh,ownHidden:mesh?hidden(mesh,props.seat.id):true,otherAHidden:mesh?hidden(mesh,seatA.id):false,eye:latestCamera.position.toArray()});
   }}));
 }
 let props={view:'seat',seat:seatA,sector:seatA.sectorId,reset:0,crowd:false},store,latestCamera,time=0;
 async function commit(next={}){props={...props,...next};await act(async()=>{store=root.render(createElement(StrictMode,null,createElement(Harness,props)));});latestCamera=store.getState().camera;}
 // Capture reads this before the first commit returns, so use renderer's camera.
 const originalRender=gl.render;gl.render=(scene,camera)=>{latestCamera=camera;originalRender(scene,camera);};
 async function advance(count){await act(async()=>{for(let i=0;i<count;i++)store.getState().advance(++time/60,false,store.getState());});}
 await commit();assert.equal(captures.length,1);assert.equal(captures.at(-1).meshPresent,false);
 const camera=store.getState().camera,position=camera.position.clone(),rotation=camera.quaternion.clone();
 await commit({crowd:true});assert.equal(captures.length,2);assert.equal(captures.at(-1).meshPresent,true);assert.equal(captures.at(-1).ownHidden,true);
 assert.ok(camera.position.distanceTo(position)<1e-8);assert.ok(camera.quaternion.angleTo(rotation)<1e-7);
 await commit({seat:seatB,sector:seatB.sectorId,reset:1});await advance(24);
 await commit({crowd:false});assert.equal(captures.length,2,'no thumbnail from an unfinished flight');
 await commit({crowd:true});await commit({seat:seatC,sector:seatC.sectorId,reset:2});await advance(150);
 const settled=captures.at(-1);assert.equal(settled.seatId,seatC.id);assert.equal(settled.crowd,true);assert.equal(settled.ownHidden,true);assert.equal(settled.otherAHidden,false,'source figure restored before thumbnail');
 assert.ok(new Vector3(...settled.eye).distanceTo(new Vector3(...eyePosition(seatC)))<1e-5);
 const before=captures.length;await commit({crowd:false});assert.equal(captures.length,before+1);assert.equal(captures.at(-1).meshPresent,false);
 reduced=true;await commit({seat:seatA,sector:seatA.sectorId,reset:3,crowd:true});await advance(1);assert.equal(captures.at(-1).seatId,seatA.id);assert.equal(captures.at(-1).ownHidden,true);
 await commit({view:'overview',seat:null,sector:null,reset:4});await advance(1);
 const overviewMesh=store.getState().scene.getObjectByName('Simulated crowd');assert.equal(hidden(overviewMesh,seatA.id),false,'reset restores audience');
 let representatives=0;
 for(const sector of allSectors){const rows=sectorRows(sector.id);for(const row of [rows[0],rows[Math.floor(rows.length/2)],rows.at(-1)]){
  const seats=seatsInRow(sector.id,row),seat=seats[Math.floor(seats.length/2)];
  await commit({view:'seat',seat,sector:sector.id,reset:5+representatives,crowd:true});await advance(1);
  assert.equal(captures.at(-1).seatId,seat.id);assert.equal(captures.at(-1).ownHidden,true);
  assert.ok(new Vector3(...captures.at(-1).eye).distanceTo(new Vector3(...eyePosition(seat)))<1e-5);representatives++;
 }}
 console.log(JSON.stringify({kind:'CPU_CROWD_CONTROLLER',strictMode:true,representatives,frames:frames.length,captures,browserVerified:false,webglVerified:false},null,2));
}finally{if(root)await act(async()=>root.unmount());await unlink(bundlePath);}
