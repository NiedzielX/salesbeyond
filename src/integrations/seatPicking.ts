import {Box3,InstancedMesh,Matrix4,Mesh,Ray,Vector3,type Intersection} from 'three';
type Entry={id:number;box:Box3;center:Vector3};
type Node={box:Box3;left?:Node;right?:Node;entries?:Entry[]};
function branch(entries:Entry[]):Node{
 const box=new Box3();for(const entry of entries)box.union(entry.box);
 if(entries.length<=12)return {box,entries};
 const size=box.getSize(new Vector3()),axis=size.x>=size.y&&size.x>=size.z?'x':size.y>=size.z?'y':'z';
 entries.sort((a,b)=>a.center[axis]-b.center[axis]);const split=Math.floor(entries.length/2);
 return {box,left:branch(entries.slice(0,split)),right:branch(entries.slice(split))};
}
/** Index immutable instance transforms; keep Three's exact mesh raycast for candidate chairs. */
export function installSeatPicking(mesh:InstancedMesh){
 mesh.geometry.computeBoundingBox();const source=mesh.geometry.boundingBox!;
 const localMatrix=new Matrix4(),worldMatrix=new Matrix4(),inverse=new Matrix4(),localRay=new Ray();
 const entries:Entry[]=Array.from({length:mesh.count},(_,id)=>{
 mesh.getMatrixAt(id,localMatrix);const box=source.clone().applyMatrix4(localMatrix).expandByScalar(1e-6);
 return {id,box,center:box.getCenter(new Vector3())};
 });
 const tree=entries.length?branch(entries):null,original=mesh.raycast,proxy=new Mesh(mesh.geometry,mesh.material);
 const hits:Intersection[]=[];let live=true;
 const stats={boxTests:0,instanceTests:0};
 const indexed:InstancedMesh['raycast']=(raycaster,intersects)=>{
 stats.boxTests=0;stats.instanceTests=0;if(!live||!tree)return;
 inverse.copy(mesh.matrixWorld).invert();localRay.copy(raycaster.ray).applyMatrix4(inverse);
 proxy.geometry=mesh.geometry;proxy.material=mesh.material;
 const visit=(node:Node)=>{
 stats.boxTests++;if(!localRay.intersectsBox(node.box))return;
 if(node.entries){for(const entry of node.entries){
 stats.boxTests++;if(!localRay.intersectsBox(entry.box))continue;
 stats.instanceTests++;mesh.getMatrixAt(entry.id,localMatrix);worldMatrix.multiplyMatrices(mesh.matrixWorld,localMatrix);proxy.matrixWorld.copy(worldMatrix);
 proxy.raycast(raycaster,hits);
 for(const hit of hits){hit.instanceId=entry.id;hit.object=mesh;intersects.push(hit);}hits.length=0;
 }}else{if(node.left)visit(node.left);if(node.right)visit(node.right);}
 };
 visit(tree);
 };
 mesh.raycast=indexed;
 return {stats,dispose(){if(!live)return;live=false;if(mesh.raycast===indexed)mesh.raycast=original;}};
}
