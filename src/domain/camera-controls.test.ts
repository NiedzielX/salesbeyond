import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Box3,PerspectiveCamera,Vector3} from 'three';
import {OrbitControls} from 'three-stdlib';
import {constrainOrbitTarget,pauseOrbit,sectorMaxPolarAngle,sectorMinManualEyeY,sectorPanBounds,sectorPanTargetFloor} from '../components/cameraControls.ts';
import {allSectors,sectorBounds,sectorFrame,sectorMinDistance,sectorRows,seatsInRow} from '../data/stadium.ts';
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

test('przesuwanie przy płytkim zbliżeniu sektora II-2 odsłania pierwszy rząd i zatrzymuje się w granicach sektora',()=>{
 class OrbitSurface extends EventTarget{
  style={};
  ownerDocument=new EventTarget();
  clientHeight=555;
  releasePointerCapture(){}
 }
 const canvas=new OrbitSurface();
 const camera=new PerspectiveCamera(43,900/555,.1,1200);
 const controls=new OrbitControls(camera,canvas as unknown as HTMLElement);
 const {min,max}=sectorBounds('II-2')!;
 const seatBounds=new Box3(new Vector3(...min),new Vector3(...max));
 const bounds=sectorPanBounds(seatBounds);
 assert.equal(bounds.min.y,sectorPanTargetFloor);
 assert.equal(seatBounds.min.y,min[1],'pan expansion does not mutate canonical seat bounds');
 controls.enableDamping=true;
 controls.enablePan=true;
 controls.minDistance=sectorMinDistance;
 controls.maxPolarAngle=sectorMaxPolarAngle;
 controls.target.set(...sectorFrame('II-2').target);
 const angle=controls.maxPolarAngle;
 camera.position.copy(controls.target).add(new Vector3(-sectorMinDistance*Math.sin(angle),sectorMinDistance*Math.cos(angle),0));
 const lowerSeat=new Vector3(...seatsInRow('II-2',1)[18].position);
 const step=()=>{
  controls.update();
  constrainOrbitTarget(camera,controls.target,bounds);
  camera.updateMatrixWorld();
 };
 const pointer=(target:EventTarget,type:string,clientY:number)=>{
  const event=new Event(type);
  Object.assign(event,{pointerType:'mouse',pointerId:1,button:2,clientX:450,clientY});
  target.dispatchEvent(event);
 };
 try{
  step();
  assert.ok(lowerSeat.clone().project(camera).y< -1);
  for(let gesture=0;gesture<2;gesture++){
   pointer(canvas,'pointerdown',510);
   pointer(canvas.ownerDocument,'pointermove',30);
   pointer(canvas.ownerDocument,'pointerup',30);
   for(let frame=0;frame<240;frame++)step();
  }
  assert.equal(controls.target.y,sectorPanTargetFloor,'the damped pan continues below the first seat to expose the lower tier');
  assert.ok(bounds.containsPoint(controls.target));
  assert.ok(camera.position.y>sectorMinManualEyeY&&camera.position.y<1.85,'the eye stays above the pitch without keeping row one at the viewport edge');
  assert.ok(Math.abs(lowerSeat.clone().project(camera).y)<1);
  assert.ok(Math.abs(camera.position.distanceTo(controls.target)-sectorMinDistance)<1e-6);
 }finally{controls.dispose();}
});

test('dolny pan prostych i narożnych sektorów zachowuje bezpieczną wysokość oka',()=>{
 const eyeOffset=sectorMinDistance*Math.cos(sectorMaxPolarAngle);
 for(const {id} of allSectors){
  const raw=sectorBounds(id)!;
  const bounds=sectorPanBounds(new Box3(new Vector3(...raw.min),new Vector3(...raw.max)));
  assert.equal(bounds.min.y,sectorPanTargetFloor,id);
  const eyeY=bounds.min.y+eyeOffset;
  assert.ok(eyeY>sectorMinManualEyeY&&eyeY<1.85,`${id}: ${eyeY}`);
 }
});

test('wybór rzędu kadruje jego miejsca w prostych i narożnych sektorach, także na telefonie',()=>{
 for(const aspect of [.6,.95,1.6,2.4]){
  const camera=new PerspectiveCamera(43,aspect,.1,1200);
  for(const {id} of allSectors){
   const rows=sectorRows(id);
   assert.deepEqual(sectorFrame(id,aspect,0),sectorFrame(id,aspect),'unknown row falls back to the sector frame');
   for(const row of [rows[0],rows[Math.floor(rows.length/2)],rows.at(-1)!]){
    const {position,target}=sectorFrame(id,aspect,row);
    const seats=seatsInRow(id,row);
    const heights=seats.map(seat=>seat.position[1]);
    assert.equal(target[1],(Math.min(...heights)+Math.max(...heights))/2,`${id} row ${row}`);
    camera.position.set(...position);
    camera.lookAt(...target);
    camera.updateMatrixWorld();
    for(const seat of seats){
     const p=new Vector3(...seat.position).project(camera);
     assert.ok(Math.abs(p.x)<.9&&Math.abs(p.y)<.9&&Math.abs(p.z)<1,`${aspect} ${seat.id}`);
    }
    assert.ok(camera.position.y>3);
   }
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
