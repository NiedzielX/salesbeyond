import type {ChartDoc, ChartObject, RowObject, SectionObject} from '@seatlayer/core';
import {getSeat, sectors, rows, seatsPerRow, type SectorId, type Seat} from './stadium.ts';

// Runtime convention: a standard 24-unit chair pitch represents 0.55 metres.
export const chartUnitsPerMetre = 24 / .55;
const unit = (metres:number) => metres * chartUnitsPerMetre;
export const venueLayout = {firstRowZ:43, rowDepth:1.05, rowRise:.62, firstDeckY:1, seatSpacing:.62};
export const clubProfile = {
 id:'poznan', name:'Enea Stadion', location:'Poznań · ul. Bułgarska 17',
 description:'Pierwsza koncepcja dla klubów piłkarskich',
 accent:'#276df1', seatColor:'#2363b3',
};
export const venueRowId=(sector:SectorId,row:number)=>`north-${sector}-row-${row}`;
export function venueSeatId(seat:Seat){return `${venueRowId(seat.sectorId,seat.row)}:${seat.number-1}`;}
export function domainSeat(id:string):Seat|null{
 const match=/^north-(101|102|103)-row-([1-9]|1[0-2]):(0|[1-9]|1[0-7])$/.exec(id);
 return match?getSeat(match[1] as SectorId,Number(match[2]),Number(match[3])+1):null;
}
export function localSeatPosition(seat:Seat):[number,number,number]{
 const center=sectors.find(s=>s.id===seat.sectorId)!.center;
 return [center+(seat.number-(seatsPerRow+1)/2)*venueLayout.seatSpacing,
 venueLayout.firstDeckY+(seat.row-1)*venueLayout.rowRise,
 venueLayout.firstRowZ+(seat.row-1)*venueLayout.rowDepth];
}
const point=(x:number,y:number)=>({x:unit(x),y:unit(y)});
export function createVenueChart():ChartDoc{
 const objects:ChartObject[]=[{type:'shape',id:'football-pitch',kind:'rect',role:'stage',stageKind:'pitch-football',
 x:unit(-52.5),y:unit(-34),width:unit(105),height:unit(68),fill:'#4e8658',label:'',heightM:0}];
 for(const sector of sectors){
 const half=seatsPerRow*venueLayout.seatSpacing/2;
 const front=venueLayout.firstRowZ-venueLayout.rowDepth/2;
 const back=venueLayout.firstRowZ+(rows-.5)*venueLayout.rowDepth;
 const section:SectionObject={type:'section',id:sector.id,label:`Sektor ${sector.id}`,color:clubProfile.seatColor,
 outline:[point(sector.center-half,front),point(sector.center+half,front),point(sector.center+half,back),point(sector.center-half,back)],
 height:venueLayout.firstDeckY,rake:Math.atan(venueLayout.rowRise/venueLayout.rowDepth)*180/Math.PI,surfaceKind:'rakedRows'};
 objects.push(section);
 for(let row=1;row<=rows;row++){
 const first=localSeatPosition(getSeat(sector.id,row,1));
 const authored:RowObject={type:'row',id:venueRowId(sector.id,row),label:String(row),displayLabel:`Rząd ${row}`,
 origin:point(first[0],first[2]),rotation:0,curve:0,seatCount:seatsPerRow,seatSpacing:unit(venueLayout.seatSpacing),categoryKey:sector.id};
 objects.push(authored);
 }
 }
 return {version:1,name:`${clubProfile.name} — koncepcja`,venueType:'MIXED',focalPoint:point(0,0),objects,
 categories:sectors.map(s=>({key:s.id,label:`Sektor ${s.id}`,color:clubProfile.seatColor,seatGlyph:'theatre',price:s.price})),
 theme:{background:'#eef1f3',accent:clubProfile.accent,selectionColor:'#ffca66',fontFamily:'system-ui, sans-serif',
 textColor:'#233b5b',seatLabelColor:'#ffffff',venue3d:{seat:clubProfile.seatColor,deck:'#aeb8c4',fascia:'#d6dce3',shell:'#edf0f3',roughness:.8}}};
}
