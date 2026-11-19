// CPU diagnostic of actual chair transforms; no WebGL/browser performance claim.
import {performance} from 'node:perf_hooks';
import {BoxGeometry,InstancedMesh,Mesh,MeshBasicMaterial,Raycaster,Vector3} from 'three';
import {allSectors,sectorSeats,layout} from '../src/data/stadium.ts';
import {eneaLayout} from '../src/data/eneaLayout.ts';
import {writeSeatTransforms} from '../src/integrations/seatInstances.ts';
import {installSeatPicking} from '../src/integrations/seatPicking.ts';
const material=new MeshBasicMaterial(),baseGeometry=new BoxGeometry(1,layout.seatThickness,eneaLayout.seatDepth),backGeometry=new BoxGeometry(1,.56,.09);
const meshes=[],indexes=[],indexed=new Map();let count=0;
const buildStart=performance.now();
for(const block of allSectors){
 const seats=sectorSeats(block.id),base=new InstancedMesh(baseGeometry,material,seats.length),backs=new InstancedMesh(backGeometry,material,seats.length);
 writeSeatTransforms(seats,base,backs);base.updateMatrixWorld();backs.updateMatrixWorld();count+=seats.length;
 for(const mesh of [base,backs]){meshes.push(mesh);const index=installSeatPicking(mesh);indexes.push(index);indexed.set(mesh,mesh.raycast);}
}
const buildMs=performance.now()-buildStart;
const rays=['101','C1','C2','III-2'].flatMap(id=>{const seats=sectorSeats(id);return [seats[Math.floor(seats.length/3)],seats[Math.floor(seats.length*2/3)]].map(seat=>new Raycaster(new Vector3(seat.position[0],seat.position[1]+3,seat.position[2]),new Vector3(0,-1,0)));});
function run(useIndex){
 for(const mesh of meshes)mesh.raycast=useIndex?indexed.get(mesh):InstancedMesh.prototype.raycast;
 let candidates=0,hits=0;const originalMeshRaycast=Mesh.prototype.raycast;
 Mesh.prototype.raycast=function(ray,intersects){candidates++;return originalMeshRaycast.call(this,ray,intersects);};
 const start=performance.now();
 try{for(const ray of rays)hits+=ray.intersectObjects(meshes,false).length;return {ms:performance.now()-start,candidates,hits};}finally{Mesh.prototype.raycast=originalMeshRaycast;}
}
run(false);run(true);const baseline=[],accelerated=[];
for(let i=0;i<5;i++){baseline.push(run(false));accelerated.push(run(true));}
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const result={kind:'CPU_ONLY',seats:count,renderedInstances:count*2,rays:rays.length,buildMs:Number(buildMs.toFixed(2)),baselineMedianMs:Number(median(baseline.map(x=>x.ms)).toFixed(2)),indexedMedianMs:Number(median(accelerated.map(x=>x.ms)).toFixed(2)),baselineInstanceTestsPerRun:baseline[0].candidates,indexedInstanceTestsPerRun:accelerated[0].candidates,hitCount:accelerated[0].hits,matchingHitCounts:baseline.every((x,i)=>x.hits===accelerated[i].hits),note:'Node CPU diagnostic; actual mobile/WebGL latency and appearance remain unverified.'};
console.log(JSON.stringify(result,null,2));
for(const mesh of meshes)mesh.raycast=indexed.get(mesh);
indexes.forEach(index=>index.dispose());baseGeometry.dispose();backGeometry.dispose();material.dispose();
