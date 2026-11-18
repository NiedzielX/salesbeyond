import type {Seat} from '../data/stadium.ts';

/** Availability always wins over pointer/row feedback; selection survives the flight. */
export function seatColor(seat:Seat,selectedId:string|null,hoveredId:string|null,focusedRow:number|null){
 if(!seat.available)return '#88929c';
 if(seat.id===selectedId)return '#ffd268';
 if(seat.id===hoveredId)return '#ffdf91';
 if(seat.row===focusedRow)return '#8fd9ff';
 return '#397bd4';
}
