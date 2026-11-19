import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seatColor} from '../components/seatFeedback.ts';
import {sectorSeats} from '../data/stadium.ts';

test('wybrany i wskazany fotel odróżniają się od wyróżnionego rzędu, zajęte zostają szare',()=>{
 const seats=sectorSeats('102');
 const selected=seats.find(s=>s.available&&s.row===6)!;
 const hover=seats.find(s=>s.available&&s.row===6&&s.id!==selected.id)!;
 const row=seats.find(s=>s.available&&s.row===6&&s.id!==selected.id&&s.id!==hover.id)!;
 const other=seats.find(s=>s.available&&s.row===7)!;
 const unavailable=seats.find(s=>!s.available&&s.row===6)!;
 const color=(s:typeof selected)=>seatColor(s,selected.id,hover.id,6);
 assert.equal(new Set([color(selected),color(hover),color(row),color(other),color(unavailable)]).size,5);
 assert.equal(seatColor(selected,selected.id,selected.id,6),color(selected));
 assert.equal(seatColor(unavailable,unavailable.id,unavailable.id,6),color(selected));
 assert.equal(seatColor(other,null,null,null),color(other));
});
test('koszyk ma wspólne oznaczenie, podgląd ma priorytet i nie zmienia statusu zajętego miejsca',()=>{
 const free=sectorSeats('101').find(s=>s.available)!,taken=sectorSeats('101').find(s=>!s.available)!;
 assert.equal(seatColor(free,null,null,null,true),'#199b7a');
 assert.notEqual(seatColor(free,free.id,null,null,true),'#199b7a');
 assert.equal(seatColor(taken,null,null,null,true),seatColor(taken,null,null,null));
 assert.equal(seatColor(free,null,free.id,free.row,true),'#199b7a');
});
