import {test} from 'node:test';
import assert from 'node:assert/strict';
import {allSectors,sectors,sectorSeats,bowlSeats,sectorRows,seatsInRow,resolveSeat,sectorFrame} from './stadium.ts';
import {selectionReducer,initialSelection} from '../domain/selection.ts';
import {eyePosition} from '../domain/camera.ts';

test('każdy renderowany fotel czterech trybun ma unikalny rekord i podgląd, także poglądowo zajęty',()=>{
 const rendered=[...sectors.flatMap(s=>sectorSeats(s.id)),...[0,1,2,3].flatMap(bowlSeats)];
 const catalogue=allSectors.flatMap(s=>sectorSeats(s.id));
 assert.ok(catalogue.length>30000&&catalogue.length<50000);
 assert.deepEqual(new Set(rendered.map(s=>s.id)),new Set(catalogue.map(s=>s.id)));
 assert.equal(new Set(catalogue.map(s=>s.id)).size,catalogue.length);
 assert.equal(new Set(catalogue.map(s=>s.position.join(':'))).size,catalogue.length);
 for(const seat of catalogue){
  assert.deepEqual(resolveSeat(seat.id),seat);
  const next=selectionReducer(initialSelection,{type:'seat',seat:{...seat,price:0,position:[NaN,NaN,NaN]}});
  assert.deepEqual(next.seat,seat);assert.equal(next.sector,seat.sectorId);assert.equal(next.row,seat.row);
  assert.ok(eyePosition(seat).every(Number.isFinite));
  const back=selectionReducer(next,{type:'back'});assert.equal(back.row,seat.row);assert.equal(back.sector,seat.sectorId);
 }
 assert.ok(catalogue.some(s=>!s.available));
 assert.equal(resolveSeat('II-1-99-1'),null);
});

test('panel i kadr sektora obejmują wszystkie rzędy oraz różne strony stadionu',()=>{
 for(const sector of allSectors){
  const rows=sectorRows(sector.id);assert.ok(rows.length>0);
  const entered=selectionReducer(initialSelection,{type:'sector',id:sector.id});
  assert.ok(rows.includes(entered.row));
  for(const row of rows){
   const state=selectionReducer(entered,{type:'row',row});assert.equal(state.row,row);
   assert.ok(seatsInRow(sector.id,row).length>0);
  }
  const {position,target}=sectorFrame(sector.id);
  assert.ok(position.every(Number.isFinite)&&target.every(Number.isFinite));
  assert.ok(position[1]>target[1]);
 }
 for(const id of ['III-2','II-2','IV-2']){
 const frame=sectorFrame(id);
 assert.ok(frame.position[0]*frame.target[0]+frame.position[2]*frame.target[2]<frame.target[0]**2+frame.target[2]**2);
 }
 assert.equal(selectionReducer(initialSelection,{type:'sector',id:'missing'}),initialSelection);
});
