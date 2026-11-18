export type Vec3=[number,number,number];
/** Authored reconstruction proportions, not a surveyed seating plan. */
export const eneaLayout={straightHalfX:54,straightHalfZ:35,cornerRadius:8,rowDepth:.82,seatSpacing:.58,seatWidth:.48,seatDepth:.44,seatThickness:.16,firstDeckY:1.5,roofHalfX:122,roofHalfZ:102,roofRadius:28};
export const standProfiles=[
 {side:0,rows:46,rise:.62,tierBreaks:[22],name:'Trybuna I'},
 {side:1,rows:46,rise:.62,tierBreaks:[22],name:'Trybuna III'},
 {side:2,rows:54,rise:.64,tierBreaks:[18,36],name:'Trybuna II'},
 {side:3,rows:32,rise:.51,tierBreaks:[16],name:'Trybuna IV'},
];
export function standRow(side:number,index:number){
 const profile=standProfiles[side];
 const tier=profile.tierBreaks.filter(split=>index>=split).length;
 return {radial:index*eneaLayout.rowDepth+Math.floor(index/18)*2,deckY:eneaLayout.firstDeckY+index*profile.rise+tier*2.4,tier:tier+1};
}
export function straightPoint(side:number,index:number,along:number):Vec3{
 const {radial,deckY}=standRow(side,index);
 return side<2?[along,deckY,(side===0?1:-1)*(43+radial)]:[(side===2?1:-1)*(62+radial),deckY,along];
}
export const corners=[
 {id:'C1',signX:1,signZ:1,longSide:0,endSide:2},
 {id:'C2',signX:1,signZ:-1,longSide:1,endSide:2},
 {id:'C3',signX:-1,signZ:-1,longSide:1,endSide:3},
 {id:'C4',signX:-1,signZ:1,longSide:0,endSide:3},
];
export function cornerRow(corner:typeof corners[number],index:number){
 const count=Math.max(standProfiles[corner.longSide].rows,standProfiles[corner.endSide].rows);
 const progress=index/Math.max(1,count-1);
 const long=standRow(corner.longSide,progress*(standProfiles[corner.longSide].rows-1));
 const end=standRow(corner.endSide,progress*(standProfiles[corner.endSide].rows-1));
 return {count,long,end};
}
export function cornerPoint(corner:typeof corners[number],index:number,angle:number):Vec3{
 const {long,end}=cornerRow(corner,index);const w=angle/(Math.PI/2);
 return [corner.signX*(54+(8+end.radial)*Math.cos(angle)),end.deckY*(1-w)+long.deckY*w,corner.signZ*(35+(8+long.radial)*Math.sin(angle))];
}
/** Equal arc-length spacing also works where the low end stand meets a taller side. */
export function cornerSeats(corner:typeof corners[number],index:number){
 const samples=Array.from({length:129},(_,i)=>{const angle=.04+i/128*(Math.PI/2-.08);return {angle,point:cornerPoint(corner,index,angle),distance:0};});
 for(let i=1;i<samples.length;i++)samples[i].distance=samples[i-1].distance+Math.hypot(samples[i].point[0]-samples[i-1].point[0],samples[i].point[2]-samples[i-1].point[2]);
 const length=samples.at(-1)!.distance,count=Math.max(1,Math.floor(length/eneaLayout.seatSpacing));
 return Array.from({length:count},(_,i)=>{
 const distance=(i+.5)*length/count;let j=1;while(samples[j].distance<distance)j++;
 const before=samples[j-1],after=samples[j],t=(distance-before.distance)/(after.distance-before.distance);
 const angle=before.angle+(after.angle-before.angle)*t;
 const point=cornerPoint(corner,index,angle);
 const heading=Math.atan2(corner.signX*Math.cos(angle),corner.signZ*Math.sin(angle));
 return {point,heading,index:i};
 }).filter(s=>s.index%27<25);
}

/** Matching rounded rings, running clockwise from the northeast inner edge. */
export function ringPoint(step:number,halfX:number,halfZ:number,radius:number):[number,number]{
 const s=((step%8)+8)%8,part=Math.floor(s),t=s-part;
 const x=halfX-radius,z=halfZ-radius;
 switch(part){
 case 0:return [x*(1-2*t),halfZ];
 case 1:{const a=Math.PI/2+t*Math.PI/2;return [-x+radius*Math.cos(a),z+radius*Math.sin(a)];}
 case 2:return [-halfX,z*(1-2*t)];
 case 3:{const a=Math.PI+t*Math.PI/2;return [-x+radius*Math.cos(a),-z+radius*Math.sin(a)];}
 case 4:return [-x+2*x*t,-halfZ];
 case 5:{const a=Math.PI*1.5+t*Math.PI/2;return [x+radius*Math.cos(a),-z+radius*Math.sin(a)];}
 case 6:return [halfX,-z+2*z*t];
 default:{const a=t*Math.PI/2;return [x+radius*Math.cos(a),z+radius*Math.sin(a)];}
 }
}
export function roofPoint(step:number,across:number):Vec3{
 const inner=ringPoint(step,62,43,8),outer=ringPoint(step,122,102,28);
 const s=((step%8)+8)%8,part=Math.floor(s),t=s-part;
 const long=(x:number)=>42+11*Math.cos(x/108*Math.PI/2);
 const low=(z:number)=>29+3*Math.cos(z/70*Math.PI/2);
 const high=(z:number)=>45+3*Math.cos(z/70*Math.PI/2);
 let height:number,drop:number;
 if(part===0||part===4){height=long(inner[0]);drop=22;}
 else if(part===2){height=low(inner[1]);drop=12;}
 else if(part===6){height=high(inner[1]);drop=6;}
 else{
 const from=part===1||part===5?long(54):part===3?low(35):high(35);
 const to=part===1?low(35):part===3?long(54):part===5?high(35):long(54);
 const a=part===1||part===5?22:part===3?12:6,b=part===1?12:part===3?22:part===5?6:22;
 height=from+(to-from)*t;drop=a+(b-a)*t;
 }
 const pillow=.9*Math.sin(step*Math.PI*12)**2*Math.sin(Math.PI*across);
 return [inner[0]+(outer[0]-inner[0])*across,height+8*Math.sin(Math.PI*across)-drop*across**2+pillow,inner[1]+(outer[1]-inner[1])*across];
}
