import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DoubleSide,Mesh,MeshBasicMaterial,PerspectiveCamera,Raycaster,Vector3} from 'three';
import {createEneaModel} from './eneaModel.ts';
import {roofPoint,standProfiles,standRow} from '../data/eneaLayout.ts';
import {allSectors,sectorSeats,sectorRows,seatsInRow,sectorFrame,layout} from '../data/stadium.ts';
import {overviewPosition} from '../domain/camera.ts';

test('autorski model ma ciągły łukowy dach i zróżnicowane kondygnacje zamiast czterech płyt',()=>{
 for(const v of [0,.25,.5,1])assert.deepEqual(roofPoint(0,v),roofPoint(8,v));
 for(let i=1;i<8;i++)for(const v of [0,.5,1])assert.ok(Math.hypot(...roofPoint(i-1e-7,v).map((x,a)=>x-roofPoint(i+1e-7,v)[a]))<.001);
 assert.ok(roofPoint(.5,.4)[1]>roofPoint(2.5,.4)[1]+10);
 assert.equal(standRow(2,53).tier,3);assert.equal(standRow(0,45).tier,2);
 assert.ok(standRow(2,53).deckY>standRow(3,31).deckY+15);
 const parts=createEneaModel();let triangles=0;
 for(const part of parts){const p=part.geometry.getAttribute('position');triangles+=p.count/3;assert.ok(Array.from(p.array).every(Number.isFinite));part.geometry.dispose();}
 assert.ok(triangles<60000);
});
test('fotele proste i w narożnikach opierają się na rzeczywiście renderowanych stopniach',()=>{
 const parts=createEneaModel(),deck=parts.find(p=>p.name==='Stepped bowl')!;
 const material=new MeshBasicMaterial({side:DoubleSide}),mesh=new Mesh(deck.geometry,material);mesh.updateMatrixWorld();
 const ray=new Raycaster();let checked=0;
 for(const sector of allSectors){const rows=sectorRows(sector.id);for(const row of [rows[0],rows[Math.floor(rows.length/2)],rows.at(-1)!]){
 const seats=seatsInRow(sector.id,row);for(const seat of [seats[0],seats[Math.floor(seats.length/2)],seats.at(-1)!]){
 ray.set(new Vector3(seat.position[0],seat.position[1]+.02,seat.position[2]),new Vector3(0,-1,0));const hit=ray.intersectObject(mesh)[0];
 assert.ok(hit,seat.id);assert.ok(Math.abs(hit.point.y-(seat.position[1]-layout.seatThickness/2))<.025,`${seat.id} foot mismatch`);checked++;
 }
 }}
 assert.ok(checked>150);material.dispose();parts.forEach(p=>p.geometry.dispose());
});
test('kadry obejmują membranę oraz cały sektor od strony boiska również na telefonie',()=>{
 const parts=createEneaModel();
 for(const aspect of [.6,.95,1.6,2.4]){
 const camera=new PerspectiveCamera(43,aspect,.1,1200);camera.position.set(...overviewPosition(aspect));camera.lookAt(0,0,0);camera.updateMatrixWorld();
 for(const part of parts){const box=part.geometry.boundingBox!;for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
 const p=new Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1,part.name);
 }}
 for(const sector of allSectors){const frame=sectorFrame(sector.id,aspect);camera.position.set(...frame.position);camera.lookAt(...frame.target);camera.updateMatrixWorld();
 const seats=sectorSeats(sector.id);for(let i=0;i<seats.length;i+=Math.max(1,Math.floor(seats.length/30))){const p=new Vector3(...seats[i].position).project(camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1,`${sector.id} ${aspect}`);}
 const radial=frame.position[0]*frame.target[0]+frame.position[2]*frame.target[2];assert.ok(radial<frame.target[0]**2+frame.target[2]**2,'kamera sektora po stronie boiska');
 }
 }
 parts.forEach(p=>p.geometry.dispose());assert.equal(standProfiles.length,4);
});
