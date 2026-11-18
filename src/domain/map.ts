import {allSectors,sectorSeats,type Seat,type SectorId} from '../data/stadium.ts';
export type MapBounds={x:number;y:number;width:number;height:number};
export function seatBounds(seats:Seat[],padding=2):MapBounds{
 if(!seats.length)return {x:-108,y:-92,width:216,height:184};
 const xs=seats.map(s=>s.position[0]),zs=seats.map(s=>s.position[2]);
 const x=Math.min(...xs)-padding,y=Math.min(...zs)-padding;
 return {x,y,width:Math.max(...xs)+padding-x,height:Math.max(...zs)+padding-y};
}
export function mapBounds(sector:SectorId|null){return sector?seatBounds(sectorSeats(sector),4):seatBounds(allSectors.flatMap(s=>sectorSeats(s.id)),7);}
