import {mkdir,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {prepareLocalScene} from '../src/integrations/localScene.ts';
import {chartUnitsPerMetre,domainSeat} from '../src/data/venueChart.ts';

// Numerical/opaque-geometry inspection only. Does not export browser shading, chairs or camera animation.
const output=resolve(process.argv[2]??'/tmp/salesbeyond-geometry.json');
const {seats,prepared:{model}}=prepareLocalScene(true);
await mkdir(dirname(output),{recursive:true});
await writeFile(output,JSON.stringify({kind:'CPU_GEOMETRY_REVIEW',positions:Array.from(model.solids.position),colors:Array.from(model.solids.color),
 seats:seats.map(seat=>({id:seat.id,x:seat.x/chartUnitsPerMetre,z:seat.y/chartUnitsPerMetre,eye:seat.eyeHeightM,available:domainSeat(seat.id)?.available})),bounds:model.bounds.box}));
console.log(`Exported ${model.solids.count/3} triangles and ${seats.length} seat-eye positions to ${output}`);
