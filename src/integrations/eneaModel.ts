import {BufferGeometry,Float32BufferAttribute,Vector3} from 'three';
import {standProfiles,standRow,corners,cornerRow,cornerPoint,roofPoint,type Vec3} from '../data/eneaLayout.ts';
export type ModelLayer='bowl'|'roof'|'frame';
export type ModelPart={name:string;layer:ModelLayer;color:string;geometry:BufferGeometry};
class Surface{
 positions:number[]=[];
 quad(a:Vec3,b:Vec3,c:Vec3,d:Vec3){this.positions.push(...a,...b,...c,...a,...c,...d);}
 beam(a:Vec3,b:Vec3,radius=.12){
 const start=new Vector3(...a),end=new Vector3(...b),direction=end.clone().sub(start).normalize();
 const u=new Vector3().crossVectors(direction,Math.abs(direction.y)>.9?new Vector3(1,0,0):new Vector3(0,1,0)).normalize();
 const v=new Vector3().crossVectors(direction,u).normalize();
 const at=(center:Vector3,i:number)=>center.clone().addScaledVector(u,Math.cos(i*Math.PI/3)*radius).addScaledVector(v,Math.sin(i*Math.PI/3)*radius).toArray() as Vec3;
 for(let i=0;i<6;i++)this.quad(at(start,i),at(start,i+1),at(end,i+1),at(end,i));
 }
 geometry(){const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(this.positions,3));geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;}
}
const withY=(p:Vec3,y:number):Vec3=>[p[0],y,p[2]];
const place=(side:number,along:number,radial:number,y:number):Vec3=>side<2?[along,y,(side===0?1:-1)*(43+radial)]:[(side===2?1:-1)*(62+radial),y,along];
/** Code-authored Enea reconstruction. Rendering/export use the identical buffers. */
export function createEneaModel():ModelPart[]{
 const concrete=new Surface(),riser=new Surface(),fascia=new Surface(),openings=new Surface(),facade=new Surface(),roof=new Surface(),frame=new Surface(),glass=new Surface();
 for(const profile of standProfiles){
 const side=profile.side,half=side<2?54:35;
 for(let r=0;r<profile.rows;r++){
 const current=standRow(side,r),previous=r?standRow(side,r-1):{radial:-.82,deckY:0,tier:0};
 const front=r?previous.radial+.41:current.radial-.41,back=current.radial+.41;
 concrete.quad(place(side,-half,front,current.deckY),place(side,-half,back,current.deckY),place(side,half,back,current.deckY),place(side,half,front,current.deckY));
 riser.quad(place(side,-half,front,previous.deckY),place(side,half,front,previous.deckY),place(side,half,front,current.deckY),place(side,-half,front,current.deckY));
 if(profile.tierBreaks.includes(r)){
 fascia.quad(place(side,-half,front-.01,current.deckY-.4),place(side,half,front-.01,current.deckY-.4),place(side,half,front-.01,current.deckY+.12),place(side,-half,front-.01,current.deckY+.12));
 for(let along=-half+8;along<half-3;along+=18)openings.quad(place(side,along-1.4,front-.025,current.deckY-2.25),place(side,along+1.4,front-.025,current.deckY-2.25),place(side,along+1.4,front-.025,current.deckY-.45),place(side,along-1.4,front-.025,current.deckY-.45));
 }
 }
 const last=standRow(side,profile.rows-1),back=last.radial+.45;
 facade.quad(place(side,-half,back,0),place(side,-half,back,last.deckY),place(side,half,back,last.deckY),place(side,half,back,0));
 }
 for(const corner of corners){
 const {count}=cornerRow(corner,0);
 const edge=(row:number,angle:number,back:boolean,y?:number):Vec3=>{
 const p=cornerPoint(corner,Math.max(0,row),angle),direction=[corner.signX*Math.cos(angle),corner.signZ*Math.sin(angle)];
 return [p[0]+direction[0]*(back?.41:-.41),y??p[1],p[2]+direction[1]*(back?.41:-.41)];
 };
 for(let r=0;r<count;r++)for(let s=0;s<20;s++){
 const a=s/20*Math.PI/2,b=(s+1)/20*Math.PI/2;
 const pa=cornerPoint(corner,r,a),pb=cornerPoint(corner,r,b);
 const fa=r?edge(r-1,a,true,pa[1]):edge(r,a,false),fb=r?edge(r-1,b,true,pb[1]):edge(r,b,false);
 concrete.quad(fa,edge(r,a,true),edge(r,b,true),fb);
 riser.quad(withY(fa,r?cornerPoint(corner,r-1,a)[1]:0),withY(fb,r?cornerPoint(corner,r-1,b)[1]:0),fb,fa);
 if(r===count-1){const ba=edge(r,a,true),bb=edge(r,b,true);facade.quad(withY(ba,0),ba,bb,withY(bb,0));}
 }
 }
 const segments=384,rings=12;
 for(let i=0;i<segments;i++){
 const u=i/segments*8,next=(i+1)/segments*8;
 for(let j=0;j<rings;j++)roof.quad(roofPoint(u,j/rings),roofPoint(u,(j+1)/rings),roofPoint(next,(j+1)/rings),roofPoint(next,j/rings));
 const a=roofPoint(u,0),b=roofPoint(next,0),al=withY(a,a[1]-3),bl=withY(b,b[1]-3);
 frame.beam(withY(a,a[1]-.6),withY(b,b[1]-.6),.16);frame.beam(al,bl,.13);frame.beam(withY(a,a[1]-.6),bl,.08);
 if(i%4===0){
 const c=roofPoint(u,.12);frame.beam(al,withY(c,c[1]-.8),.1);
 }
 if(i%8===0){
 for(let j=0;j<4;j++){const a=roofPoint(u,j/4),b=roofPoint(u,(j+1)/4);frame.beam(withY(a,a[1]-.5),withY(b,b[1]-.5),.1);}
 const outer=roofPoint(u,1);frame.beam([outer[0],1,outer[2]],withY(outer,outer[1]-.3),.27);
 const neighbor=roofPoint((i+8)/segments*8,1);frame.beam([outer[0],2,outer[2]],withY(neighbor,neighbor[1]-.8),.14);
 }
 const oa=roofPoint(u,1),ob=roofPoint(next,1);
 // Membrane skirts on the high long stands; the end stands expose their frame.
 // A full opaque perimeter made the stadium read as a white box, unlike the reference.
 const side=Math.floor(u);
 if(side===0||side===4){
 roof.quad([oa[0],12,oa[2]],oa,ob,[ob[0],12,ob[2]]);
 glass.quad([oa[0]*1.001,13,oa[2]*1.001],[oa[0]*1.001,15,oa[2]*1.001],[ob[0]*1.001,15,ob[2]*1.001],[ob[0]*1.001,13,ob[2]*1.001]);
 }
 }
 return [
 {name:'Stepped bowl',layer:'bowl',color:'#aebbc9',geometry:concrete.geometry()},
 {name:'Risers',layer:'bowl',color:'#d1d9e2',geometry:riser.geometry()},
 {name:'Blue tier fascia',layer:'bowl',color:'#204c82',geometry:fascia.geometry()},
 {name:'Concourse portals',layer:'bowl',color:'#24394e',geometry:openings.geometry()},
 {name:'Rear structure',layer:'bowl',color:'#92a1b2',geometry:facade.geometry()},
 {name:'White membrane',layer:'roof',color:'#f1f3f6',geometry:roof.geometry()},
 {name:'Roof space truss',layer:'frame',color:'#9daec0',geometry:frame.geometry()},
 {name:'Perimeter glazing',layer:'roof',color:'#47647c',geometry:glass.geometry()},
 ];
}
export function rowDeckHeight(side:number,row:number){return standRow(side,row-1).deckY;}
