import {MathUtils,Vector3,type Box3,type Camera} from 'three';
import type {Point} from '../domain/camera.ts';
import {aimRotation} from './cameraRotation.ts';
type OrbitState = {enabled:boolean;enableDamping:boolean;target:Vector3;update:()=>unknown};

/** Re-aim a seat view at the pitch without changing the eye position. */
export function recenterCamera(position:Point){
 const target:Point=[0,1,0];
 const direction:Point=[target[0]-position[0],target[1]-position[1],target[2]-position[2]];
 return {
  quaternion:aimRotation(position,target,new Vector3(0,1,0)),
  yaw:Math.atan2(direction[0],direction[2]),
  pitch:Math.atan2(direction[1],Math.hypot(direction[0],direction[2]))
 };
}

/** Sector orbit may approach the lowest rows while keeping the eye above pitch furniture. */
export const sectorMaxPolarAngle=Math.PI*.49;
export const sectorPanTargetFloor=.75;
export const sectorMinManualEyeY=1.7;

/** Extend manual pan slightly below the first chair, without allowing a pitch-level camera. */
export function sectorPanBounds(seatBounds:Box3){
 const bounds=seatBounds.clone();
 bounds.min.y=Math.min(bounds.min.y,sectorPanTargetFloor);
 return bounds;
}

/** Keep the pan inside the sector and move the camera with its target. */
export function constrainOrbitTarget(camera:Camera,target:Vector3,bounds:Box3){
 const x=MathUtils.clamp(target.x,bounds.min.x,bounds.max.x);
 const y=MathUtils.clamp(target.y,bounds.min.y,bounds.max.y);
 const z=MathUtils.clamp(target.z,bounds.min.z,bounds.max.z);
 camera.position.x+=x-target.x;
 camera.position.y+=y-target.y;
 camera.position.z+=z-target.z;
 target.set(x,y,z);
}

/** Clear old drag inertia without moving the start of the next flight. */
export function pauseOrbit(controls:OrbitState,camera:Camera){
 const position=camera.position.clone();
 const rotation=camera.quaternion.clone();
 const target=controls.target.clone();
 const damping=controls.enableDamping;
 controls.enabled=false;
 controls.enableDamping=false;
 controls.update();
 controls.enableDamping=damping;
 controls.target.copy(target);
 camera.position.copy(position);
 camera.quaternion.copy(rotation);
}
