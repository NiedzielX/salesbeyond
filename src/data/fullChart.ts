import type {ChartDoc,ChartObject,RowObject,Point,SectionObject} from '@seatlayer/core';
import {allSectors,sectors,sectorSeats,sectorRows,seatsInRow,layout,type Seat} from './stadium.ts';
import {chartUnitsPerMetre} from './venueChart.ts';
const unit=(n:number)=>n*chartUnitsPerMetre;
function hull(points:Point[]):Point[]{
 const sorted=points.sort((a,b)=>a.x-b.x||a.y-b.y);
 const cross=(o:Point,a:Point,b:Point)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);
 const half=(list:Point[])=>{const result:Point[]=[];for(const p of list){while(result.length>1&&cross(result.at(-2)!,result.at(-1)!,p)<=0)result.pop();result.push(p);}return result;};
 return [...half(sorted).slice(0,-1),...half([...sorted].reverse()).slice(0,-1)];
}
export function createFullChart(legacyOnly=false){
 const selected=allSectors.filter(s=>!legacyOnly||sectors.some(legacy=>legacy.id===s.id));
 const domainByNative=new Map<string,Seat>(),nativeByDomain=new Map<string,string>();
 const objects:ChartObject[]=[{type:'shape',id:'pitch',kind:'rect',role:'stage',stageKind:'pitch-football',x:unit(-52.5),y:unit(-34),width:unit(105),height:unit(68),fill:'#5e966b',heightM:0}];
 for(const sector of selected){
 const seats=sectorSeats(sector.id),padding=unit(.32);
 const outline=hull(seats.flatMap(s=>[-1,1].flatMap(dx=>[-1,1].map(dz=>({x:unit(s.position[0])+dx*padding,y:unit(s.position[2])+dz*padding})))));
 const section:SectionObject={type:'section',id:sector.id,label:sector.id,displayLabel:sector.id,outline,color:'#2865ac'};
 // The three small original north blocks occupy real cutouts in the wider generated bands.
 if(sector.side===0&&!sectors.some(s=>s.id===sector.id)&&!sector.id.startsWith('C'))section.holes=sectors.filter((_,i)=>sector.id===`I-${i+1}`).map(s=>{
 const first=seatsInRow(s.id,1),last=seatsInRow(s.id,12);return [{x:unit(first[0].position[0]-.3),y:unit(first[0].position[2]-.3)},{x:unit(first.at(-1)!.position[0]+.3),y:unit(first[0].position[2]-.3)},{x:unit(last.at(-1)!.position[0]+.3),y:unit(last[0].position[2]+.3)},{x:unit(last[0].position[0]-.3),y:unit(last[0].position[2]+.3)}];
 });
 objects.push(section);
 for(const row of sectorRows(sector.id)){
 const seats=seatsInRow(sector.id,row),segments:Seat[][]=[];
 for(const seat of seats){const last=segments.at(-1)?.at(-1);if(!last||Math.hypot(seat.position[0]-last.position[0],seat.position[2]-last.position[2])>layout.seatSpacing*1.45)segments.push([]);segments.at(-1)!.push(seat);}
 for(const [part,segment] of segments.entries()){
 const first=segment[0],second=segment[1];
 const angle=second?Math.atan2(second.position[2]-first.position[2],second.position[0]-first.position[0]):0;
 const rowId=`fan:${sector.id}:r${row}:p${part}`;
 const authored:RowObject={type:'row',id:rowId,label:`${sector.id}/${row}/${part}`,displayLabel:String(row),seatLabelBase:`${sector.id}/${row}`,seatDisplayLabelMode:'number',seatLabelStart:first.number,origin:{x:unit(first.position[0]),y:unit(first.position[2])},rotation:angle*180/Math.PI,curve:0,seatCount:segment.length,seatSpacing:unit(layout.seatSpacing),categoryKey:sector.id,
 segmentedRow:{kind:'segmented-row-v1',groupId:`fan:${sector.id}:r${row}`,componentIndex:part,componentCount:segments.length,boundaryBefore:part===0?'start':'break',displayLabel:String(row)},
 overrides:segment.map((seat,index)=>{
 const id=`${rowId}:${index}`;domainByNative.set(id,seat);nativeByDomain.set(seat.id,id);
 return {index,dx:unit(seat.position[0]-first.position[0]-index*layout.seatSpacing*Math.cos(angle)),dy:unit(seat.position[2]-first.position[2]-index*layout.seatSpacing*Math.sin(angle)),displayLabel:String(seat.number)};
 })};
 objects.push(authored);
 }
 }
 }
 const doc:ChartDoc={version:1,name:'Enea — autorska rekonstrukcja',venueType:'MIXED',focalPoint:{x:0,y:0},objects,categories:selected.map(s=>({key:s.id,label:`Blok ${s.id}`,color:'#2865ac',seatGlyph:'theatre',price:s.price})),theme:{background:'#eef1f3',accent:'#276df1',selectionColor:'#ffbf52',textColor:'#2c4666',seatLabelColor:'#ffffff',fontFamily:'system-ui, sans-serif'}};
 return {doc,domainByNative,nativeByDomain};
}
export type FullChart=ReturnType<typeof createFullChart>;
