import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mapBounds,seatBounds} from './map.ts';
import {allSectors,sectorSeats} from '../data/stadium.ts';
test('plan 2D mieści każdą pozycję fotela bez zmiany identyfikatorów i osi',()=>{
 const entire=mapBounds(null);
 for(const sector of allSectors){
  const bounds=mapBounds(sector.id);
  for(const seat of sectorSeats(sector.id))for(const box of [entire,bounds]){
   assert.ok(seat.position[0]>box.x&&seat.position[0]<box.x+box.width,seat.id);
   assert.ok(seat.position[2]>box.y&&seat.position[2]<box.y+box.height,seat.id);
  }
 }
 assert.ok(seatBounds([]).width>0);
});
