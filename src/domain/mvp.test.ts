import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sectors,sectorSeats,layout} from '../data/stadium.ts';
import {initialSelection,selectionReducer} from './selection.ts';
import {eyePosition,flightPoint,lookTarget,flightDuration} from './camera.ts';
test('wszystkie 648 miejsc synchronizują sektor, rząd i fotel; zajęte nie zmieniają stanu',()=>{
 for(const seat of sectors.flatMap(s=>sectorSeats(s.id))){
 const next=selectionReducer(initialSelection,{type:'seat',seat});
 if(!seat.available){assert.equal(next,initialSelection);continue;}
 assert.equal(next.sector,seat.sectorId);assert.equal(next.row,seat.row);assert.deepEqual(next.seat,seat);
 const back=selectionReducer(next,{type:'back'});assert.equal(back.view,'sector');assert.equal(back.row,seat.row);
 assert.deepEqual(selectionReducer(back,{type:'reset'}),initialSelection);
 }
});
test('fotele spoczywają na stopniach; oczy znajdują się nad siedziskiem',()=>{
 for(const seat of sectors.flatMap(s=>sectorSeats(s.id))){
 const top=1.1+(seat.row-1)*layout.rowRise+.4;
 assert.ok(Math.abs(seat.position[1]-.12-top)<.001);
 assert.equal(seat.position[2],layout.firstRowZ+(seat.row-1)*layout.rowDepth);
 assert.ok(Math.abs(eyePosition(seat)[1]-seat.position[1]-1.22)<.001);
 }
});
test('przelot ma ciągłe skończone próbki, dokładne końce i obsługę reduced-motion',()=>{
 const from:[number,number,number]=[148,138,168],to:[number,number,number]=[-30,8,50];
 assert.deepEqual(flightPoint(from,to,0),from);
 let previous=from;
 for(let step=1;step<=144;step++){const p=flightPoint(from,to,step/60);assert.ok(p.every(Number.isFinite));assert.ok(Math.hypot(...p.map((v,i)=>v-previous[i]))<5);previous=p;}
 assert.deepEqual(flightPoint(from,to,flightDuration),to);assert.deepEqual(flightPoint(from,to,0,true),to);
});
test('rozglądanie zmienia kierunek bez zmiany pozycji oczu',()=>{
 const eye:[number,number,number]=[1,4,50];const copy=[...eye];
 assert.notDeepEqual(lookTarget(eye,0,0),lookTarget(eye,1,.2));assert.deepEqual(eye,copy);
 for(const yaw of [-2,0,2])assert.ok(Math.abs(Math.hypot(...lookTarget(eye,yaw,.3).map((v,i)=>v-eye[i]))-1)<.001);
});
test('błędny rząd nie zmienia stanu; reset i powrót bez sektora są bezpieczne',()=>{
 for(const row of [0,13,NaN,1.1])assert.equal(selectionReducer(initialSelection,{type:'row',row}),initialSelection);
 assert.equal(selectionReducer(initialSelection,{type:'back'}).view,'overview');
});

test('przerwanie autotour usuwa timery i blokuje również spóźnione callbacki',async()=>{
 const {scheduleTour}=await import('./tour.ts');
 const callbacks:(()=>void)[]=[];const canceled:unknown[]=[];const actions:unknown[]=[];
 let finished=false;
 const cleanup=scheduleTour(a=>actions.push(a),()=>{finished=true},fn=>{callbacks.push(fn);return callbacks.length as unknown as ReturnType<typeof setTimeout>},id=>canceled.push(id));
 callbacks[0]();assert.equal(actions.length,1);cleanup();
 callbacks[1]();callbacks[2]();assert.equal(actions.length,1);assert.equal(finished,false);assert.equal(canceled.length,3);
});

test('wybór kanonizuje dane fotela i nie gubi poprzedniego wyboru dla zajętych',()=>{
 const seats=sectors.flatMap(s=>sectorSeats(s.id));
 const available=seats.find(s=>s.available)!;
 const occupied=seats.find(s=>!s.available)!;
 const altered={...available,price:0,position:[NaN,NaN,NaN] as [number,number,number]};
 const selected=selectionReducer(initialSelection,{type:'seat',seat:altered});
 assert.deepEqual(selected.seat,available);
 assert.equal(selectionReducer(selected,{type:'seat',seat:occupied}),selected);
 const changed=selectionReducer(selected,{type:'sector',id:'103'});
 assert.equal(changed.seat,null);assert.equal(changed.view,'sector');assert.equal(changed.sector,'103');
});
