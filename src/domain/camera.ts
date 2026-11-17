import { layout, type Seat } from '../data/stadium.ts';
export type Point = [number,number,number];
export const flightDuration = 2.4;
export const seatThickness = layout.seatThickness;
export function eyePosition(seat:Seat):Point {return [seat.position[0],seat.position[1]+seatThickness/2+1.1,seat.position[2]];}
export function flightProgress(elapsed:number,reduced=false){
 const p=reduced?1:Math.max(0,Math.min(1,elapsed/flightDuration));return p*p*(3-2*p);
}
export function flightPoint(from:Point,to:Point,elapsed:number,reduced=false):Point{
 const t=flightProgress(elapsed,reduced);
 return from.map((v,i)=>v+(to[i]-v)*t) as Point;
}
export function lookTarget(eye:Point,yaw:number,pitch:number):Point{
 return [eye[0]+Math.sin(yaw)*Math.cos(pitch),eye[1]+Math.sin(pitch),eye[2]+Math.cos(yaw)*Math.cos(pitch)];
}

/** Fit all stadium corners in the perspective frustum, including portrait screens. */
export function overviewScale(aspect:number){
 const base:Point=[148,138,168];
 const distance=Math.hypot(...base);
 const n=base.map(v=>v/distance) as Point;
 const horizontal=Math.hypot(n[0],n[2]);
 const right:Point=[n[2]/horizontal,0,-n[0]/horizontal];
 const up:Point=[-n[1]*n[0]/horizontal,horizontal,-n[1]*n[2]/horizontal];
 const dot=(a:Point,b:Point)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
 const tan=Math.tan(43*Math.PI/360)*.9; // ten percent framing margin
 let required=distance;
 for(const x of [-112,112])for(const y of [0,33])for(const z of [-94,94]){
 const corner:Point=[x,y,z];
 required=Math.max(required,dot(corner,n)+Math.max(Math.abs(dot(corner,right))/(tan*Math.max(.3,aspect)),Math.abs(dot(corner,up))/tan));
 }
 return required/distance;
}
export function overviewPosition(aspect:number):Point{
 const scale=overviewScale(aspect);return [148*scale,138*scale,168*scale];
}
