import assert from 'node:assert/strict';
import {act,createElement as h} from 'react';
import 'react-dom/client';
import {BoxGeometry,Group,InstancedMesh,Matrix4,MeshBasicMaterial,Vector3} from 'three';

globalThis.IS_REACT_ACT_ENVIRONMENT=true;
globalThis.window={navigator:globalThis.navigator,document:{createElement(){}},matchMedia:()=>({matches:false}),devicePixelRatio:1};
const {createRoot,events,extend}=await import('@react-three/fiber');
extend({Group});

const canvas=new EventTarget(),width=400,height=300,root=createRoot(canvas);
await root.configure({frameloop:'never',gl:{domElement:canvas,setPixelRatio(){},setSize(){},render(){}},events,size:{width,height},camera:{position:[0,0,6]}});
let calls=0,trace=[],store;
const geometry=new BoxGeometry(.5,.5,.3),material=new MeshBasicMaterial();
const meshes=[.25,-.25].map(z=>{
 const mesh=new InstancedMesh(geometry,material,2);
 [-1,1].forEach((x,i)=>mesh.setMatrixAt(i,new Matrix4().makeTranslation(x,0,z)));
 const original=mesh.raycast;
 mesh.raycast=function(...args){calls++;return original.apply(this,args)};
 return mesh;
});
const outer={onPointerOver:()=>trace.push('outer over'),onPointerOut:()=>trace.push('outer out')};
const inner={onPointerMove:e=>{e.stopPropagation();trace.push(`move ${e.instanceId}`)},onPointerOut:e=>trace.push(`out ${e.instanceId}`),onClick:e=>{e.stopPropagation();trace.push(`click ${e.instanceId}`)}};
const pick=(x,name='onPointerMove')=>{
 const state=store.getState(),point=new Vector3(x,0,.25).project(state.camera);
 state.events.handlers[name]({offsetX:(point.x+1)*width/2,offsetY:height/2,pointerId:1});
};
const results=[];
for(const [label,outerHandlers,innerHandlers,roots] of [['nested',outer,inner,2],['one',{},inner,1],['inactive',{},{},0],['reactivated',{},inner,1]]){
 await act(async()=>{store=root.render(h('group',outerHandlers,h('group',innerHandlers,...meshes.map((object,i)=>h('primitive',{key:i,object})))))});
 const state=store.getState();state.scene.updateMatrixWorld();state.camera.updateMatrixWorld();calls=0;trace=[];
 for(const x of [-1,-1,1,20])pick(x);
 pick(1,'onPointerDown');pick(1,'onClick');pick(20);
 const expected=roots?['move 0','move 0','out 0','move 1','out 1','click 1']:[];
 assert.deepEqual(trace,expected,label);assert.equal(state.internal.interaction.length,roots,label);assert.equal(calls,roots*2*7,label);
 results.push({label,interactionRoots:roots,raycastCalls:calls,trace:[...trace]});
}
console.log(JSON.stringify({eventsPerVariant:7,meshes:2,results},null,2));
await act(async()=>root.unmount());geometry.dispose();material.dispose();
