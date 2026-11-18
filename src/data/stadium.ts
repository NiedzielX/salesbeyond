import {eneaLayout,standProfiles,standRow,straightPoint,corners,cornerRow,cornerSeats} from './eneaLayout.ts';
export type SectorId=string;
export type Seat={id:string;sectorId:SectorId;standId:string;row:number;number:number;price:number;available:boolean;position:[number,number,number];side?:number;heading?:number;tier?:number;accent?:boolean};
export type SectorDefinition={id:SectorId;name:string;description:string;price:number;center:number;side:number};
export const sectors=[
 {id:'101' as const,name:'Bliżej bramki',description:'Szeroka perspektywa na całe boisko',price:65,center:-36},
 {id:'102' as const,name:'Na linii środka',description:'W samym sercu piłkarskich emocji',price:85,center:0},
 {id:'103' as const,name:'Druga perspektywa',description:'Obserwuj akcję z nowej strony',price:65,center:36},
];
export const layout={rowRise:.62,rowDepth:eneaLayout.rowDepth,firstStepY:1.1,stepHeight:.8,seatThickness:eneaLayout.seatThickness,get firstSeatY(){return this.firstStepY+this.stepHeight/2+this.seatThickness/2;},firstRowZ:43,seatSpacing:eneaLayout.seatSpacing};
export const rows=12,seatsPerRow=18;
export const stands=standProfiles.map(s=>({side:s.side,name:s.name}));
const otherSectors:SectorDefinition[]=stands.flatMap(({side,name})=>Array.from({length:3},(_,band)=>({id:`${side===0?'I':side===1?'III':side===2?'II':'IV'}-${band+1}`,name:`${name} · blok ${band+1}`,description:'Poglądowy blok miejsc',price:band===1?85:65,center:0,side})));
const cornerSectors:SectorDefinition[]=corners.map(c=>({id:c.id,name:`Łącznik ${c.id}`,description:'Zaokrąglony narożnik trybun',price:65,center:0,side:c.longSide}));
export const allSectors:SectorDefinition[]=[...sectors.map(s=>({...s,side:0})),...otherSectors,...cornerSectors];
const definitions=new Map(allSectors.map(s=>[s.id,s]));
const byId=new Map<string,Seat>(),bySector=new Map<string,Seat[]>(),byRow=new Map<string,Map<number,Seat[]>>();
const inventory:Seat[]=[];
const glyphs=['11110100011000111110100001000010000','01110100011000110001100011000101110','11111000100010000100010001000011111','10001110011010110011100011000110001','01110100011000111111100011000110001','10001110011010110011100011000110001'];
function cityLetter(side:number,row:number,column:number,total:number){
 if(side!==1||row<26||row>32)return false;
 const x=Math.floor((column-(total-72)/2)/2);if(x<0||x>=36)return false;
 const letter=Math.floor(x/6),pixel=x%6;return pixel<5&&glyphs[letter][(row-26)*5+pixel]==='1';
}
function append(seat:Seat){
 inventory.push(seat);byId.set(seat.id,seat);
 if(!bySector.has(seat.sectorId)){bySector.set(seat.sectorId,[]);byRow.set(seat.sectorId,new Map());}
 bySector.get(seat.sectorId)!.push(seat);
 const rowMap=byRow.get(seat.sectorId)!;if(!rowMap.has(seat.row))rowMap.set(seat.row,[]);rowMap.get(seat.row)!.push(seat);
}
function addToDeck(position:[number,number,number]):[number,number,number]{return [position[0],position[1]+layout.seatThickness/2,position[2]];}
// Preserve the first 648 identities while moving every visible chair onto the same authored bowl.
for(const sector of sectors)for(let row=1;row<=rows;row++)for(let number=1;number<=seatsPerRow;number++){
 append({id:`${sector.id}-${row}-${number}`,sectorId:sector.id,standId:'Trybuna I',row,number,price:sector.price+(row>7?10:0),available:(row*7+number*3+Number(sector.id))%13>2,position:addToDeck(straightPoint(0,row-1,sector.center+(number-9.5)*layout.seatSpacing)),side:0,heading:0,tier:1});
}
for(const profile of standProfiles){
 const side=profile.side,span=side<2?108:70,count=Math.floor(span/layout.seatSpacing);
 const blocks=otherSectors.filter(s=>s.side===side);
 for(let r=0;r<profile.rows;r++){
 const counters=[0,0,0];
 for(let c=0;c<count;c++){
 const along=(c-(count-1)/2)*layout.seatSpacing;
 if(c%33<3||side===0&&r<rows&&sectors.some(s=>Math.abs(along-s.center)<seatsPerRow*layout.seatSpacing/2+.12))continue;
 const band=Math.min(2,Math.floor(c*3/count)),sector=blocks[band],number=++counters[band],row=r+1;
 append({id:`${sector.id}-${row}-${number}`,sectorId:sector.id,standId:profile.name,row,number,price:sector.price+(row>22?10:0),available:(row*7+number*3+side)%31>1,position:addToDeck(straightPoint(side,r,along)),side,heading:side===0?0:side===1?Math.PI:side===2?Math.PI/2:-Math.PI/2,tier:standRow(side,r).tier,accent:cityLetter(side,r,c,count)});
 }
 }
}
for(const corner of corners){
 const count=cornerRow(corner,0).count;
 for(let r=0;r<count;r++)cornerSeats(corner,r).forEach((sample,i)=>{
 const row=r+1,number=i+1;
 append({id:`${corner.id}-${row}-${number}`,sectorId:corner.id,standId:`Łącznik ${corner.id}`,row,number,price:65+(r>22?10:0),available:(row*7+number*3)%31>1,position:addToDeck(sample.point),side:corner.longSide,heading:sample.heading,tier:standRow(corner.longSide,Math.min(r,standProfiles[corner.longSide].rows-1)).tier});
 });
}
const copy=(s:Seat):Seat=>({...s,position:[...s.position]});
export function resolveSeat(id:string):Seat|null{const seat=byId.get(id);return seat?copy(seat):null;}
export function getSeat(sectorId:SectorId,row:number,number:number):Seat{
 if(!Number.isInteger(row)||!Number.isInteger(number))throw new RangeError('Nieprawidłowe miejsce');
 const seat=resolveSeat(`${sectorId}-${row}-${number}`);if(!seat)throw new RangeError('Nieprawidłowe miejsce');return seat;
}
export function sectorSeats(id:SectorId){return (bySector.get(id)??[]).map(copy);}
export function bowlSeats(side:number){return inventory.filter(s=>s.side===side&&!sectors.some(legacy=>legacy.id===s.sectorId)).map(copy);}
export function seatsInRow(id:SectorId,row:number){return (byRow.get(id)?.get(row)??[]).map(copy);}
export function sectorRows(id:SectorId){return [...(byRow.get(id)?.keys()??[])];}
export function stadiumSeats(){return inventory.map(copy);}
export function sectorFrame(id:SectorId,aspect=1.5):{position:[number,number,number];target:[number,number,number]}{
 const seats=bySector.get(id),definition=definitions.get(id);
 if(!seats?.length||!definition)return {position:[0,56,10],target:[0,8,52]};
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(const seat of seats)for(let i=0;i<3;i++){min[i]=Math.min(min[i],seat.position[i]);max[i]=Math.max(max[i],seat.position[i]);}
 const target=min.map((v,i)=>(v+max[i])/2) as [number,number,number];
 const radial=Math.hypot(target[0],target[2])||1;
 const normal:[number,number,number]=[-target[0]/radial*.7808688,.624695,-target[2]/radial*.7808688];
 const horizontal=Math.hypot(normal[0],normal[2]);
 const right=[normal[2]/horizontal,0,-normal[0]/horizontal];
 const up=[-normal[1]*normal[0]/horizontal,horizontal,-normal[1]*normal[2]/horizontal];
 const dot=(a:number[],b:number[])=>a.reduce((sum,v,i)=>sum+v*b[i],0);
 const tan=Math.tan(43*Math.PI/360)*.85;
 let distance=42;
 for(const x of [min[0]-.5,max[0]+.5])for(const y of [min[1],max[1]+.8])for(const z of [min[2]-.5,max[2]+.5]){
 const p=[x-target[0],y-target[1],z-target[2]];
 distance=Math.max(distance,dot(p,normal)+Math.max(Math.abs(dot(p,right))/(tan*Math.max(.3,aspect)),Math.abs(dot(p,up))/tan));
 }
 return {target,position:target.map((v,i)=>v+normal[i]*distance) as [number,number,number]};
}
