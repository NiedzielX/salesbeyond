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
