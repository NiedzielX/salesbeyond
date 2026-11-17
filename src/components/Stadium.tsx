import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Line, Html } from '@react-three/drei';
import { useMemo, useRef, useEffect, useState, Component, type ReactNode } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { layout, sectors, sectorSeats, type SectorId, type Seat } from '../data/stadium';
import { eyePosition, flightPoint, lookTarget, type Point } from '../domain/camera';
import type { View } from '../domain/selection';
export type { View } from '../domain/selection';
type Props = {sector: SectorId | null; seat:Seat|null; view:View; roof:boolean; onSector:(id:SectorId)=>void; onSeat:(seat:Seat)=>void; reset:number; onReady:()=>void; onUnavailable:()=>void};
function Box({position,size,color,rotation=0}: {position:[number,number,number];size:[number,number,number];color:string;rotation?:number}){return <mesh position={position} rotation-y={rotation} receiveShadow castShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.8}/></mesh>}
function Pitch(){
 const markings=useMemo(()=>{
 const rect=(a:number,b:number,x=0,z=0):[number,number,number][]=>[[-a/2+x,.15,-b/2+z],[a/2+x,.15,-b/2+z],[a/2+x,.15,b/2+z],[-a/2+x,.15,b/2+z],[-a/2+x,.15,-b/2+z]];
 return [rect(105,68),[[0,.15,-34],[0,.15,34]] as [number,number,number][],...[-1,1].flatMap(s=>[rect(16.5,40.32,s*44.25),rect(5.5,18.32,s*49.75)]),Array.from({length:65},(_,i)=>[Math.cos(i/64*Math.PI*2)*9.15,.15,Math.sin(i/64*Math.PI*2)*9.15] as [number,number,number])];},[]);
 return <group><Box position={[0,-.4,0]} size={[119,.7,82]} color="#417a55"/>{Array.from({length:14},(_,i)=><Box key={i} position={[-48.75+i*7.5,0,0]} size={[7.5,.12,68]} color={i%2?'#72a16a':'#7caa73'}/>)}{markings.map((p,i)=><Line key={i} points={p} color="#edf4dd" lineWidth={1.2}/>)}{[-1,1].map(s=><group key={s}><Line points={[[s*52.5,.2,-3.66],[s*52.5,2.44,-3.66],[s*52.5,2.44,3.66],[s*52.5,.2,3.66]]} color="white" lineWidth={3}/><Box position={[s*54,1.2,0]} size={[.12,2.4,7.32]} color="#c2d2c5"/></group>)}</group>
}
function Tier({side}:{side:number}){
 const ref=useRef<THREE.InstancedMesh>(null);
 const placements=useMemo(()=>{const result:{position:Point;back:Point;color:string}[]=[];const count=Math.floor((side<2?118:82)/1.25);
 for(let r=0;r<27;r++)for(let c=0;c<count;c++){
 const along=(c-(count-1)/2)*1.25;
 if(c%24<2)continue; // leave aisles open
 if(side===0&&r<12&&sectors.some(s=>Math.abs(along-s.center)<16.5))continue;
 const position:Point=side<2?[along,layout.firstSeatY+r*layout.rowRise,(side===0?1:-1)*(43+r*layout.rowDepth)]:[(side===2?1:-1)*(61+r*layout.rowDepth),layout.firstSeatY+r*layout.rowRise,along];
 const back:Point=[...position];back[1]+=.46;back[side<2?2:0]+=(side===0||side===2?1:-1)*.35;
 result.push({position,back,color:(r+c*3)%11<2?'#e0e6ef':'#2363b3'});
 }return result},[side]);
 useEffect(()=>{if(!ref.current)return;const o=new THREE.Object3D();placements.forEach((p,i)=>{[p.position,p.back].forEach((pos,k)=>{o.position.set(...pos);o.rotation.y=side<2?0:Math.PI/2;o.scale.set(1,k===0?.3:1,k===0?6:1);o.updateMatrix();ref.current!.setMatrixAt(i*2+k,o.matrix);ref.current!.setColorAt(i*2+k,new THREE.Color(p.color));});});ref.current.instanceMatrix.needsUpdate=true;},[placements,side]);
 return <group>{Array.from({length:27},(_,r)=><Box key={r} position={side<2?[0,layout.firstStepY+r*layout.rowRise,(side===0?1:-1)*(43+r*layout.rowDepth)]:[(side===2?1:-1)*(61+r*layout.rowDepth),layout.firstStepY+r*layout.rowRise,0]} size={side<2?[118,layout.stepHeight,layout.rowDepth]:[layout.rowDepth,layout.stepHeight,82]} color={r%8===0?'#d5dbe1':'#aab4c1'}/>)}<instancedMesh ref={ref} args={[undefined,undefined,placements.length*2]}><boxGeometry args={[.88,.72,.15]}/><meshStandardMaterial roughness={.65}/></instancedMesh></group>
}
function DemoSeats({sector,onSeat,selected,interactive}:{sector:SectorId;onSeat:(seat:Seat)=>void;selected:Seat|null;interactive:boolean}){
 const ref=useRef<THREE.InstancedMesh>(null);const backs=useRef<THREE.InstancedMesh>(null);const seats=useMemo(()=>sectorSeats(sector),[sector]);
 useEffect(()=>{if(!ref.current||!backs.current)return;const o=new THREE.Object3D();seats.forEach((s,i)=>{o.position.set(...s.position);o.updateMatrix();ref.current!.setMatrixAt(i,o.matrix);o.position.y+=.46;o.position.z+=.35;o.updateMatrix();backs.current!.setMatrixAt(i,o.matrix);const color=new THREE.Color(selected?.id===s.id?'#ffd268':s.available?'#68a8ff':'#88929c');ref.current!.setColorAt(i,color);backs.current!.setColorAt(i,color);});for(const mesh of [ref.current,backs.current]){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}},[seats,selected]);
 return <group><instancedMesh ref={ref} args={[undefined,undefined,seats.length]} onClick={e=>{if(!interactive)return;e.stopPropagation();if(e.instanceId!==undefined&&seats[e.instanceId].available)onSeat(seats[e.instanceId]);}} onPointerOver={e=>{if(!interactive)return;e.stopPropagation();document.body.style.cursor='pointer';}} onPointerOut={()=>document.body.style.cursor='auto'}><boxGeometry args={[1.1,layout.seatThickness,.9]}/><meshStandardMaterial roughness={.5}/></instancedMesh><instancedMesh ref={backs} args={[undefined,undefined,seats.length]}><boxGeometry args={[1.1,.72,.15]}/><meshStandardMaterial roughness={.5}/></instancedMesh></group>
}
function Camera({view,seat,sector,reset,onReady}:{view:View;seat:Seat|null;sector:SectorId|null;reset:number;onReady:()=>void}){
 const controls=useRef<OrbitControlsType>(null);const {camera,gl}=useThree();
 const flight=useRef(true);const elapsed=useRef(0);const from=useRef<Point>([0,0,0]);const fromTarget=useRef<Point>([0,0,0]);const to=useRef<Point>([0,0,0]);const target=useRef<Point>([0,0,0]);const angles=useRef({yaw:0,pitch:0});
 useEffect(()=>{from.current=camera.position.toArray() as Point;const direction=camera.getWorldDirection(new THREE.Vector3());fromTarget.current=camera.position.clone().add(direction.multiplyScalar(50)).toArray() as Point;elapsed.current=0;flight.current=true;
 if(view==='seat'&&seat){to.current=eyePosition(seat);target.current=[0,1,0];}else if(view==='sector'){const x=sectors.find(s=>s.id===sector)?.center||0;to.current=[x,48,96];target.current=[x,6,49];}else{to.current=[148,138,168];target.current=[0,0,0];}
 if(controls.current)controls.current.enabled=false;
 },[view,seat,sector,reset,camera]);
 useEffect(()=>{const canvas=gl.domElement;let pointer:number|null=null;let last=[0,0];
 const down=(e:PointerEvent)=>{if(view!=='seat'||flight.current)return;pointer=e.pointerId;last=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId)};
 const move=(e:PointerEvent)=>{if(pointer!==e.pointerId||view!=='seat'||flight.current)return;angles.current.yaw-=(e.clientX-last[0])*.004;angles.current.pitch=Math.max(-.75,Math.min(.65,angles.current.pitch+(e.clientY-last[1])*.004));last=[e.clientX,e.clientY];camera.lookAt(...lookTarget(camera.position.toArray() as Point,angles.current.yaw,angles.current.pitch))};
 const up=()=>{pointer=null};canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
 return()=>{canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up)};
 },[view,camera,gl]);
 useFrame((_,delta)=>{if(!flight.current||!controls.current)return;elapsed.current+=delta;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;camera.position.set(...flightPoint(from.current,to.current,elapsed.current,reduced));const look=flightPoint(fromTarget.current,target.current,elapsed.current,reduced);camera.lookAt(...look);
 if(reduced||elapsed.current>=2.4){flight.current=false;const d=new THREE.Vector3(...target.current).sub(camera.position);angles.current={yaw:Math.atan2(d.x,d.z),pitch:Math.atan2(d.y,Math.hypot(d.x,d.z))};controls.current.target.set(...target.current);controls.current.enabled=view!=='seat';onReady();}});
 return <OrbitControls ref={controls} makeDefault enableDamping enablePan={false} minDistance={45} maxDistance={330} minPolarAngle={.15} maxPolarAngle={Math.PI*.47} enableZoom={view!=='seat'} rotateSpeed={.5}/>;
}
function Scene(p:Props){const [hover,setHover]=useState<SectorId|null>(null);const trees=useMemo(()=>Array.from({length:65},(_,i)=>{const a=i*2.399;const r=133+(i%5)*8;return [Math.cos(a)*r,Math.sin(a)*r] as const}),[]);
return <><color attach="background" args={['#eef1f3']}/><fog attach="fog" args={['#eef1f3',260,640]}/><ambientLight intensity={1.4}/><hemisphereLight args={['#e9f3ff','#8e9c8b',1.4]}/><directionalLight position={[-90,140,40]} intensity={2.5} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-180} shadow-camera-right={180} shadow-camera-top={180} shadow-camera-bottom={-180} shadow-camera-far={500} shadow-bias={-.001}/><mesh rotation-x={-Math.PI/2} position-y={-1.5} receiveShadow><planeGeometry args={[1800,1800]}/><meshStandardMaterial color="#e0e5df"/></mesh><Box position={[0,-1,0]} size={[224,.8,187]} color="#c8d1ce"/><Box position={[0,-.5,0]} size={[204,.5,165]} color="#dfe3e2"/>
{trees.map(([x,z],i)=><group key={i} position={[x,0,z]}><mesh position-y={2}><cylinderGeometry args={[.5,.7,4,5]}/><meshStandardMaterial color="#8b8e7a"/></mesh><mesh position-y={5+i%3} castShadow><icosahedronGeometry args={[3+i%3,1]}/><meshStandardMaterial color={i%2?'#8eaa91':'#a4b5a0'}/></mesh></group>)}
<Pitch/>{[0,1,2,3].map(i=><Tier key={i} side={i}/>)}
{[0,1,2,3].map(side=><group key={side}>{Array.from({length:side<2?9:7},(_,i)=>{const a=(i-(side<2?4:3))*15;const pos:[number,number,number]=side<2?[a,16,(side===0?1:-1)*79]:[(side===2?1:-1)*97,16,a];return <group key={i}><Box position={pos} size={[.7,33,.7]} color="#e7e9ea"/>{((p.roof&&p.view==='overview')||side===1||side===3)&&<Box position={[pos[0],32,pos[2]]} size={side<2?[1.1,.8,38]:[38,.8,1.1]} color="#f6f7f8"/>}</group>})}{((p.roof&&p.view==='overview')||side===1||side===3)&&<Box position={side<2?[0,32,(side===0?1:-1)*66]:[(side===2?1:-1)*84,32,0]} size={side<2?[128,.7,32]:[32,.7,104]} color="#f8fafc"/>}</group>)}
{sectors.map(s=><group key={s.id}><mesh visible={p.view==='overview'} position={[s.center,6.3,50]} rotation-x={-.57} raycast={p.view==='overview'?undefined:()=>null} onClick={e=>{e.stopPropagation();p.onSector(s.id);}} onPointerOver={e=>{e.stopPropagation();setHover(s.id);document.body.style.cursor='pointer';}} onPointerOut={()=>{setHover(null);document.body.style.cursor='auto';}}><boxGeometry args={[33,.35,24]}/><meshStandardMaterial color={p.sector===s.id?'#3181f7':hover===s.id?'#7db5ff':'#2f72d4'} transparent opacity={p.sector===s.id?.8:hover===s.id?.6:.15} depthWrite={false}/></mesh>{p.view!=='seat'&&<Html position={[s.center,19,64]} center distanceFactor={170} zIndexRange={[5,0]}><button className={`sector-label ${p.sector===s.id?'active':''}`} onClick={()=>p.onSector(s.id)}>{s.id}<span> ↗</span></button></Html>}</group>)}{sectors.map(s=><DemoSeats key={s.id} sector={s.id} selected={p.seat} onSeat={p.onSeat} interactive={p.view==='sector'&&p.sector===s.id}/>)}
<Camera {...p}/></>}
function Unavailable({notify}:{notify:()=>void}){
 useEffect(()=>notify(),[notify]);
 return <div className="webgl-error" role="alert">Nie udało się uruchomić sceny 3D.<br/>Włącz WebGL w przeglądarce i odśwież stronę.<br/>Podgląd widoku z miejsca jest niedostępny.</div>;
}
class Boundary extends Component<{children:ReactNode;notify:()=>void},{error:boolean}>{
 state={error:false};
 static getDerivedStateFromError(){return {error:true}}
 render(){return this.state.error?<Unavailable notify={this.props.notify}/>:this.props.children}
}
export default function Stadium(props:Props){return <Boundary notify={props.onUnavailable}><Canvas fallback={<Unavailable notify={props.onUnavailable}/>} shadows dpr={[1,1.7]} camera={{position:[148,138,168],fov:43,near:.1,far:1200}} gl={{antialias:true}}><Scene {...props}/></Canvas></Boundary>}
