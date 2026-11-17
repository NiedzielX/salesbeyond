import { layout, type Seat } from '../data/stadium.ts';
export type Point = [number,number,number];
export const flightDuration = 2.4;
export const seatThickness = layout.seatThickness;
export function eyePosition(seat:Seat):Point {return [seat.position[0],seat.position[1]+seatThickness/2+1.1,seat.position[2]];}
export function flightPoint(from:Point,to:Point,elapsed:number,reduced=false):Point{
 const p=reduced?1:Math.max(0,Math.min(1,elapsed/flightDuration));const t=p*p*(3-2*p);
 return from.map((v,i)=>v+(to[i]-v)*t) as Point;
}
export function lookTarget(eye:Point,yaw:number,pitch:number):Point{
 return [eye[0]+Math.sin(yaw)*Math.cos(pitch),eye[1]+Math.sin(pitch),eye[2]+Math.cos(yaw)*Math.cos(pitch)];
}
