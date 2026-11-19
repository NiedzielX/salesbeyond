// Synthetic demo only. Emits a one-time transactional seed; refuses existing events.
import {stadiumSeats} from '../src/data/stadium.ts';
import {physicalRowRuns} from '../src/domain/seatRules.ts';
const seats=stadiumSeats(),runs=new Map();
physicalRowRuns(seats).forEach((run,index)=>run.forEach((seat,order)=>runs.set(seat.id,{id:`r${index}`,order})));
const literal=value=>`'${String(value).replaceAll("'","''")}'`;
process.stdout.write(`begin;\ndo $$ begin if exists(select 1 from sb_hold.events where id='enea-demo') then raise exception 'DEMO_CATALOG_EXISTS'; end if; end $$;\ninsert into sb_hold.events(id,status,currency,version,max_seats,hold_seconds,prevent_single) values ('enea-demo','open','PLN',1,10,600,false);\n`);
for(let offset=0;offset<seats.length;offset+=1000){
 const values=seats.slice(offset,offset+1000).map(seat=>{
 const run=runs.get(seat.id);if(!run)throw new Error('Missing physical row run');
 return `('enea-demo',${literal(seat.id)},${literal(seat.sectorId)},${seat.row},${seat.number},${literal(run.id)},${run.order},${Math.round(seat.price*100)},${literal(seat.available?'available':'blocked')})`;
 });
 process.stdout.write(`insert into sb_hold.seats(event_id,seat_id,section_id,row,number,run_id,run_order,price_minor,state) values\n${values.join(',\n')};\n`);
}
process.stdout.write('commit;\n');
console.error(`Exported ${seats.length} synthetic seats; existing events are never overwritten.`);
