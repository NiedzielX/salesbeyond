import {sectors, rows, seatsPerRow} from './stadium.ts';
import {venueLayout} from './venueChart.ts';
type Vec=[number,number,number];
type Part={center:Vec;size:Vec;color:number;tiltX:number;tiltZ:number};
const colors:Vec[]=[[.82,.86,.81],[.74,.78,.78],[.64,.69,.75],[.08,.25,.52],[.91,.94,.97],[.22,.43,.70]];

/** Clear circulation lanes split the decorative seating, without changing selectable seats. */
function seatingBays(from:number,to:number,excluded:[number,number][]=[],aisles=true):[number,number][]{
 const gaps=[...excluded];
 if(aisles)for(let x=from+18;x<to;x+=24)gaps.push([x-.9,x+.9]);
 gaps.sort((a,b)=>a[0]-b[0]);
 const bays:[number,number][]=[];let cursor=from;
 for(const [start,end] of gaps){
  if(end<=cursor||start>=to)continue;
  if(start>cursor)bays.push([cursor,Math.min(start,to)]);
  cursor=Math.max(cursor,end);
 }
 if(cursor<to)bays.push([cursor,to]);
 return bays;
}

/** Own lightweight architectural shell. No downloaded models or textures. */
function architectureParts(roof:boolean):Part[]{
 const parts:Part[]=[];
 const box=(center:Vec,size:Vec,color:number,tiltX=0,tiltZ=0)=>parts.push({center,size,color,tiltX,tiltZ});
 box([0,-.6,0],[204,.4,170],0);
 box([0,-.35,0],[178,.2,145],1);
 for(let row=0;row<27;row++){
 const z=venueLayout.firstRowZ+row*venueLayout.rowDepth;
 const y=venueLayout.firstDeckY+row*venueLayout.rowRise;
 const half=seatsPerRow*venueLayout.seatSpacing/2+.3;
 const holes:[number,number][]=row<rows?sectors.map(sector=>[sector.center-half,sector.center+half]):[];
 // Concrete excludes the interactive native decks; blue seating also leaves stair aisles.
 const decks=seatingBays(-60,60,holes,false);
 for(const [a,b] of decks){
 box([(a+b)/2,y/2,z],[b-a,y,venueLayout.rowDepth],2);
 }
 box([0,y/2,-z],[120,y,venueLayout.rowDepth],2);
 for(const sign of [-1,1]){
 const x=sign*(61+row*venueLayout.rowDepth);
 box([x,y/2,0],[venueLayout.rowDepth,y,84],2);
 }
 // A two-row concourse separates lower and upper seating. Only decorative rows are removed.
 if(row===13||row===14)continue;
 for(const [a,b] of seatingBays(-60,60,holes))box([(a+b)/2,y+.25,z+.25],[b-a,.5,.25],row%8===0?5:3);
 for(const [a,b] of seatingBays(-60,60))box([(a+b)/2,y+.25,-z-.25],[b-a,.5,.25],row%8===0?5:3);
 for(const sign of [-1,1]){
 const x=sign*(61+row*venueLayout.rowDepth);
 for(const [a,b] of seatingBays(-42,42))box([x+sign*.25,y+.25,(a+b)/2],[.25,.5,b-a],row%8===0?5:3);
 }
 }
 // Restrained blue fascia and rear supports give the four stands a common silhouette.
 for(const sign of [-1,1]){
 box([0,16.8,sign*72],[120,1,1],3);
 box([sign*90,16.8,0],[1,1,84],3);
 for(let x=-54;x<=54;x+=18)box([x,10.5,sign*73],[.6,21,.6],4);
 for(let z=-36;z<=36;z+=18)box([sign*90,10.5,z],[.6,21,.6],4);
 }
 if(roof){
 // Slender pitched canopy panels with seams, rather than four thick flat slabs.
 for(const sign of [-1,1]){
 for(let x=-55;x<=55;x+=10){
 box([x,22,sign*61],[9.85,.28,25],4,-sign*.09);
 box([x-4.9,21.75,sign*61],[.16,.3,25],1,-sign*.09);
 }
 for(let z=-40;z<=40;z+=10){
 box([sign*79,22,z],[25,.28,9.85],4,0,sign*.09);
 box([sign*79,21.75,z-4.9],[25,.3,.16],1,0,sign*.09);
 }
 }
 }
 return parts;
}
function surfaces(roof:boolean){
 const parts=architectureParts(roof);
 return colors.map((color,colorIndex)=>{
 const position:number[]=[],normal:number[]=[];
 for(const p of parts.filter(p=>p.color===colorIndex)){
 for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
 const u=(axis+1)%3,v=(axis+2)%3;
 const corners=[[-1,-1],[1,-1],[1,1],[-1,1]];
 const order=sign>0?[0,1,2,0,2,3]:[0,2,1,0,3,2];
 const rotate=(point:number[])=>{
 const [x,y,z]=point;const cx=Math.cos(p.tiltX),sx=Math.sin(p.tiltX),cz=Math.cos(p.tiltZ),sz=Math.sin(p.tiltZ);
 const ry=y*cx-z*sx,rz=y*sx+z*cx;
 return [x*cz-ry*sz,x*sz+ry*cz,rz];
 };
 for(const i of order){const point=[0,0,0];point[axis]=sign*p.size[axis]/2;point[u]=corners[i][0]*p.size[u]/2;point[v]=corners[i][1]*p.size[v]/2;position.push(...rotate(point).map((value,axis)=>value+p.center[axis]));normal.push(...rotate([0,1,2].map(a=>a===axis?sign:0)));}
 }
 }
 return {position,normal,color};
 });

}

