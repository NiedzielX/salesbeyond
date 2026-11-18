import type {Seat} from '../data/stadium.ts';

/** Viewing an occupied chair does not change its availability for a future cart. */
export function seatColor(seat:Seat,selectedId:string|null,hoveredId:string|null,focusedRow:number|null){
 if(seat.id===selectedId)return '#ffd268';
 if(!seat.available)return '#88929c';
 if(seat.id===hoveredId)return '#ffdf91';
 if(seat.row===focusedRow)return '#8fd9ff';
 return '#397bd4';
}
