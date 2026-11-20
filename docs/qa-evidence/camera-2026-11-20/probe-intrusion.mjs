import { readFile, writeFile, unlink } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const {createElement,act}=await import('react');
await import('react-dom/client');
let reduced=false;
globalThis.window={navigator:globalThis.navigator,document:{createElement(){}},matchMedia(){return {matches:reduced}},devicePixelRatio:1};
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const {createRoot}=await import('@react-three/fiber');
const {DoubleSide,Mesh,MeshBasicMaterial,Raycaster,Vector3}=await import('three');
const {createEneaModel}=await import('./src/integrations/eneaModel.ts');
const {resolveSeat}=await import('./src/data/stadium.ts');
const {eyePosition}=await import('./src/domain/camera.ts');
const deck=createEneaModel().find(part=>part.name==='Stepped bowl');
const deckMesh=new Mesh(deck.geometry,new MeshBasicMaterial({side:DoubleSide}));

const results=[];
for(const revision of ['9f36318','working tree']){
 const path='.camera-intrusion-probe.mjs';
 const source=revision==='working tree'
  ? await readFile('src/components/Stadium.tsx','utf8')
  : execFileSync('git',['show',revision+':src/components/Stadium.tsx'],{encoding:'utf8'});
 const result=await build({
  stdin:{contents:source+'\nexport {Camera};\n',resolveDir:process.cwd()+'/src/components',loader:'tsx'},
  bundle:true,write:false,format:'esm',packages:'external',jsx:'automatic'
 });
 await writeFile(path,result.outputFiles[0].text);
 let root;
 try{
  const {Camera}=await import('./'+path+'?rev='+encodeURIComponent(revision));
  class FakeCanvas extends EventTarget {
   style={};
   ownerDocument=new EventTarget();
   toDataURL(){return 'data:image/jpeg;base64,cpu';}
   setPointerCapture(){}
  }
  const canvas=new FakeCanvas(),frames=[],captures=[];
  const gl={domElement:canvas,setPixelRatio(){},setSize(){},render(scene,camera){
   scene.updateMatrixWorld();
   if(camera.parent===null&&camera.matrixWorldAutoUpdate)camera.updateMatrixWorld();
   frames.push(camera.position.clone());
  }};
  root=createRoot(canvas);
  await root.configure({frameloop:'never',dpr:1,gl,camera:{position:[148,138,168],fov:43,near:.1,far:1200},size:{width:900,height:555}});
  let store, elapsed=0, ready=0;
  async function commit(seat,reset){
   await act(async()=>{store=root.render(createElement(Camera,{view:'seat',seat,sector:seat.sectorId,reset,onReady:()=>ready++,onPreview:()=>captures.push(frames.at(-1))}));});
  }
  function frame(n){
   for(let i=0;i<n;i++)store.getState().advance(++elapsed/60,false,store.getState());
  }
  const from=resolveSeat('I-1-46-29'),to=resolveSeat('101-1-10');
  await commit(from,0);frame(1);
  await commit(to,1);frame(144);
  const ray=new Raycaster(),hits=[];
  for(let i=1;i<frames.length;i++){
   const previous=frames[i-1],next=frames[i],offset=next.clone().sub(previous);
   ray.far=offset.length();ray.set(previous,offset.normalize());
   const hit=ray.intersectObject(deckMesh)[0];
   if(hit)hits.push(hit.point.toArray());
  }
  assert.equal(ready,2);
  assert.equal(captures.length,2);
  assert.ok(captures[1].distanceTo(new Vector3(...eyePosition(to)))<.00001);
  assert.equal(store.getState().controls.enabled,false);
  const transferMinY=Math.min(...frames.map(point=>point.y));

  reduced=true;
  await commit(from,2);frame(1);
  assert.equal(ready,3);
  assert.ok(captures[2].distanceTo(new Vector3(...eyePosition(from)))<.00001);
  reduced=false;
  results.push({revision,flightFrames:144,transferMinY,stepIntersections:hits,finalCapture:captures[1].toArray(),reducedCapture:captures[2].toArray()});
 }finally{
  if(root)await act(async()=>root.unmount());
  await unlink(path);
 }
}
assert.ok(results[0].stepIntersections.length>0);
assert.equal(results[1].stepIntersections.length,0);
console.log(JSON.stringify(results,null,2));
