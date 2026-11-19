import {allSectors,sectors,sectorSeats,type Seat,type SectorDefinition,type SectorId} from '../data/stadium.ts';
export type SeatFilters={maxPrice:number;availableOnly:boolean};
export const defaultSeatFilters:SeatFilters={maxPrice:0,availableOnly:true};
export function matchesSeat(seat:Seat,filters:SeatFilters,canSelect=true){
 return Number.isFinite(filters.maxPrice)&&filters.maxPrice>=0&&(!filters.maxPrice||seat.price<=filters.maxPrice)&&(!filters.availableOnly||seat.available&&canSelect);
}
export function searchSectors(stand:number,legacyOnly=false):SectorDefinition[]{
 return allSectors.filter(s=>(stand===-1||s.side===stand)&&(!legacyOnly||sectors.some(legacy=>legacy.id===s.id)));
}
export function summarizeSeats(ids:SectorId[],filters:SeatFilters,canSelect=true){
 return [...new Set(ids)].map(id=>{
 const seats=sectorSeats(id),matching=seats.filter(s=>matchesSeat(s,filters,canSelect));
 return {id,total:seats.length,matching:matching.length,available:matching.filter(s=>s.available&&canSelect).length,minPrice:matching.length?Math.min(...matching.map(s=>s.price)):null};
 });
}
export function groupSearchScope(selected:SectorId|null,visible:SectorDefinition[]):SectorId[]{
 return selected?[selected]:visible.map(s=>s.id);
}
