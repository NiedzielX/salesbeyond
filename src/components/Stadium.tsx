import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Line, Html } from '@react-three/drei';
import { useMemo, useRef, useEffect, useLayoutEffect, useState, Component, type ReactNode } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { layout, allSectors, sectorSeats, sectorFrame, type SectorId, type Seat } from '../data/stadium';
import {roofCutawayNormal,showRoof} from './structure';
import {createEneaModel} from '../integrations/eneaModel';
import {createBeyondAdvertising} from '../integrations/beyondAdvertising';
import {eneaLayout} from '../data/eneaLayout';
import {aimRotation,rotateFlight} from './cameraRotation';
import {watchContextLoss} from './contextLoss';
import { pauseOrbit } from './cameraControls';
import {installSeatPicking} from '../integrations/seatPicking';
import {writeSeatTransforms,createSeatColors} from '../integrations/seatInstances';
import {captureSeatPreview} from './seatPreview';
import Crowd from './Crowd';
import { eyePosition, flightDuration, flightPoint, flightProgress, lookTarget, overviewPosition, overviewScale, seatTransferControl, type Point } from '../domain/camera';
import type { View } from '../domain/selection';
export type { View } from '../domain/selection';
type Props = {sector: SectorId | null; seat:Seat|null; row:number;rowFocused?:boolean; chosenIds:readonly string[]; inventory?:ReadonlyMap<string,Seat>; view:View; roof:boolean; crowd:boolean; flying:boolean; onSector:(id:SectorId,row?:number)=>void; onSeat:(seat:Seat)=>void; reset:number; onReady:()=>void; onUnavailable:()=>void;onPreview:(image:string|null)=>void};
function Box({position,size,color,rotation=0,tiltX=0,tiltZ=0}: {position:[number,number,number];size:[number,number,number];color:string;rotation?:number;tiltX?:number;tiltZ?:number}){return <mesh position={position} rotation={[tiltX,rotation,tiltZ]} receiveShadow castShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.8}/></mesh>}
function Architecture({roof,view,side}:{roof:boolean;view:View;side:number}){
 const parts=useMemo(()=>[...createEneaModel(),...createBeyondAdvertising()],[]);
 const planes=useMemo(()=>{const normal=roofCutawayNormal(view,side);return normal?[new THREE.Plane(new THREE.Vector3(...normal),0)]:[];},[view,side]);
 return <group>{parts.filter(p=>p.layer==='bowl'||roof).map(p=><mesh key={p.name} geometry={p.geometry} receiveShadow castShadow><meshStandardMaterial color={p.color} roughness={p.layer==='frame'?.55:.85} side={THREE.DoubleSide} clippingPlanes={p.layer==='bowl'?undefined:planes} clipShadows/></mesh>)}</group>;
}
function Pitch(){
 const markings=useMemo(()=>{
 const rect=(a:number,b:number,x=0,z=0):[number,number,number][]=>[[-a/2+x,.15,-b/2+z],[a/2+x,.15,-b/2+z],[a/2+x,.15,b/2+z],[-a/2+x,.15,b/2+z],[-a/2+x,.15,-b/2+z]];
 return [rect(105,68),[[0,.15,-34],[0,.15,34]] as [number,number,number][],...[-1,1].flatMap(s=>[rect(16.5,40.32,s*44.25),rect(5.5,18.32,s*49.75)]),Array.from({length:65},(_,i)=>[Math.cos(i/64*Math.PI*2)*9.15,.15,Math.sin(i/64*Math.PI*2)*9.15] as [number,number,number])];},[]);
 return <group><Box position={[0,-.4,0]} size={[119,.7,82]} color="#417a55"/>{Array.from({length:14},(_,i)=><Box key={i} position={[-48.75+i*7.5,0,0]} size={[7.5,.12,68]} color={i%2?'#72a16a':'#7caa73'}/>)}{markings.map((p,i)=><Line key={i} points={p} color="#edf4dd" lineWidth={1.2}/>)}{[-1,1].map(s=><group key={s}><Line points={[[s*52.5,.2,-3.66],[s*52.5,2.44,-3.66],[s*52.5,2.44,3.66],[s*52.5,.2,3.66]]} color="white" lineWidth={3}/></group>)}</group>
}
function DemoSeats({sector,onSeat,selected,interactive,row,focusRow,overview,onSector,emphasized,chosen,inventory}:{sector:SectorId;onSeat:(seat:Seat)=>void;selected:Seat|null;interactive:boolean;row:number;focusRow:boolean;overview:boolean;onSector:(id:SectorId,row?:number)=>void;emphasized:boolean;chosen:ReadonlySet<string>;inventory?:ReadonlyMap<string,Seat>}){
 const ref=useRef<THREE.InstancedMesh>(null);const backs=useRef<THREE.InstancedMesh>(null);const seats=useMemo(()=>sectorSeats(sector),[sector]);
 const [hovered,setHovered]=useState<Seat|null>(null);
 const hover=interactive?hovered:null;
 const rowStart=seats.find(s=>s.row===row);
 useEffect(()=>{if(!interactive)setHovered(null);return()=>{document.body.style.cursor='auto';};},[interactive]);
 const colors=useRef<ReturnType<typeof createSeatColors>|null>(null);
 useLayoutEffect(()=>{
 if(!ref.current||!backs.current)return;
 writeSeatTransforms(seats,ref.current,backs.current);colors.current=createSeatColors(seats,ref.current,backs.current);
 const picking=[installSeatPicking(ref.current),installSeatPicking(backs.current)];
 return()=>{picking.forEach(index=>index.dispose());colors.current=null;};
 },[seats]);
 useLayoutEffect(()=>{colors.current?.update({selectedId:selected?.id??null,hoveredId:hover?.id??null,row:focusRow?row:null,emphasized,chosen,inventory});},[seats,selected?.id,hover?.id,focusRow,row,emphasized,chosen,inventory]);
 const liveHover=hover&&inventory?.get(hover.id),hoverInfo=hover&&liveHover?{...hover,price:liveHover.price,available:liveHover.available}:hover;
 return <group onClick={e=>{if(!interactive)return;e.stopPropagation();if(e.instanceId!==undefined){const seat=seats[e.instanceId];if(overview)onSector(seat.sectorId,seat.row);else{const live=inventory?.get(seat.id);onSeat(live?{...seat,price:live.price,available:live.available}:seat);}}}} onPointerMove={e=>{if(!interactive)return;e.stopPropagation();const seat=e.instanceId===undefined?null:seats[e.instanceId];setHovered(seat);document.body.style.cursor=seat?'pointer':'auto';}} onPointerOut={()=>{setHovered(null);document.body.style.cursor='auto';}}><instancedMesh ref={ref} args={[undefined,undefined,seats.length]}><boxGeometry args={[1,layout.seatThickness,eneaLayout.seatDepth]}/><meshStandardMaterial roughness={.5}/></instancedMesh><instancedMesh ref={backs} args={[undefined,undefined,seats.length]}><boxGeometry args={[1,.56,.09]}/><meshStandardMaterial roughness={.5}/></instancedMesh>{focusRow&&rowStart&&<Html position={[rowStart.position[0],rowStart.position[1]+1.5,rowStart.position[2]]} center style={{pointerEvents:'none'}} zIndexRange={[6,0]}><span className="row-marker">RZĄD {row}</span></Html>}{hoverInfo&&<Html position={[hoverInfo.position[0],hoverInfo.position[1]+2.5,hoverInfo.position[2]]} center style={{pointerEvents:'none'}} zIndexRange={[7,0]}><div className="seat-tooltip"><strong>Sektor {hoverInfo.sectorId} · Rząd {hoverInfo.row}</strong><span>Miejsce {hoverInfo.number}<b>{hoverInfo.available?`${hoverInfo.price} zł`:'Zajęte'}</b></span><small>{hoverInfo.available?'Kliknij, aby zobaczyć perspektywę':'Zajęte · perspektywę możesz obejrzeć'}</small></div></Html>}</group>
}
function Camera({view,seat,sector,reset,crowd,flying,onReady,onPreview}:{view:View;seat:Seat|null;sector:SectorId|null;reset:number;crowd:boolean;flying:boolean;onReady:()=>void;onPreview:(image:string|null)=>void}){
 const controls=useRef<OrbitControlsType>(null);const lastNavigation=useRef<{key:string;view:View}|null>(null);const manualCamera=useRef(false);const {camera,gl,size,scene}=useThree();
 const aspect=size.width/Math.max(1,size.height);
 const framingAspect=view==='seat'?1.5:aspect;
 const flight=useRef(true);const elapsed=useRef(0);const from=useRef<Point>([0,0,0]);const fromRotation=useRef(new THREE.Quaternion());const toRotation=useRef(new THREE.Quaternion());const to=useRef<Point>([0,0,0]);const target=useRef<Point>([0,0,0]);const angles=useRef({yaw:0,pitch:0});
 const flightControl=useRef<Point|undefined>(undefined);
 // Publish the new target before RAF can combine a new seat with the previous flight's clock.
 useLayoutEffect(()=>{const navigation=`${view}:${seat?.id??''}:${sector??''}:${reset}`;const previous=lastNavigation.current;if(previous?.key===navigation&&manualCamera.current)return;if(previous?.key!==navigation)manualCamera.current=false;from.current=camera.position.toArray() as Point;fromRotation.current.copy(camera.quaternion);elapsed.current=0;flight.current=true;
 if(view==='seat'&&seat){to.current=eyePosition(seat);target.current=[0,1,0];}else if(view==='sector'){const frame=sectorFrame(sector??'',framingAspect);to.current=frame.position;target.current=frame.target;}else{to.current=overviewPosition(framingAspect);target.current=[0,0,0];}
 flightControl.current=previous?.view==='seat'&&view==='seat'&&seat?seatTransferControl(from.current,to.current):undefined;
 toRotation.current.copy(aimRotation(to.current,target.current,camera.up));
 if(controls.current)pauseOrbit(controls.current,camera);
 // Initial layout and responsive sizing settle directly; only an explicit navigation flies.
 if(previous===null||previous.key===navigation){
 camera.position.set(...to.current);camera.quaternion.copy(toRotation.current);flight.current=false;
 const direction=new THREE.Vector3(...target.current).sub(camera.position);angles.current={yaw:Math.atan2(direction.x,direction.z),pitch:Math.atan2(direction.y,Math.hypot(direction.x,direction.z))};
 if(controls.current){controls.current.target.set(...target.current);controls.current.enabled=view!=='seat';}
 onReady();
 }
 lastNavigation.current={key:navigation,view};
 },[view,seat?.id,sector,reset,camera,framingAspect]);
 // Capture only after the parent arrival and crowd mask have committed. A mode
 // toggle updates the thumbnail without starting another camera navigation.
 useLayoutEffect(()=>{
  if(view==='seat'&&seat&&!flying&&!flight.current)onPreview(captureSeatPreview(()=>gl.render(scene,camera),gl.domElement));
 },[view,seat?.id,flying,crowd,aspect,camera,gl,scene]);
 useEffect(()=>{const canvas=gl.domElement;let pointer:number|null=null;let last=[0,0];
 const down=(e:PointerEvent)=>{if(view!=='seat'||flight.current)return;pointer=e.pointerId;last=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId)};
 const move=(e:PointerEvent)=>{if(pointer!==e.pointerId||view!=='seat'||flight.current)return;angles.current.yaw-=(e.clientX-last[0])*.004;angles.current.pitch=Math.max(-.75,Math.min(.65,angles.current.pitch+(e.clientY-last[1])*.004));last=[e.clientX,e.clientY];camera.lookAt(...lookTarget(camera.position.toArray() as Point,angles.current.yaw,angles.current.pitch))};
 const up=()=>{pointer=null};canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
 return()=>{canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up)};
 },[view,camera,gl]);
 useFrame((_,delta)=>{if(!flight.current||!controls.current)return;elapsed.current+=delta;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;camera.position.set(...flightPoint(from.current,to.current,elapsed.current,reduced,flightControl.current));rotateFlight(fromRotation.current,toRotation.current,flightProgress(elapsed.current,reduced),camera.quaternion);
 if(reduced||elapsed.current>=flightDuration){flight.current=false;const d=new THREE.Vector3(...target.current).sub(camera.position);angles.current={yaw:Math.atan2(d.x,d.z),pitch:Math.atan2(d.y,Math.hypot(d.x,d.z))};controls.current.target.set(...target.current);controls.current.enabled=view!=='seat';onReady();}});
 return <OrbitControls ref={controls} onStart={()=>{manualCamera.current=true;}} makeDefault enableDamping enablePan={false} minDistance={45} maxDistance={330*overviewScale(aspect)} minPolarAngle={.15} maxPolarAngle={Math.PI*.47} enableZoom={view!=='seat'} rotateSpeed={.5}/>;
}
function Scene(p:Props){const {gl}=useThree();
useEffect(()=>watchContextLoss(gl.domElement,p.onUnavailable),[gl,p.onUnavailable]);
const chosen=useMemo(()=>new Set(p.chosenIds),[p.chosenIds]);
const [hover,setHover]=useState<SectorId|null>(null);const trees=useMemo(()=>Array.from({length:65},(_,i)=>{const a=i*2.399;const r=181+(i%5)*8;return [Math.cos(a)*r,Math.sin(a)*r] as const}),[]);
return <><color attach="background" args={['#eef1f3']}/><fog attach="fog" args={['#eef1f3',260,640]}/><ambientLight intensity={.65}/><hemisphereLight args={['#e9f3ff','#8e9c8b',1.1]}/><directionalLight position={[-90,140,40]} intensity={2.5} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-180} shadow-camera-right={180} shadow-camera-top={180} shadow-camera-bottom={-180} shadow-camera-far={500} shadow-bias={-.001}/><mesh rotation-x={-Math.PI/2} position-y={-1.5} receiveShadow><planeGeometry args={[1800,1800]}/><meshStandardMaterial color="#e0e5df"/></mesh><Box position={[0,-1,0]} size={[270,.8,236]} color="#c8d1ce"/><Box position={[0,-.5,0]} size={[258,.5,224]} color="#dfe3e2"/>
{trees.map(([x,z],i)=><group key={i} position={[x,0,z]}><mesh position-y={2}><cylinderGeometry args={[.5,.7,4,5]}/><meshStandardMaterial color="#8b8e7a"/></mesh><mesh position-y={5+i%3} castShadow><icosahedronGeometry args={[3+i%3,1]}/><meshStandardMaterial color={i%2?'#8eaa91':'#a4b5a0'}/></mesh></group>)}
<Pitch/><Architecture view={p.view} side={allSectors.find(s=>s.id===p.sector)?.side??-1} roof={showRoof(p.roof,p.flying)}/>
{allSectors.map(s=><group key={s.id} onPointerOver={()=>{if(p.view==='overview')setHover(s.id)}} onPointerOut={()=>setHover(null)}>
{p.view==='overview'&&<Html position={sectorFrame(s.id).target.map((v,i)=>v+(i===1?6:0)) as Point} center distanceFactor={180} zIndexRange={[5,0]}><button className={`sector-label ${hover===s.id?'active':''}`} onMouseEnter={()=>setHover(s.id)} onMouseLeave={()=>setHover(null)} onClick={()=>p.onSector(s.id)}>{s.id}<span> ↗</span></button></Html>}
<DemoSeats chosen={chosen} inventory={p.inventory} sector={s.id} selected={p.seat} row={p.row} onSeat={p.onSeat} onSector={p.onSector} overview={p.view==='overview'} emphasized={p.view==='overview'&&hover===s.id} interactive={p.view!=='seat'} focusRow={p.view==='sector'&&!!p.rowFocused&&p.sector===s.id}/></group>)}
<Crowd enabled={p.crowd} view={p.view} seatId={p.seat?.id??null} flying={p.flying}/>
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
export default function Stadium(props:Props){return <Boundary notify={props.onUnavailable}><Canvas fallback={<p>Sektor, rząd i miejsce możesz wybrać w panelu obok.</p>} shadows dpr={[1,1.7]} camera={{position:[148,138,168],fov:43,near:.1,far:1200}} gl={{antialias:true,localClippingEnabled:true}}><Scene {...props}/></Canvas></Boundary>}
