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
 const concrete=new Surface(),riser=new Surface(),fascia=new Surface(),openings=new Surface(),facade=new Surface(),roof=new Surface(),frame=new Surface(),glass=new Surface(),seams=new Surface(),concourse=new Surface(),windows=new Surface();
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
 if(i%4===0){
 // A triangular space truss, with broad bays rather than hundreds of tiny diagonals.
 // Both upper chords follow the membrane; the lower chord gives the opening depth.
 const v=(i+4)/segments*8,a=roofPoint(u,0),b=roofPoint(v,0),c=roofPoint(u,.055),d=roofPoint(v,.055);
 const au=withY(a,a[1]-.45),bu=withY(b,b[1]-.45),cu=withY(c,c[1]-.5),du=withY(d,d[1]-.5),al=withY(a,a[1]-4.5),bl=withY(b,b[1]-4.5);
 frame.beam(au,bu,.3);frame.beam(cu,du,.24);frame.beam(al,bl,.24);
 frame.beam(au,bl,.14);frame.beam(al,cu,.13);frame.beam(al,du,.12);
 // Raised pale seams coincide with the valleys of the authored membrane pillows.
 for(let j=0;j<rings;j++){
 const a=roofPoint(u,j/rings),b=roofPoint(u,(j+1)/rings);
 seams.beam(withY(a,a[1]+.07),withY(b,b[1]+.07),.075);
 }
 }
 if(i%8===0){
 for(let j=0;j<4;j++){const a=roofPoint(u,j/4),b=roofPoint(u,(j+1)/4);frame.beam(withY(a,a[1]-.5),withY(b,b[1]-.5),.1);}
 const outer=roofPoint(u,1);frame.beam([outer[0],1,outer[2]],withY(outer,outer[1]-.3),.27);
 const neighbor=roofPoint((i+8)/segments*8,1);frame.beam([outer[0],2,outer[2]],withY(neighbor,neighbor[1]-.8),.14);
 }
 const oa=roofPoint(u,1),ob=roofPoint(next,1);
 // Three exposed concourse bands and glazed bays break up the flat perimeter wall.
 // They remain behind the seating bowl and do not introduce any new seat positions.
 for(const y of [3.5,7.5,11.5]){
 const outset=(p:Vec3,height:number,scale:number):Vec3=>[p[0]*scale,height,p[2]*scale];
 concourse.quad(outset(oa,y,1.006),outset(ob,y,1.006),outset(ob,y+.45,1.006),outset(oa,y+.45,1.006));
 concourse.quad(outset(oa,y+.45,.994),outset(oa,y+.45,1.006),outset(ob,y+.45,1.006),outset(ob,y+.45,.994));
 windows.quad(withY(oa,y-2.8),withY(ob,y-2.8),withY(ob,y-.15),withY(oa,y-.15));
 }
 if(i%8===0)concourse.beam(withY(oa,.3),withY(oa,12),.4);
 // Membrane skirts on the high long stands; the end stands expose their frame.
 // A full opaque perimeter made the stadium read as a white box, unlike the reference.
 const side=Math.floor(u);
 if(side===0||side===4){
 const apron=(step:number,t:number):Vec3=>{
 const outer=roofPoint(step,1),scallop=Math.sin(step*Math.PI*12)**2;
 const swell=1+.012*Math.sin(t*Math.PI)*scallop;
 return [outer[0]*swell,12+scallop*.8+(outer[1]-12-scallop*.8)*t,outer[2]*swell];
 };
 for(let j=0;j<4;j++)roof.quad(apron(u,j/4),apron(u,(j+1)/4),apron(next,(j+1)/4),apron(next,j/4));
 if(i%4===0)for(let j=0;j<4;j++)seams.beam(apron(u,j/4),apron(u,(j+1)/4),.075);
 glass.quad([oa[0]*1.001,12,oa[2]*1.001],[oa[0]*1.001,13,oa[2]*1.001],[ob[0]*1.001,13,ob[2]*1.001],[ob[0]*1.001,12,ob[2]*1.001]);
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
 {name:'Membrane seams',layer:'roof',color:'#dce2e7',geometry:seams.geometry()},
 {name:'Exterior concourses',layer:'bowl',color:'#b5bfca',geometry:concourse.geometry()},
 {name:'Facade glazing',layer:'bowl',color:'#567184',geometry:windows.geometry()},
 ];
}
export function rowDeckHeight(side:number,row:number){return standRow(side,row-1).deckY;}
