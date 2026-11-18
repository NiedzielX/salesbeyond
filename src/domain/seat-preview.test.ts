import {test} from 'node:test';
import assert from 'node:assert/strict';
import {captureSeatPreview} from '../components/seatPreview.ts';

test('kadr odczytywany jest po renderze tej samej kamery, błędy nie udają obrazu',()=>{
 const calls:string[]=[];
 const image='data:image/jpeg;base64,example';
 assert.equal(captureSeatPreview(()=>{calls.push('render')},{toDataURL:(type,quality)=>{calls.push('capture');assert.equal(type,'image/jpeg');assert.equal(quality,.82);return image;}}),image);
 assert.deepEqual(calls,['render','capture']);
 assert.equal(captureSeatPreview(()=>{throw new Error('context lost')},{toDataURL:()=>{throw new Error('must not capture')}}),null);
 assert.equal(captureSeatPreview(()=>{},{toDataURL:()=>{throw new Error('security error')}}),null);
 assert.equal(captureSeatPreview(()=>{},{toDataURL:()=> 'data:,'}),null);
});
