export type SectorId = string;
export type Seat = { id: string; sectorId: SectorId; standId: string; row: number; number: number; price: number; available: boolean; position: [number, number, number]; side?:number };
export const sectors = [
  { id: '101' as const, name: 'Bliżej bramki', description: 'Szeroka perspektywa na całe boisko', price: 65, center: -36 },
  { id: '102' as const, name: 'Na linii środka', description: 'W samym sercu piłkarskich emocji', price: 85, center: 0 },
  { id: '103' as const, name: 'Druga perspektywa', description: 'Obserwuj akcję z nowej strony', price: 65, center: 36 },
];
export const layout = { rowRise: .82, rowDepth: 1.28, firstStepY: 1.1, stepHeight: .8, seatThickness: .24, get firstSeatY(){ return this.firstStepY + this.stepHeight/2 + this.seatThickness/2; }, firstRowZ: 43, seatSpacing: 1.75 };
export const rows = 12;
export const seatsPerRow = 18;
export function getSeat(sectorId: SectorId, row: number, number: number): Seat {
  const sector = sectors.find(s => s.id === sectorId);
  if(!sector){const seat=bowlByKey.get(`${sectorId}-${row}-${number}`);if(!seat)throw new RangeError('Nieprawidłowe miejsce');return {...seat,position:[...seat.position]};}
  if (!sector || !Number.isInteger(row) || row < 1 || row > rows || !Number.isInteger(number) || number < 1 || number > seatsPerRow) throw new RangeError('Nieprawidłowe miejsce');
  return {id:`${sectorId}-${row}-${number}`, sectorId, standId:'Trybuna I', row, number, price:sector.price + (row > 7 ? 10 : 0), available: (row * 7 + number * 3 + Number(sectorId)) % 13 > 2, position:[sector.center + (number-9.5)*layout.seatSpacing, layout.firstSeatY + (row-1)*layout.rowRise, layout.firstRowZ + (row-1)*layout.rowDepth]};
}
export function sectorSeats(id: SectorId) {return sectors.some(s=>s.id===id)?Array.from({length:rows*seatsPerRow},(_,i)=>getSeat(id,Math.floor(i/seatsPerRow)+1,i%seatsPerRow+1)):bowlInventory.filter(s=>s.sectorId===id).map(s=>({...s,position:[...s.position] as [number,number,number]}));}

export const stands=[{side:0,name:'Trybuna I'},{side:1,name:'Trybuna III'},{side:2,name:'Trybuna II'},{side:3,name:'Trybuna IV'}];
export type SectorDefinition={id:SectorId;name:string;description:string;price:number;center:number;side:number};
const otherSectors:SectorDefinition[]=stands.flatMap(({side,name})=>Array.from({length:3},(_,band)=>({
 id:`${side===0?'I':side===1?'III':side===2?'II':'IV'}-${band+1}`,name:`${name} · blok ${band+1}`,description:'Poglądowy blok miejsc',price:band===1?85:65,center:0,side,
})));
/** Full catalogue for the existing procedural bowl, not an official Enea seating survey. */
const bowlInventory:Seat[]=[];
for(const {side,name} of stands){
 const count=Math.floor((side<2?118:82)/1.25);
 for(let r=0;r<27;r++){
 const counters=[0,0,0];
 for(let c=0;c<count;c++){
 const along=(c-(count-1)/2)*1.25;
 if(c%24<2||side===0&&r<rows&&sectors.some(s=>Math.abs(along-s.center)<16.5))continue;
 const band=Math.min(2,Math.floor(c*3/count));const sector=otherSectors.find(s=>s.side===side&&s.id.endsWith(`-${band+1}`))!;
 const number=++counters[band],row=r+1;
 const position:[number,number,number]=side<2?[along,layout.firstSeatY+r*layout.rowRise,(side===0?1:-1)*(43+r*layout.rowDepth)]:[(side===2?1:-1)*(61+r*layout.rowDepth),layout.firstSeatY+r*layout.rowRise,along];
 bowlInventory.push({id:`${sector.id}-${row}-${number}`,sectorId:sector.id,standId:name,row,number,price:sector.price+(row>7?10:0),available:(row*7+number*3+side)%13>2,position,side});
 }
 }
}
const bowlByKey=new Map(bowlInventory.map(s=>[s.id,s]));
export const allSectors:SectorDefinition[]=[...sectors.map(s=>({...s,side:0})),...otherSectors];
export function bowlSeats(side:number){return bowlInventory.filter(s=>s.side===side).map(s=>({...s,position:[...s.position] as [number,number,number]}));}
export function seatsInRow(id:SectorId,row:number){return sectorSeats(id).filter(s=>s.row===row);}
export function sectorRows(id:SectorId){return [...new Set(sectorSeats(id).map(s=>s.row))];}
export function resolveSeat(id:string):Seat|null{
 const extra=bowlByKey.get(id);if(extra)return getSeat(extra.sectorId,extra.row,extra.number);
 const match=/^(101|102|103)-([1-9]|1[0-2])-([1-9]|1[0-8])$/.exec(id);
 return match?getSeat(match[1],Number(match[2]),Number(match[3])):null;
}
export function sectorFrame(id:SectorId):{position:[number,number,number];target:[number,number,number]}{
 const definition=allSectors.find(s=>s.id===id);const seats=sectorSeats(id);
 if(!definition||!seats.length)return {position:[0,48,96],target:[0,6,49]};
 if(sectors.some(s=>s.id===id))return {position:[definition.center,48,96],target:[definition.center,6,49]};
 const target=seats.reduce((sum,s)=>sum.map((v,i)=>v+s.position[i]/seats.length) as [number,number,number],[0,0,0] as [number,number,number]);
 const normal=definition.side===0?[0,0,1]:definition.side===1?[0,0,-1]:definition.side===2?[1,0,0]:[-1,0,0];
 return {target,position:[target[0]+normal[0]*48,target[1]+42,target[2]+normal[2]*48]};
}
