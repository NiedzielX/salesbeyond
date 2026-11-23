import assert from 'node:assert/strict';
import test from 'node:test';
import {webGL2Available} from './webglSupport.ts';

test('WebGL2 preflight requests release of a successful probe context',()=>{
 let lost=0;
 const available=webGL2Available(()=>({getContext:(kind:string)=>{
  assert.equal(kind,'webgl2');
  return {getExtension:(name:string)=>{assert.equal(name,'WEBGL_lose_context');return {loseContext:()=>{lost++}};}};
 }}) as unknown as HTMLCanvasElement);
 assert.equal(available,true);
 assert.equal(lost,1);
});

test('WebGL2 preflight accepts a context without the optional lose-context extension',()=>{
 assert.equal(webGL2Available(()=>({getContext:()=>({getExtension:()=>null})}) as unknown as HTMLCanvasElement),true);
});

test('WebGL2 preflight fails closed without throwing into React',()=>{
 assert.equal(webGL2Available(()=>({getContext:()=>null}) as unknown as HTMLCanvasElement),false);
 assert.equal(webGL2Available(()=>{throw new Error('canvas unavailable')}),false);
});
