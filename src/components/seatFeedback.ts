import type {Seat} from '../data/stadium.ts';

/** Viewing an occupied chair does not change its availability for a future cart. */
export function seatColor(seat:Seat&{ownedHold?:boolean},selectedId:string|null,hoveredId:string|null,focusedRow:number|null,inBasket=false){
 if(seat.id===selectedId)return '#ffd268';
 if(inBasket&&(seat.available||seat.ownedHold))return '#199b7a';
 if(!seat.available)return '#88929c';
 if(seat.id===hoveredId)return '#ffdf91';
 if(seat.row===focusedRow)return '#8fd9ff';
 return seat.accent?'#dce8f5':'#205da9';
}
