import {MathUtils,type Box3,type Camera,type Vector3} from 'three';
type OrbitState = {enabled:boolean;enableDamping:boolean;target:Vector3;update:()=>unknown};

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
