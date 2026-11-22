export type SeatGridNavigationKey='ArrowLeft'|'ArrowRight'|'Home'|'End';

/** Returns a bounded focus target without changing the selected seat. */
export function seatGridTarget(count:number,current:number,key:string):number|null{
 if(!Number.isInteger(count)||count<1||!Number.isInteger(current)||current<0||current>=count)return null;
 switch(key){
  case 'ArrowLeft':return Math.max(0,current-1);
  case 'ArrowRight':return Math.min(count-1,current+1);
  case 'Home':return 0;
  case 'End':return count-1;
  default:return null;
 }
}
