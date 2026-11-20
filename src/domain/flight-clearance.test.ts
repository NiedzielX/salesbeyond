import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Box3,DoubleSide,Mesh,MeshBasicMaterial,Quaternion,Ray,Raycaster,Vector3} from 'three';
import {columnPositions,roofCutawayNormal,showStructure} from '../components/structure.ts';
import {aimRotation,rotateFlight} from '../components/cameraRotation.ts';
import {eyePosition,flightDuration,flightPoint,flightProgress,overviewPosition,seatTransferControl} from './camera.ts';
import {sectors,allSectors,resolveSeat,sectorSeats} from '../data/stadium.ts';
import {createEneaModel} from '../integrations/eneaModel.ts';
test('reset z dowolnego fotela pozostawia dach i podpory odkryte do zakończenia lotu',()=>{
 const staticColumns=[0,1,2,3].flatMap(side=>columnPositions(side,'overview')).map(p=>new Box3().setFromCenterAndSize(new Vector3(...p),new Vector3(.7,33,.7)));
 const flyingColumns=[0,1,2,3].flatMap(side=>columnPositions(side,'overview',true)).map(p=>new Box3().setFromCenterAndSize(new Vector3(...p),new Vector3(.7,33,.7)));
 let baselineHits=0;
 for(const aspect of [1.6,.46])for(const sector of allSectors)for(const seat of sectorSeats(sector.id)){
  const from=new Vector3(...eyePosition(seat)),to=new Vector3(...overviewPosition(aspect)),length=from.distanceTo(to),ray=new Ray(from,to.clone().sub(from).normalize());
  const intersects=(box:Box3)=>{const hit=ray.intersectBox(box,new Vector3());return hit&&from.distanceTo(hit)<length;};
  if(staticColumns.some(intersects))baselineHits++;
  assert.equal(flyingColumns.some(intersects),false,seat.id);
 }
 assert.ok(baselineHits>0,'regresja obejmuje rzeczywiste przecięcia z przedwcześnie pokazanymi podporami');
 assert.equal(showStructure('overview',true),false);assert.equal(showStructure('overview',false),true);
 assert.equal(showStructure('seat',false),false);
});
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

test('zmiana podglądu fotela omija widoczne stopnie, ściany i dach',()=>{
 const parts=createEneaModel();
 const material=new MeshBasicMaterial({side:DoubleSide});
 const meshes=parts.map(part=>new Mesh(part.geometry,material));
 const raycaster=new Raycaster();
 try{
  for(const [fromId,toId] of [
   ['I-1-46-29','101-1-10'],
   ['II-3-1-19','II-1-54-18'],
   ['C3-46-51','I-1-46-29'],
   ['102-1-9','III-2-1-28'],
  ]){
   const destination=resolveSeat(toId)!;
   const from=eyePosition(resolveSeat(fromId)!);
   const to=eyePosition(destination);
   const control=seatTransferControl(from,to);
   const side=allSectors.find(sector=>sector.id===destination.sectorId)!.side;
   const roofNormal=new Vector3(...roofCutawayNormal('seat',side)!);
   assert.deepEqual(flightPoint(from,to,0,false,control),from);
   assert.deepEqual(flightPoint(from,to,0,true,control),to);
   let previous=new Vector3(...flightPoint(from,to,0,false,control));
   for(let step=1;step<=24;step++){
    const elapsed=flightDuration*step/24;
    const next=new Vector3(...flightPoint(from,to,elapsed,false,control));
    const offset=next.clone().sub(previous);
    raycaster.far=offset.length();
    raycaster.set(previous,offset.normalize());
    for(const [index,part] of parts.entries()){
     const hit=raycaster.intersectObject(meshes[index]).find(intersection=>part.layer==='bowl'||roofNormal.dot(intersection.point)>=0);
     assert.ok(!hit,`${fromId} → ${toId}, ${part.name}, klatka ${step}`);
    }
    assert.ok(Math.abs(next.y-flightPoint(from,to,elapsed)[1])<.0001);
    previous=next;
   }
   assert.ok(previous.distanceTo(new Vector3(...to))<.0001);
  }
 }finally{
  material.dispose();
  parts.forEach(part=>part.geometry.dispose());
 }
});
