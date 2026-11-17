import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {OrbitControls} from 'three-stdlib';
import {pauseOrbit} from '../components/cameraControls.ts';
test('stara bezwładność orbity nie przesuwa kamery po ukończonym locie',()=>{
 const camera=new PerspectiveCamera();camera.position.set(148,138,168);
 const controls=new OrbitControls(camera);controls.enableDamping=true;
 controls.setAzimuthalAngle(.5); // leaves a decaying rotation in the control
 const before=camera.position.clone();const direction=camera.quaternion.clone();
 pauseOrbit(controls,camera);
 assert.ok(camera.position.distanceTo(before)<.0001);assert.ok(camera.quaternion.angleTo(direction)<.0001);
 const destination=new Vector3(100,100,100);camera.position.copy(destination);controls.target.set(0,0,0);
 controls.enabled=true;controls.update();assert.ok(camera.position.distanceTo(destination)<.0001);
});

test('panorama mieści bryłę stadionu na telefonie i dużym ekranie',async()=>{
 const {overviewPosition}=await import('./camera.ts');
 for(const aspect of [350/370,900/555,1440/900,.6,2.4]){
 const camera=new PerspectiveCamera(43,aspect,.1,1200);
 camera.position.set(...overviewPosition(aspect));camera.lookAt(0,0,0);camera.updateMatrixWorld();
 for(const x of [-112,112])for(const z of [-94,94])for(const y of [0,33]){
 const projected=new Vector3(x,y,z).project(camera);
 assert.ok(Math.abs(projected.x)<1&&Math.abs(projected.y)<1,`aspect=${aspect} corner=${x},${y},${z}`);
 }
 }
});

test('utrata WebGL jest zgłaszana; odmontowana scena nie ma aktywnego listenera',async()=>{
 const {watchContextLoss}=await import('../components/contextLoss.ts');
 const canvas=new EventTarget();let lost=0;
 const cleanup=watchContextLoss(canvas,()=>lost++);
 canvas.dispatchEvent(new Event('webglcontextlost'));assert.equal(lost,1);
 cleanup();canvas.dispatchEvent(new Event('webglcontextlost'));assert.equal(lost,1);
});
