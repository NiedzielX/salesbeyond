import {resolveSeat,sectorRows,seatsInRow,type Seat,type SectorId,layout} from '../data/stadium.ts';
export const basketLimit=10;
export type BasketAction={type:'add';ids:string[]}|{type:'remove';id:string}|{type:'clear'}|{type:'replace';ids:string[]};
export function basketReducer(state:Seat[],action:BasketAction):Seat[]{
 if(action.type==='clear')return [];
 if(action.type==='replace')return canonicalBasket(action.ids).seats;
 if(action.type==='remove')return state.filter(s=>s.id!==action.id);
 const ids=[...new Set(action.ids)].filter(id=>!state.some(s=>s.id===id));
 const candidates=ids.map(resolveSeat);
 if(state.length+ids.length>basketLimit||candidates.some(s=>!s?.available))return state;
 return [...state,...candidates as Seat[]];
}
export function basketTotal(seats:Seat[]){return seats.reduce((sum,s)=>sum+Math.round(s.price*100),0)/100;}

/** Local demo suggestion only. A server must validate/hold inventory before a real checkout. */
export function adjacentSeats(sectors:SectorId[],quantity:number,excluded:string[]=[],maxPrice=Infinity):Seat[]{
 if(!Number.isInteger(quantity)||quantity<1||quantity>basketLimit||maxPrice<0||!Number.isFinite(maxPrice)&&maxPrice!==Infinity)return [];
 const excludedIds=new Set(excluded);let best:Seat[]=[];let score=Infinity;
 for(const id of sectors)for(const row of sectorRows(id)){
 const seats=seatsInRow(id,row).sort((a,b)=>a.number-b.number);
 for(let i=0;i<=seats.length-quantity;i++){
 const group=seats.slice(i,i+quantity);
 if(group.some(s=>!s.available||s.price>maxPrice||excludedIds.has(s.id)))continue;
 if(group.some((s,j)=>j>0&&(s.number!==group[j-1].number+1||Math.hypot(s.position[0]-group[j-1].position[0],s.position[2]-group[j-1].position[2])>layout.seatSpacing*1.45)))continue;
 const center=group.reduce((p,s)=>[p[0]+s.position[0]/quantity,p[1]+s.position[2]/quantity],[0,0]);
 const next=center[0]**2+center[1]**2;
 if(next<score){score=next;best=group;}
 }
 }
 return best;
}


export function canonicalBasket(ids:readonly unknown[],resolve:(id:string)=>Seat|null=resolveSeat){
 const seen=new Set<string>(),seats:Seat[]=[];let discarded=0;
 for(const id of ids){
 if(typeof id!=='string'||seen.has(id)){discarded++;continue;}
 seen.add(id);const seat=resolve(id);
 if(!seat?.available||seats.length>=basketLimit){discarded++;continue;}
 seats.push(seat);
 }
 return {seats,discarded};
}
/** This validates the local catalogue; only a real server can create a reservation. */
export function reconcileBasket(previous:readonly Seat[],resolve:(id:string)=>Seat|null=resolveSeat){
 const result=canonicalBasket(previous.map(s=>s.id),resolve);
 const repriced=result.seats.filter(s=>previous.find(old=>old.id===s.id)?.price!==s.price).length;
 return {...result,repriced,changed:result.discarded>0||repriced>0};
}
