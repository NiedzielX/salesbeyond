import {test} from 'node:test';
import assert from 'node:assert/strict';
import {expandChart} from '@seatlayer/core/core/layout';
import {getSeat,sectors,sectorSeats} from './stadium.ts';
import {createVenueChart,domainSeat,venueSeatId,localSeatPosition,chartUnitsPerMetre} from './venueChart.ts';
import {createVenueShell} from './venueShell.ts';
import {prepareLocalScene} from '../integrations/localScene.ts';

test('lokalny chart zachowuje round-trip wszystkich 648 miejsc, przynależność i ceny',()=>{
 const doc=createVenueChart(),expanded=expandChart(doc);
 const original=sectors.flatMap(s=>sectorSeats(s.id));
 assert.equal(expanded.length,648);assert.equal(new Set(expanded.map(s=>s.id)).size,648);
 for(const seat of original){
  const id=venueSeatId(seat),rendered=expanded.find(s=>s.id===id)!;
  assert.deepEqual(domainSeat(id),seat);assert.equal(rendered.sectionId,seat.sectorId);
  assert.equal(rendered.rowId,`north-${seat.sectorId}-row-${seat.row}`);
  const [x,,z]=localSeatPosition(seat);
  assert.ok(Math.abs(rendered.x/chartUnitsPerMetre-x)<1e-6);
  assert.ok(Math.abs(rendered.y/chartUnitsPerMetre-z)<1e-6);
 }
 for(const id of ['north-104-row-1:0','north-101-row-0:0','north-101-row-13:0','north-101-row-1:18','north-101-row-01:0','north-101-row-1:00','101-1-1',''])assert.equal(domainSeat(id),null);
});
test('rzeczywisty kompilator sceny zachowuje skalę boiska, pozycje i statusy foteli',()=>{
 const {seats,prepared:{model}}=prepareLocalScene(false);
 assert.equal(model.seatCount,648);assert.equal(model.sections.length,3);assert.equal(model.rows.length,36);
 assert.equal(model.stages.length,1);assert.ok(Math.abs(model.stages[0].halfX*2-105)<1e-6);assert.ok(Math.abs(model.stages[0].halfZ*2-68)<1e-6);
 for(const seat of seats){
  const original=domainSeat(seat.id)!;const index=model.seats.idToIndex.get(seat.id)!;
  const [x,y,z]=localSeatPosition(original);
  assert.ok(Math.abs(model.seats.iPosition[index*3]-x)<1e-4);
  assert.ok(Math.abs(model.seats.iPosition[index*3+2]-z)<1e-4);
  assert.ok(Math.abs(model.seats.iPosition[index*3+1]-(y+.15))<1e-4);
  assert.equal(model.seats.iState[index],original.available?0:2);
 }
 assert.equal(model.outdoor,true);assert.deepEqual(model.bounds.box,{min:[-92,0,-74],max:[92,24,74]});
 assert.equal(getSeat('102',6,10).available,true);
});
test('własny GLB jest samowystarczalny, dach zmienia geometrię bez zmiany miejsc',()=>{
 const bytes=createVenueShell(true),header=new DataView(bytes);
 assert.equal(header.getUint32(0,true),0x46546c67);assert.equal(header.getUint32(4,true),2);assert.equal(header.getUint32(8,true),bytes.byteLength);
 const json=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,header.getUint32(12,true))));
 assert.ok(json.buffers.every((buffer:{uri?:string})=>!buffer.uri));assert.equal(json.images,undefined);
 const closed=prepareLocalScene(true),open=prepareLocalScene(false);
 assert.ok(closed.prepared.model.solids.count>open.prepared.model.solids.count);
 assert.deepEqual(closed.prepared.model.seats.iPosition,open.prepared.model.seats.iPosition);
 assert.ok(Array.from(closed.prepared.model.solids.position).every(Number.isFinite));
 assert.ok(closed.prepared.model.solids.count<25000);
});


test('własna architektura zachowuje niebieski kolor czterech trybun i spójne bufory',()=>{
 const {prepared:{model}}=prepareLocalScene(true),solids=model.solids;
 for(const [attribute,stride] of [['position',3],['normal',3],['color',3],['floor',1],['material',1]] as const)assert.equal(solids[attribute].length,solids.count*stride);
 const blue=[0,0,0,0];
 for(let vertex=0;vertex<solids.count;vertex++){
  const [r,g,b]=solids.color.slice(vertex*3,vertex*3+3);if(b<r*1.5||b<g*1.2)continue;
  const [x,,z]=solids.position.slice(vertex*3,vertex*3+3);
  if(x>60)blue[0]++;if(x< -60)blue[1]++;if(z>40)blue[2]++;if(z< -40)blue[3]++;
 }
 assert.ok(blue.every(count=>count>0),`niebieskie wierzchołki stron: ${blue}`);
 for(const range of model.sectionSolidRanges){
  assert.equal(range.start%3,0);assert.equal(range.count%3,0);assert.ok(range.start+range.count<=solids.count);
  assert.ok(Array.from(solids.material.slice(range.start,range.start+range.count)).every(value=>value!==5));
 }
});
