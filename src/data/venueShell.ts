import {sectors, rows, seatsPerRow} from './stadium.ts';
import {venueLayout} from './venueChart.ts';
type Vec=[number,number,number];
type Part={center:Vec;size:Vec;color:number};
const colors:Vec[]=[[.82,.86,.81],[.74,.78,.78],[.64,.69,.75],[.08,.25,.52],[.91,.94,.97]];

/** Own lightweight architectural shell. No downloaded models or textures. */
export function createVenueShell(roof:boolean):ArrayBuffer{
 const parts:Part[]=[];
 const box=(center:Vec,size:Vec,color:number)=>parts.push({center,size,color});
 box([0,-.6,0],[204,.4,170],0);
 box([0,-.35,0],[178,.2,145],1);
 for(let row=0;row<27;row++){
 const z=venueLayout.firstRowZ+row*venueLayout.rowDepth;
 const y=venueLayout.firstDeckY+row*venueLayout.rowRise;
 const bands:[number,number][]=[];
 let from=-60;
 const half=seatsPerRow*venueLayout.seatSpacing/2+.3;
 if(row<rows){for(const sector of sectors){bands.push([from,sector.center-half]);from=sector.center+half;}}
 bands.push([from,60]);
 for(const [a,b] of bands){
 if(b<=a)continue;
 box([(a+b)/2,y/2,z],[b-a,y,venueLayout.rowDepth],2);
 box([(a+b)/2,y+.15,z+.3],[b-a,.3,.4],3);
 }
 box([0,y/2,-z],[120,y,venueLayout.rowDepth],2);
 box([0,y+.15,-z-.3],[120,.3,.4],3);
 for(const sign of [-1,1]){
 const x=sign*(61+row*venueLayout.rowDepth);
 box([x,y/2,0],[venueLayout.rowDepth,y,84],2);
 box([x+sign*.3,y+.15,0],[.4,.3,84],3);
 }
 }
 if(roof){
 box([0,23,61],[124,1,25],4);box([0,23,-61],[124,1,25],4);
 box([79,23,0],[25,1,122],4);box([-79,23,0],[25,1,122],4);
 }
 const buffers:Float32Array[]=[];const bufferViews:object[]=[];const accessors:object[]=[];const meshes:object[]=[];
 let offset=0;
 const accessor=(values:number[],kind:'POSITION'|'NORMAL')=>{
 const data=new Float32Array(values);const view=bufferViews.length;
 bufferViews.push({buffer:0,byteOffset:offset,byteLength:data.byteLength,target:34962});offset+=data.byteLength;buffers.push(data);
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<values.length;i++) {min[i%3]=Math.min(min[i%3],values[i]);max[i%3]=Math.max(max[i%3],values[i]);}
 const index=accessors.length;accessors.push({bufferView:view,componentType:5126,count:values.length/3,type:'VEC3',...(kind==='POSITION'?{min,max}:{})});return index;
 };
 for(let color=0;color<colors.length;color++){
 const position:number[]=[],normal:number[]=[];
 for(const p of parts.filter(p=>p.color===color)){
 for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
 const u=(axis+1)%3,v=(axis+2)%3;
 const corners=[[-1,-1],[1,-1],[1,1],[-1,1]];
 const order=sign>0?[0,1,2,0,2,3]:[0,2,1,0,3,2];
 for(const i of order){const point=[...p.center];point[axis]+=sign*p.size[axis]/2;point[u]+=corners[i][0]*p.size[u]/2;point[v]+=corners[i][1]*p.size[v]/2;position.push(...point);normal.push(...[0,1,2].map(a=>a===axis?sign:0));}
 }
 }
 if(!position.length)continue;
 meshes.push({primitives:[{attributes:{POSITION:accessor(position,'POSITION'),NORMAL:accessor(normal,'NORMAL')},material:color}]});
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
