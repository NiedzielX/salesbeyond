import type {Camera,Vector3} from 'three';
type OrbitState = {enabled:boolean;enableDamping:boolean;target:Vector3;update:()=>unknown};
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
