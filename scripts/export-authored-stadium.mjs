import {writeFile} from 'node:fs/promises';
import {createEneaModel} from '../src/integrations/eneaModel.ts';
import {stadiumSeats,layout} from '../src/data/stadium.ts';
import {eneaLayout} from '../src/data/eneaLayout.ts';
import {seatColor} from '../src/components/seatFeedback.ts';
const parts=createEneaModel();
const data={kind:'AUTHORED_GEOMETRY_CPU_REVIEW',seatWidth:eneaLayout.seatWidth,seatDepth:eneaLayout.seatDepth,seatThickness:layout.seatThickness,parts:parts.map(p=>({name:p.name,layer:p.layer,color:p.color,positions:Array.from(p.geometry.getAttribute('position').array)})),seats:stadiumSeats().map(s=>({id:s.id,p:s.position,heading:s.heading??0,color:seatColor(s,null,null,null)}))};
await writeFile(process.argv[2]??'/tmp/authored-stadium.json',JSON.stringify(data));parts.forEach(p=>p.geometry.dispose());
console.log(`Exported ${data.seats.length} chairs and ${data.parts.length} authored mesh layers; not a browser capture.`);