/** Direct prepared-mesh input retains our blue benches; the GLB shell importer recolours materials. */
export function createVenueGeometry(roof:boolean){
 const chunks=surfaces(roof);
 const position=new Float32Array(chunks.flatMap(chunk=>chunk.position));
 const normal=new Float32Array(chunks.flatMap(chunk=>chunk.normal));
 const color=new Float32Array(chunks.flatMap(chunk=>Array.from({length:chunk.position.length/3},()=>chunk.color).flat()));
 const count=position.length/3;
 return {position,normal,color,floor:new Float32Array(count),material:new Float32Array(count),count};
}

/** Standalone, self-contained model export, generated from the same authored surfaces. */
export function createVenueShell(roof:boolean):ArrayBuffer{
 const buffers:Float32Array[]=[];const bufferViews:object[]=[];const accessors:object[]=[];const meshes:object[]=[];
 let offset=0;
 const accessor=(values:number[],kind:'POSITION'|'NORMAL')=>{
 const data=new Float32Array(values);const view=bufferViews.length;
 bufferViews.push({buffer:0,byteOffset:offset,byteLength:data.byteLength,target:34962});offset+=data.byteLength;buffers.push(data);
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<values.length;i++) {min[i%3]=Math.min(min[i%3],values[i]);max[i%3]=Math.max(max[i%3],values[i]);}
 const index=accessors.length;accessors.push({bufferView:view,componentType:5126,count:values.length/3,type:'VEC3',...(kind==='POSITION'?{min,max}:{})});return index;
 };

 for(const [color,chunk] of surfaces(roof).entries()){
 if(!chunk.position.length)continue;
 meshes.push({primitives:[{attributes:{POSITION:accessor(chunk.position,'POSITION'),NORMAL:accessor(chunk.normal,'NORMAL')},material:color}]});
 }
 const doc={asset:{version:'2.0',generator:'SalesBeyond procedural stadium'},scene:0,scenes:[{nodes:meshes.map((_,i)=>i)}],
 nodes:meshes.map((_,i)=>({mesh:i})),meshes,buffers:[{byteLength:offset}],bufferViews,accessors,
 materials:colors.map(color=>({pbrMetallicRoughness:{baseColorFactor:[...color,1],metallicFactor:0,roughnessFactor:.8},doubleSided:true}))};
 const encoded=new TextEncoder().encode(JSON.stringify(doc));const jsonLength=Math.ceil(encoded.length/4)*4;
 const result=new ArrayBuffer(12+8+jsonLength+8+offset);const bytes=new Uint8Array(result),header=new DataView(result);
 header.setUint32(0,0x46546c67,true);header.setUint32(4,2,true);header.setUint32(8,result.byteLength,true);
 header.setUint32(12,jsonLength,true);header.setUint32(16,0x4e4f534a,true);bytes.fill(32,20,20+jsonLength);bytes.set(encoded,20);
 const binary=20+jsonLength;header.setUint32(binary,offset,true);header.setUint32(binary+4,0x004e4942,true);
 let cursor=binary+8;for(const buffer of buffers){bytes.set(new Uint8Array(buffer.buffer),cursor);cursor+=buffer.byteLength;}
 return result;
}
