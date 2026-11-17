import {Matrix4,Quaternion,Vector3} from 'three';
import type {Point} from '../domain/camera.ts';
export function aimRotation(position:Point,target:Point,up:Vector3){
 return new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(new Vector3(...position),new Vector3(...target),up));
}
/** Slerp cannot pass through the zero direction when endpoints face opposite ways. */
export function rotateFlight(from:Quaternion,to:Quaternion,progress:number,result:Quaternion){
 return result.slerpQuaternions(from,to,progress);
}
