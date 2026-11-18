import {test} from 'node:test';
import assert from 'node:assert/strict';
import {expandChart} from '@seatlayer/core/core/layout';
import {createFullChart} from './fullChart.ts';
import {chartUnitsPerMetre} from './venueChart.ts';
import {stadiumSeats} from './stadium.ts';
test('natywny kompilator mapy zachowuje każde ID, sektor i pozycję rekonstrukcji 3D',()=>{
 const chart=createFullChart(),seats=expandChart(chart.doc);
 assert.equal(seats.length,stadiumSeats().length);assert.equal(chart.nativeByDomain.size,seats.length);
 for(const seat of seats){
 const original=chart.domainByNative.get(seat.id)!;assert.ok(original);assert.equal(chart.nativeByDomain.get(original.id),seat.id);
 assert.ok(Math.abs(seat.x/chartUnitsPerMetre-original.position[0])<1e-6,original.id);
 assert.ok(Math.abs(seat.y/chartUnitsPerMetre-original.position[2])<1e-6,original.id);
 assert.equal(seat.sectionId,original.sectorId,original.id);
 }
 assert.equal(expandChart(createFullChart(true).doc).length,648);
});
