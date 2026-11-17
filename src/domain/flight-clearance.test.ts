import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Box3,Quaternion,Ray,Vector3} from 'three';
import {columnPositions} from '../components/structure.ts';
import {aimRotation,rotateFlight} from '../components/cameraRotation.ts';
import {eyePosition,flightProgress,overviewPosition} from './camera.ts';
import {sectors,sectorSeats} from '../data/stadium.ts';
test('lot z sektora do każdego dostępnego fotela omija widoczne słupy',()=>{
 const columns=[0,1,2,3].flatMap(side=>columnPositions(side,'seat'));
 for(const sector of sectors)for(const seat of sectorSeats(sector.id).filter(s=>s.available)){
 const from=new Vector3(sector.center,48,96),to=new Vector3(...eyePosition(seat));
 const direction=to.clone().sub(from),length=direction.length();const ray=new Ray(from,direction.normalize());
 for(const p of columns){const box=new Box3().setFromCenterAndSize(new Vector3(...p),new Vector3(.7,33,.7));const hit=ray.intersectBox(box,new Vector3());assert.ok(!hit||from.distanceTo(hit)>length,seat.id);}
 }
 assert.equal(columnPositions(0,'overview').length,9);
});
test('reset z przeciwległego kierunku obraca kamerę bez zerowego kierunku lub nagłego odwrócenia',()=>{
 const eye:[number,number,number]=[0,10,50];
 const end=overviewPosition(1.6),up=new Vector3(0,1,0);
 const from=aimRotation(eye,[eye[0]+end[0],eye[1]+end[1],eye[2]+end[2]],up);
 const to=aimRotation(end,[0,0,0],up);const result=new Quaternion();let previous=from.clone();
 for(let frame=0;frame<=144;frame++){
 rotateFlight(from,to,flightProgress(frame/60),result);
 assert.ok(Math.abs(result.length()-1)<.0001);assert.ok(previous.angleTo(result)<.05);previous=result.clone();
 }
 assert.ok(result.angleTo(to)<.0001);
});
