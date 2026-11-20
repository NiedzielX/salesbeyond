import {writeFile} from 'node:fs/promises';
import {createEneaModel} from '../src/integrations/eneaModel.ts';
import {stadiumSeats,layout,sectorFrame,seatsInRow,allSectors} from '../src/data/stadium.ts';
import {eneaLayout} from '../src/data/eneaLayout.ts';
import {seatColor} from '../src/components/seatFeedback.ts';
import {eyePosition,overviewPosition} from '../src/domain/camera.ts';
import {roofCutawayNormal} from '../src/components/structure.ts';
const parts=createEneaModel();
// Match Stadium.tsx: vertical FOV 43°, responsive overview/sector framing,
// and the seat view's [0,1,0] target from Stadium.tsx. Seat position is aspect-independent.
const fov=43,reviewAspect=1100/760;
const overview={position:overviewPosition(reviewAspect),target:[0,0,0],fov,aspect:reviewAspect,cutawayNormal:null};
const selectedSector=allSectors.find(s=>s.id==='II-3');
if(!selectedSector)throw new Error('Review sector II-3 is missing');
const sector=sectorFrame(selectedSector.id,reviewAspect);
const sectorView={position:sector.position,target:sector.target,fov,aspect:reviewAspect,cutawayNormal:roofCutawayNormal('sector',selectedSector.side)};
const row=seatsInRow(selectedSector.id,27),selectedSeat=row[Math.floor(row.length/2)],seatEye=eyePosition(selectedSeat);
const seatView={position:seatEye,target:[0,1,0],seatId:selectedSeat.id,fov,aspect:reviewAspect,cutawayNormal:roofCutawayNormal('seat',selectedSector.side)};
const views={overview,sector:sectorView,seat:seatView,
 // Look towards the lower end stand, where the roof frame is exposed in the reference.
 exterior:{position:[-300,135,0],target:[0,18,0],fov,aspect:reviewAspect,cutawayNormal:null}};
const data={kind:'AUTHORED_GEOMETRY_CPU_REVIEW',seatWidth:eneaLayout.seatWidth,seatDepth:eneaLayout.seatDepth,seatThickness:layout.seatThickness,views,parts:parts.map(p=>({name:p.name,layer:p.layer,color:p.color,positions:Array.from(p.geometry.getAttribute('position').array)})),seats:stadiumSeats().map(s=>({id:s.id,p:s.position,heading:s.heading??0,color:seatColor(s,null,null,null)}))};
await writeFile(process.argv[2]??'/tmp/authored-stadium.json',JSON.stringify(data));parts.forEach(p=>p.geometry.dispose());
console.log(`Exported ${data.seats.length} chairs and ${data.parts.length} authored mesh layers; not a browser capture.`);
