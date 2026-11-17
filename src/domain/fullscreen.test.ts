import {test} from 'node:test';
import assert from 'node:assert/strict';
import {toggleFullscreen} from '../components/fullscreen.ts';
test('pełny ekran używa metody elementu z poprawnym receiverem',async()=>{
 const element={called:0,async requestFullscreen(){this.called++}};
 assert.equal(await toggleFullscreen({fullscreenElement:null},element),true);
 assert.equal(element.called,1);
});
test('wyjście z pełnego ekranu nie uruchamia ponownego wejścia',async()=>{
 let entered=false;const doc={fullscreenElement:{} as Element,exited:false,async exitFullscreen(){this.exited=true}};
 assert.equal(await toggleFullscreen(doc,{async requestFullscreen(){entered=true}}),true);
 assert.equal(doc.exited,true);assert.equal(entered,false);
});
test('brak obsługi lub odmowa pełnego ekranu są obsłużone',async()=>{
 assert.equal(await toggleFullscreen({fullscreenElement:null},null),false);
 assert.equal(await toggleFullscreen({fullscreenElement:null},{}),false);
 assert.equal(await toggleFullscreen({fullscreenElement:null},{async requestFullscreen(){throw Error('denied')}}),false);
});
