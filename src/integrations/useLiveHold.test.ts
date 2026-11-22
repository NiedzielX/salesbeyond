import assert from 'node:assert/strict';
import test from 'node:test';
import {act,createElement} from 'react';
import {createRoot,extend} from '@react-three/fiber';
import * as THREE from 'three';
import {stadiumSeats} from '../data/stadium.ts';
import {useLiveHold} from '../components/useLiveHold.ts';
import type {createSeatHoldClient} from './seatHoldClient.ts';

type ClientFactory=typeof createSeatHoldClient;
class FakeCanvas extends EventTarget{style={};ownerDocument=new EventTarget();setPointerCapture(){}}

test('denied localStorage keeps the server hold flow available and recovers the session hold',async()=>{
 extend(THREE);
 const originalWindow=globalThis.window,originalAct=globalThis.IS_REACT_ACT_ENVIRONMENT;
 let currentReads=0,latest:ReturnType<typeof useLiveHold>|null=null;
 const fakeWindow={
  get localStorage(){throw new DOMException('denied','SecurityError')},
  setInterval:()=>1,clearInterval:()=>undefined,addEventListener:()=>undefined,removeEventListener:()=>undefined,
 } as unknown as Window&typeof globalThis;
 globalThis.window=fakeWindow;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const seats=stadiumSeats(),seat=seats.find(candidate=>candidate.available)!;
 const createClient=(() => ({
  status:async()=>({configured:true as const,mode:'service' as const}),
  current:async()=>{currentReads++;return {
   id:'12345678-1234-4321-9876-123456789abc',eventId:'enea-demo',status:'active' as const,
   expiresAt:new Date(Date.now()+60_000).toISOString(),version:7,currency:'PLN',
   subtotalMinor:seat.price*100,items:[{seatId:seat.id,priceMinor:seat.price*100}],
  }},
  inventory:async()=>{throw new Error('not used')},create:async()=>{throw new Error('not used')},
  get:async()=>{throw new Error('not used')},release:async()=>{throw new Error('not used')},
 })) as ClientFactory;
 function Harness(){latest=useLiveHold(seats,true,createClient);return null}
 const canvas=new FakeCanvas(),root=createRoot(canvas as unknown as HTMLCanvasElement);
 try{
  await root.configure({frameloop:'never',size:{width:10,height:10},gl:{domElement:canvas,setPixelRatio(){},setSize(){},render(){}} as unknown as THREE.WebGLRenderer});
  await act(async()=>{root.render(createElement(Harness));for(let i=0;i<10;i++)await Promise.resolve()});
  assert.equal(latest?.mode,'service');
  assert.equal(latest?.state?.phase,'active');
  if(latest?.state?.phase==='active'){
   assert.equal(latest.state.source,'recovered');
   assert.equal(latest.state.hold.items[0]?.seatId,seat.id);
  }
  assert.equal(currentReads,1,'server-owned hold recovery still runs without a local pointer');
 }finally{
  await act(async()=>root.unmount());globalThis.window=originalWindow;globalThis.IS_REACT_ACT_ENVIRONMENT=originalAct;
 }
});

test('status failure keeps the hold service unavailable',async()=>{
 extend(THREE);
 const originalWindow=globalThis.window,originalAct=globalThis.IS_REACT_ACT_ENVIRONMENT;
 let currentReads=0,latest:ReturnType<typeof useLiveHold>|null=null;
 globalThis.window={
  setInterval:()=>1,clearInterval:()=>undefined,addEventListener:()=>undefined,removeEventListener:()=>undefined,
 } as unknown as Window&typeof globalThis;
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const createClient=(() => ({
  status:async()=>{throw new Error('offline')},current:async()=>{currentReads++;return null},
  inventory:async()=>{throw new Error('not used')},create:async()=>{throw new Error('not used')},
  get:async()=>{throw new Error('not used')},release:async()=>{throw new Error('not used')},
 })) as ClientFactory;
 const seats=stadiumSeats();
 function Harness(){latest=useLiveHold(seats,true,createClient);return null}
 const canvas=new FakeCanvas(),root=createRoot(canvas as unknown as HTMLCanvasElement);
 try{
  await root.configure({frameloop:'never',size:{width:10,height:10},gl:{domElement:canvas,setPixelRatio(){},setSize(){},render(){}} as unknown as THREE.WebGLRenderer});
  await act(async()=>{root.render(createElement(Harness));for(let i=0;i<5;i++)await Promise.resolve()});
  assert.equal(latest?.mode,'unavailable');
  assert.equal(latest?.state,null);
  assert.equal(currentReads,0);
 }finally{
  await act(async()=>root.unmount());globalThis.window=originalWindow;globalThis.IS_REACT_ACT_ENVIRONMENT=originalAct;
 }
});
