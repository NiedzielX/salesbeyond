import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getSeat, sectorSeats, sectors, rows, seatsPerRow} from './stadium.ts';
test('identyfikatory i współrzędne miejsc są unikalne i stabilne',()=>{
 const seats=sectors.flatMap(s=>sectorSeats(s.id));
 assert.equal(seats.length,3*rows*seatsPerRow);
 assert.equal(new Set(seats.map(s=>s.id)).size,seats.length);
 assert.equal(new Set(seats.map(s=>JSON.stringify(s.position))).size,seats.length);
 for(const s of seats){assert.deepEqual(getSeat(s.sectorId,s.row,s.number),s);assert.ok(s.position.every(Number.isFinite));}
});
test('cena biletu zgadza się z sektorem i rzędem',()=>{
 assert.equal(getSeat('101',1,1).price,65);
 assert.equal(getSeat('102',6,10).price,85);
 assert.equal(getSeat('102',12,9).price,95);
 assert.equal(getSeat('102',6,10).available,true);
});
test('nieprawidłowe miejsca są odrzucane',()=>{
 for(const [row,number] of [[0,1],[13,1],[1,0],[1,19],[1.5,3],[NaN,1]])assert.throws(()=>getSeat('101',row,number),RangeError);
});
test('każdy rząd ma miejsca dostępne i przykładowe zajęte',()=>{
 for(const sector of sectors)for(let row=1;row<=rows;row++){
 const seats=sectorSeats(sector.id).filter(s=>s.row===row);
 assert.ok(seats.some(s=>s.available));assert.ok(seats.some(s=>!s.available));
 }
});
