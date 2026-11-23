import assert from 'node:assert/strict';
import test from 'node:test';
import {sceneTouchControl} from './sceneTouch.ts';

test('mobile scene touch control distinguishes page scroll from direct manipulation',()=>{
 assert.deepEqual(sceneTouchControl('page'),{className:'',pressed:false,label:'Sterowanie sceną'});
 assert.deepEqual(sceneTouchControl('scene'),{className:'touch-scene-control',pressed:true,label:'Sterowanie sceną'});
});
