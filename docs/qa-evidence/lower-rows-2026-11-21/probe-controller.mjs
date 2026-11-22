// CPU fixture against Camera, Drei and Three; no rendering context.
import assert from 'node:assert/strict';
import {readFile,writeFile,unlink} from 'node:fs/promises';
import {build} from 'esbuild';
import {act,createElement,StrictMode} from 'react';
import 'react-dom/client';
import {Vector3} from 'three';
import {allSectors,sectorRows,seatsInRow,resolveSeat} from './src/data/stadium.ts';
import {eyePosition} from './src/domain/camera.ts';
import {initialSelection,selectionReducer} from './src/domain/selection.ts';
let reduced=false;
globalThis.window={navigator:globalThis.navigator,document:{createElement(){}},matchMedia(){return {matches:reduced}},devicePixelRatio:1};
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const {createRoot}=await import('@react-three/fiber');
const bundlePath='.lower-row-camera-bundle.mjs';
const source=await readFile('src/components/Stadium.tsx','utf8');
const result=await build({stdin:{contents:source+'\nexport {Camera};',resolveDir:process.cwd()+'/src/components',loader:'tsx'},bundle:true,write:false,format:'esm',packages:'external',jsx:'automatic'});
await writeFile(bundlePath,result.outputFiles[0].text);
let root;
try{
 const {Camera}=await import('./'+bundlePath);
 class FakeCanvas extends EventTarget {
  clientWidth=900;clientHeight=555;style={};ownerDocument=new EventTarget();
  setPointerCapture(){} releasePointerCapture(){} toDataURL(){return 'data:image/jpeg;base64,CPU_ONLY';}
 }
 const canvas=new FakeCanvas(),captures=[];
 let cameraForCapture,frameNumber=0;
 const gl={domElement:canvas,setPixelRatio(){},setSize(){},render(scene,camera){scene.updateMatrixWorld();camera.updateMatrixWorld();cameraForCapture=camera;}};
 root=createRoot(canvas);
 await root.configure({frameloop:'never',gl,dpr:1,camera:{position:[148,138,168],fov:43,near:.1,far:1200},size:{width:900,height:555}});
 let props={view:'sector',seat:null,sector:'II-2',row:1,rowFocused:false,reset:0,crowd:false,flying:false,onReady(){},onPreview(){captures.push(cameraForCapture.position.clone());}},store,camera,controls;
 async function commit(patch={}){
  props={...props,...patch};
  await act(async()=>{store=root.render(createElement(StrictMode,null,createElement(Camera,props)));});
  ({camera,controls}=store.getState());
 }
 async function advance(count){await act(async()=>{for(let i=0;i<count;i++){const state=store.getState();state.advance(++frameNumber/60,false,state);}});}
 function event(target,type,fields){const e=new Event(type,{cancelable:true});Object.assign(e,fields);target.dispatchEvent(e);}
 function pointer(target,type,fields){event(target,type,{pointerType:'mouse',button:2,pointerId:1,clientX:450,clientY:510,pageX:450,pageY:510,...fields});}
 function drag(y,options={}){
  pointer(canvas,'pointerdown',options);pointer(canvas.ownerDocument,'pointermove',{clientY:510+y,pageY:510+y,...options});pointer(canvas.ownerDocument,'pointerup',options);
 }
 function touchDrag(y){
  const touch={pointerType:'touch',button:0};
  pointer(canvas,'pointerdown',{...touch,pointerId:1});
  pointer(canvas,'pointerdown',{...touch,pointerId:2,clientX:470,pageX:470});
  pointer(canvas.ownerDocument,'pointermove',{...touch,pointerId:1,clientY:510+y,pageY:510+y});
  pointer(canvas.ownerDocument,'pointermove',{...touch,pointerId:2,clientX:470,pageX:470,clientY:510+y,pageY:510+y});
  pointer(canvas.ownerDocument,'pointerup',{...touch,pointerId:1});
  pointer(canvas.ownerDocument,'pointerup',{...touch,pointerId:2});
 }
 function project(seat){camera.updateMatrixWorld();return new Vector3(...seat.position).project(camera);}
 function state(seat){return {enablePan:controls.enablePan,minDistance:controls.minDistance,target:controls.target.toArray(),eye:camera.position.toArray(),rowNdc:project(seat).toArray()};}
 function near(a,b,message){assert.ok(a.distanceTo(b)<1e-6,message);}
 const low=seatsInRow('II-2',1)[18];
 const entered=selectionReducer(initialSelection,{type:'sector',id:'II-2'});
 assert.equal(entered.row,1);assert.equal(entered.rowFocused,false);
 const activated=selectionReducer(entered,{type:'row',row:entered.row});
 assert.equal(activated.row,1);assert.equal(activated.rowFocused,true);
 await commit();await advance(180);
 const blockTarget=controls.target.clone();
 // Wheel input and the shallowest orbit reproduce the reported stuck framing.
 for(let i=0;i<100;i++)event(canvas,'wheel',{deltaY:-100,clientX:450,clientY:280});
 controls.setPolarAngle(Math.PI*.49);await advance(160);
 const beforePan=state(low);
 drag(-480);await advance(360);drag(-480);await advance(360);
 const afterPan=state(low);
 await commit({row:activated.row,rowFocused:activated.rowFocused});await advance(150);
 const afterRowSelection=state(low);
 const sample={beforePan,afterPan,afterRowSelection};
 if(process.argv.includes('--baseline')){
  assert.equal(beforePan.enablePan,false);
  assert.ok(beforePan.rowNdc[1]<-1,'lower row cannot be seen in the zoomed shallow orbit');
  assert.deepEqual(afterPan.target,blockTarget.toArray());
  assert.deepEqual(afterRowSelection.target,blockTarget.toArray());
 }else{
  assert.ok(beforePan.rowNdc[1]<-1);
  assert.ok(new Vector3(...afterPan.target).distanceTo(blockTarget)>15,'right-drag moves the block orbit target');
  assert.ok(Math.abs(afterPan.rowNdc[1])<1,'right-drag reveals the lowest row');
  assert.ok(afterPan.eye[1]>1.7&&afterPan.eye[1]<1.85,'sector orbit descends below the first chair while the eye stays above the pitch');
  assert.ok(Math.abs(afterRowSelection.rowNdc[1])<.1,'explicit row follows its position');
  assert.equal(controls.enabled,true);
  const high=seatsInRow('II-2',54)[18];
  await commit({row:54});await advance(150);
  assert.ok(Math.abs(project(high).y)<.1);
  drag(-480,{button:0,shiftKey:true});await advance(420);drag(-480,{button:0,shiftKey:true});await advance(420);
  assert.ok(controls.target.y<15,'Shift+left drag moves downward');
  const manualEye=camera.position.clone(),manualTarget=controls.target.clone();
  await commit({inventory:new Map([['II-2-1-19',{...low,available:!low.available}]]),crowd:true});await advance(4);
  near(camera.position,manualEye,'inventory poll and crowd toggle retain camera position');
  near(controls.target,manualTarget,'inventory poll and crowd toggle retain orbit target');
  await act(async()=>{store.getState().setSize(390,510);});await advance(4);
  near(camera.position,manualEye,'resize retains a manual orbit');
  near(controls.target,manualTarget,'resize retains a manual target');
  await commit({reset:1,rowFocused:false});await advance(150);
  const beforeTouch=controls.target.clone();touchDrag(-480);await advance(360);
  assert.ok(controls.target.y<beforeTouch.y-10,'two-finger drag pans the sector');
  const seat=resolveSeat('II-2-1-19');
  await commit({view:'seat',row:1,rowFocused:true,seat,flying:true});await advance(150);await commit({flying:false});
  near(camera.position,new Vector3(...eyePosition(seat)),'seat uses canonical eye position');
  assert.equal(controls.enabled,false);assert.equal(controls.enablePan,false);assert.equal(captures.length,1);
  near(captures[0],camera.position,'thumbnail uses settled seat camera');
  await commit({view:'sector',seat,reset:2});await advance(150);
  assert.ok(Math.abs(project(seat).y)<.1,'back follows the chosen row');
  await commit({view:'overview',seat:null,sector:null,reset:3});await advance(150);
  assert.equal(controls.enablePan,false);assert.equal(controls.minDistance,45);
  assert.equal(controls.maxPolarAngle,Math.PI*.47);
  near(controls.target,new Vector3(),'overview remains centered');
  let rowsChecked=0;
  for(const aspect of [390/510,900/555]){
   await act(async()=>{store.getState().setSize(aspect*555,555);});
   reduced=true;
   for(const {id:sector} of allSectors){
    const rows=sectorRows(sector);
    for(const row of [rows[0],rows[Math.floor(rows.length/2)],rows.at(-1)]){
     await commit({view:'sector',sector,row,rowFocused:true,reset:4+rowsChecked});await advance(2);
     assert.ok(camera.position.y>3);
     for(const s of seatsInRow(sector,row)){
      const p=project(s);assert.ok(Math.abs(p.x)<.9&&Math.abs(p.y)<.9&&Math.abs(p.z)<1,`${aspect} ${s.id} ${p.toArray()}`);
     }
     rowsChecked++;
    }
   }
  }
  console.log(JSON.stringify({...sample,initialRowActivation:{enteredRow:entered.row,enteredFocused:entered.rowFocused,activatedFocused:activated.rowFocused},rowsChecked,captures:captures.length,frameNumber,browserVerified:false,webglVerified:false},null,2));
 }
}finally{if(root)await act(async()=>root.unmount());await unlink(bundlePath);}
