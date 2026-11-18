import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Line, Html } from '@react-three/drei';
import { useMemo, useRef, useEffect, useLayoutEffect, useState, Component, type ReactNode } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { layout, sectors, allSectors, sectorSeats, sectorFrame, type SectorId, type Seat } from '../data/stadium';
import {columnPositions,showStructure} from './structure';
import {aimRotation,rotateFlight} from './cameraRotation';
import {watchContextLoss} from './contextLoss';
import { pauseOrbit } from './cameraControls';
import { sectorRaycast } from './interaction';
import {seatColor} from './seatFeedback';
import {captureSeatPreview} from './seatPreview';
import { eyePosition, flightPoint, flightProgress, lookTarget, overviewPosition, overviewScale, type Point } from '../domain/camera';
import type { View } from '../domain/selection';
export type { View } from '../domain/selection';
type Props = {sector: SectorId | null; seat:Seat|null; row:number; view:View; roof:boolean; flying:boolean; onSector:(id:SectorId)=>void; onSeat:(seat:Seat)=>void; reset:number; onReady:()=>void; onUnavailable:()=>void;onPreview:(image:string|null)=>void};
function Box({position,size,color,rotation=0,tiltX=0,tiltZ=0}: {position:[number,number,number];size:[number,number,number];color:string;rotation?:number;tiltX?:number;tiltZ?:number}){return <mesh position={position} rotation={[tiltX,rotation,tiltZ]} receiveShadow castShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.8}/></mesh>}
function Canopy({side}:{side:number}){
 const sign=side===0||side===2?1:-1;
 const northSouth=side<2;
 const segments=northSouth?12:10;
 return <group>{Array.from({length:segments},(_,i)=>{
 const along=(i-(segments-1)/2)*(northSouth?10.5:10);
 return <group key={i}><Box position={northSouth?[along,32,sign*66]:[sign*84,32,along]} size={northSouth?[10.3,.3,32]:[32,.3,9.8]} color="#f8fafc" tiltX={northSouth?-sign*.07:0} tiltZ={northSouth?0:sign*.07}/><Box position={northSouth?[along-5.1,31.7,sign*66]:[sign*84,31.7,along-4.9]} size={northSouth?[.16,.4,32]:[32,.4,.16]} color="#c4cfdb" tiltX={northSouth?-sign*.07:0} tiltZ={northSouth?0:sign*.07}/></group>;
 })}</group>;
}
function Pitch(){
 const markings=useMemo(()=>{
 const rect=(a:number,b:number,x=0,z=0):[number,number,number][]=>[[-a/2+x,.15,-b/2+z],[a/2+x,.15,-b/2+z],[a/2+x,.15,b/2+z],[-a/2+x,.15,b/2+z],[-a/2+x,.15,-b/2+z]];
 return [rect(105,68),[[0,.15,-34],[0,.15,34]] as [number,number,number][],...[-1,1].flatMap(s=>[rect(16.5,40.32,s*44.25),rect(5.5,18.32,s*49.75)]),Array.from({length:65},(_,i)=>[Math.cos(i/64*Math.PI*2)*9.15,.15,Math.sin(i/64*Math.PI*2)*9.15] as [number,number,number])];},[]);
 return <group><Box position={[0,-.4,0]} size={[119,.7,82]} color="#417a55"/>{Array.from({length:14},(_,i)=><Box key={i} position={[-48.75+i*7.5,0,0]} size={[7.5,.12,68]} color={i%2?'#72a16a':'#7caa73'}/>)}{markings.map((p,i)=><Line key={i} points={p} color="#edf4dd" lineWidth={1.2}/>)}{[-1,1].map(s=><group key={s}><Line points={[[s*52.5,.2,-3.66],[s*52.5,2.44,-3.66],[s*52.5,2.44,3.66],[s*52.5,.2,3.66]]} color="white" lineWidth={3}/><Box position={[s*54,1.2,0]} size={[.12,2.4,7.32]} color="#c2d2c5"/></group>)}</group>
}
function Tier({side}:{side:number}){
 return <group>{Array.from({length:27},(_,r)=><Box key={r} position={side<2?[0,layout.firstStepY+r*layout.rowRise,(side===0?1:-1)*(43+r*layout.rowDepth)]:[(side===2?1:-1)*(61+r*layout.rowDepth),layout.firstStepY+r*layout.rowRise,0]} size={side<2?[118,layout.stepHeight,layout.rowDepth]:[layout.rowDepth,layout.stepHeight,82]} color={r%8===0?'#d5dbe1':'#aab4c1'}/>)}</group>
}
function DemoSeats({sector,onSeat,selected,interactive,row,focusRow}:{sector:SectorId;onSeat:(seat:Seat)=>void;selected:Seat|null;interactive:boolean;row:number;focusRow:boolean}){
 const ref=useRef<THREE.InstancedMesh>(null);const backs=useRef<THREE.InstancedMesh>(null);const seats=useMemo(()=>sectorSeats(sector),[sector]);
 const [hovered,setHovered]=useState<Seat|null>(null);
 const hover=interactive?hovered:null;
 const rowStart=seats.find(s=>s.row===row);
 useEffect(()=>{if(!interactive)setHovered(null);return()=>{document.body.style.cursor='auto';};},[interactive]);
 useEffect(()=>{if(!ref.current||!backs.current)return;const o=new THREE.Object3D();seats.forEach((s,i)=>{
 const side=s.side??0;const width=s.side===undefined?1.1:.88;
 o.rotation.set(0,side<2?0:Math.PI/2,0);o.scale.set(width,1,1);o.position.set(...s.position);o.updateMatrix();ref.current!.setMatrixAt(i,o.matrix);
 o.position.y+=.46;if(side<2)o.position.z+=(side===0?1:-1)*.35;else o.position.x+=(side===2?1:-1)*.35;
 o.updateMatrix();backs.current!.setMatrixAt(i,o.matrix);
 const color=new THREE.Color(seatColor(s,selected?.id??null,hover?.id??null,focusRow?row:null));ref.current!.setColorAt(i,color);backs.current!.setColorAt(i,color);
 });for(const mesh of [ref.current,backs.current]){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}},[seats,selected,hover,focusRow,row]);
 return <group onClick={e=>{if(!interactive)return;e.stopPropagation();if(e.instanceId!==undefined)onSeat(seats[e.instanceId]);}} onPointerMove={e=>{if(!interactive)return;e.stopPropagation();const seat=e.instanceId===undefined?null:seats[e.instanceId];setHovered(seat);document.body.style.cursor=seat?'pointer':'auto';}} onPointerOut={()=>{setHovered(null);document.body.style.cursor='auto';}}><instancedMesh ref={ref} args={[undefined,undefined,seats.length]}><boxGeometry args={[1,layout.seatThickness,.9]}/><meshStandardMaterial roughness={.5}/></instancedMesh><instancedMesh ref={backs} args={[undefined,undefined,seats.length]}><boxGeometry args={[1,.72,.15]}/><meshStandardMaterial roughness={.5}/></instancedMesh>{focusRow&&rowStart&&<Html position={[rowStart.position[0],rowStart.position[1]+1.5,rowStart.position[2]]} center style={{pointerEvents:'none'}} zIndexRange={[6,0]}><span className="row-marker">RZĄD {row}</span></Html>}{hover&&<Html position={[hover.position[0],hover.position[1]+2.5,hover.position[2]]} center style={{pointerEvents:'none'}} zIndexRange={[7,0]}><div className="seat-tooltip"><strong>Sektor {hover.sectorId} · Rząd {hover.row}</strong><span>Miejsce {hover.number}<b>{hover.available?`${hover.price} zł`:'Zajęte'}</b></span><small>{hover.available?'Kliknij, aby zobaczyć perspektywę':'Zajęte · perspektywę możesz obejrzeć'}</small></div></Html>}</group>
}
function Camera({view,seat,sector,reset,onReady,onPreview}:{view:View;seat:Seat|null;sector:SectorId|null;reset:number;onReady:()=>void;onPreview:(image:string|null)=>void}){
 const controls=useRef<OrbitControlsType>(null);const {camera,gl,size,scene}=useThree();
 const aspect=size.width/Math.max(1,size.height);
 const framingAspect=view==='overview'?aspect:1.5;
 const flight=useRef(true);const elapsed=useRef(0);const from=useRef<Point>([0,0,0]);const fromRotation=useRef(new THREE.Quaternion());const toRotation=useRef(new THREE.Quaternion());const to=useRef<Point>([0,0,0]);const target=useRef<Point>([0,0,0]);const angles=useRef({yaw:0,pitch:0});
 // Publish the new target before RAF can combine a new seat with the previous flight's clock.
 useLayoutEffect(()=>{from.current=camera.position.toArray() as Point;fromRotation.current.copy(camera.quaternion);elapsed.current=0;flight.current=true;
 if(view==='seat'&&seat){to.current=eyePosition(seat);target.current=[0,1,0];}else if(view==='sector'){const frame=sectorFrame(sector??'');to.current=frame.position;target.current=frame.target;}else{to.current=overviewPosition(framingAspect);target.current=[0,0,0];}
 toRotation.current.copy(aimRotation(to.current,target.current,camera.up));
 if(controls.current)pauseOrbit(controls.current,camera);
 },[view,seat,sector,reset,camera,framingAspect]);
 useEffect(()=>{const canvas=gl.domElement;let pointer:number|null=null;let last=[0,0];
 const down=(e:PointerEvent)=>{if(view!=='seat'||flight.current)return;pointer=e.pointerId;last=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId)};
 const move=(e:PointerEvent)=>{if(pointer!==e.pointerId||view!=='seat'||flight.current)return;angles.current.yaw-=(e.clientX-last[0])*.004;angles.current.pitch=Math.max(-.75,Math.min(.65,angles.current.pitch+(e.clientY-last[1])*.004));last=[e.clientX,e.clientY];camera.lookAt(...lookTarget(camera.position.toArray() as Point,angles.current.yaw,angles.current.pitch))};
 const up=()=>{pointer=null};canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
 return()=>{canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up)};
 },[view,camera,gl]);
 useFrame((_,delta)=>{if(!flight.current||!controls.current)return;elapsed.current+=delta;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;camera.position.set(...flightPoint(from.current,to.current,elapsed.current,reduced));rotateFlight(fromRotation.current,toRotation.current,flightProgress(elapsed.current,reduced),camera.quaternion);
 if(reduced||elapsed.current>=2.4){flight.current=false;const d=new THREE.Vector3(...target.current).sub(camera.position);angles.current={yaw:Math.atan2(d.x,d.z),pitch:Math.atan2(d.y,Math.hypot(d.x,d.z))};controls.current.target.set(...target.current);controls.current.enabled=view!=='seat';if(view==='seat'&&seat)onPreview(captureSeatPreview(()=>gl.render(scene,camera),gl.domElement));onReady();}});
 return <OrbitControls ref={controls} makeDefault enableDamping enablePan={false} minDistance={45} maxDistance={330*overviewScale(aspect)} minPolarAngle={.15} maxPolarAngle={Math.PI*.47} enableZoom={view!=='seat'} rotateSpeed={.5}/>;
}
function Scene(p:Props){const {gl}=useThree();
useEffect(()=>watchContextLoss(gl.domElement,p.onUnavailable),[gl,p.onUnavailable]);
const [hover,setHover]=useState<SectorId|null>(null);const trees=useMemo(()=>Array.from({length:65},(_,i)=>{const a=i*2.399;const r=133+(i%5)*8;return [Math.cos(a)*r,Math.sin(a)*r] as const}),[]);
return <><color attach="background" args={['#eef1f3']}/><fog attach="fog" args={['#eef1f3',260,640]}/><ambientLight intensity={1.4}/><hemisphereLight args={['#e9f3ff','#8e9c8b',1.4]}/><directionalLight position={[-90,140,40]} intensity={2.5} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-180} shadow-camera-right={180} shadow-camera-top={180} shadow-camera-bottom={-180} shadow-camera-far={500} shadow-bias={-.001}/><mesh rotation-x={-Math.PI/2} position-y={-1.5} receiveShadow><planeGeometry args={[1800,1800]}/><meshStandardMaterial color="#e0e5df"/></mesh><Box position={[0,-1,0]} size={[224,.8,187]} color="#c8d1ce"/><Box position={[0,-.5,0]} size={[204,.5,165]} color="#dfe3e2"/>
{trees.map(([x,z],i)=><group key={i} position={[x,0,z]}><mesh position-y={2}><cylinderGeometry args={[.5,.7,4,5]}/><meshStandardMaterial color="#8b8e7a"/></mesh><mesh position-y={5+i%3} castShadow><icosahedronGeometry args={[3+i%3,1]}/><meshStandardMaterial color={i%2?'#8eaa91':'#a4b5a0'}/></mesh></group>)}
<Pitch/>{[0,1,2,3].map(i=><Tier key={i} side={i}/>)}
{[0,1,2,3].map(side=><group key={side}>{columnPositions(side,p.view,p.flying).map((pos,i)=>{return <group key={i}><Box position={pos} size={[.7,33,.7]} color="#e7e9ea"/>{(showStructure(p.view,p.flying)&&(p.roof||side===1||side===3))&&<Box position={[pos[0],32,pos[2]]} size={side<2?[1.1,.8,38]:[38,.8,1.1]} color="#f6f7f8"/>}</group>})}{(showStructure(p.view,p.flying)&&(p.roof||side===1||side===3))&&<Canopy side={side}/>}</group>)}
{sectors.map(s=><group key={s.id}><mesh visible={p.view==='overview'} position={[s.center,6.3,50]} rotation-x={-.57} raycast={sectorRaycast(p.view)} onClick={e=>{e.stopPropagation();p.onSector(s.id);}} onPointerOver={e=>{e.stopPropagation();setHover(s.id);document.body.style.cursor='pointer';}} onPointerOut={()=>{setHover(null);document.body.style.cursor='auto';}}><boxGeometry args={[33,.35,24]}/><meshStandardMaterial color={p.sector===s.id?'#3181f7':hover===s.id?'#7db5ff':'#2f72d4'} transparent opacity={p.sector===s.id?.8:hover===s.id?.6:.15} depthWrite={false}/></mesh>{p.view==='overview'&&<Html position={[s.center,19,64]} center distanceFactor={170} zIndexRange={[5,0]}><button className={`sector-label ${p.sector===s.id?'active':''}`} onClick={()=>p.onSector(s.id)}>{s.id}<span> ↗</span></button></Html>}</group>)}{allSectors.filter(s=>!sectors.some(original=>original.id===s.id)).map(s=>p.view==='overview'&&<Html key={s.id} position={sectorFrame(s.id).target.map((v,i)=>v+(i===1?8:0)) as Point} center distanceFactor={170} zIndexRange={[5,0]}><button className="sector-label" onClick={()=>p.onSector(s.id)}>{s.id}<span> ↗</span></button></Html>)}{allSectors.map(s=><DemoSeats key={s.id} sector={s.id} selected={p.seat} row={p.row} onSeat={p.onSeat} interactive={p.view!=='seat'} focusRow={p.view==='sector'&&p.sector===s.id}/>)}
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
export default function Stadium(props:Props){return <Boundary notify={props.onUnavailable}><Canvas fallback={<p>Sektor, rząd i miejsce możesz wybrać w panelu obok.</p>} shadows dpr={[1,1.7]} camera={{position:[148,138,168],fov:43,near:.1,far:1200}} gl={{antialias:true}}><Scene {...props}/></Canvas></Boundary>}
