import {useMemo,useRef,useState} from 'react';
import {Plus,Minus,LocateFixed} from 'lucide-react';
import {allSectors,sectors,sectorSeats,type Seat,type SectorId} from '../data/stadium';
import {mapBounds,seatBounds} from '../domain/map';

type Props={sector:SectorId|null;seat:Seat|null;row:number;legacyOnly?:boolean;onSector:(id:SectorId)=>void;onSeat:(seat:Seat)=>void};
export default function StadiumMap({sector,seat,row,legacyOnly=false,onSector,onSeat}:Props){
 const svg=useRef<SVGSVGElement>(null);const drag=useRef<{id:number;x:number;y:number}|null>(null);const moved=useRef(false);
 const [zoom,setZoom]=useState(1),[pan,setPan]=useState({x:0,y:0});
 const bounds=useMemo(()=>mapBounds(sector),[sector]);
 const blocks=useMemo(()=>[...allSectors].sort((a,b)=>Number(sectors.some(s=>s.id===a.id))-Number(sectors.some(s=>s.id===b.id))).filter(s=>!legacyOnly||sectors.some(legacy=>legacy.id===s.id)).map(s=>({...s,bounds:seatBounds(sectorSeats(s.id),.8)})),[legacyOnly]);
 const seats=useMemo(()=>sector?sectorSeats(sector):[],[sector]);
 const width=bounds.width/zoom,height=bounds.height/zoom;
 const x=bounds.x+(bounds.width-width)/2+pan.x,y=bounds.y+(bounds.height-height)/2+pan.y;
 const world=(clientX:number,clientY:number)=>{const matrix=svg.current?.getScreenCTM();return matrix?new DOMPoint(clientX,clientY).matrixTransform(matrix.inverse()):null;};
 const pick=(action:()=>void)=>{if(!moved.current)action();};
 return <div className="stadium-map">
 <div className="map-tools" aria-label="Powiększenie planu"><button aria-label="Przybliż plan" disabled={zoom>=8} onClick={()=>setZoom(z=>Math.min(8,z*1.5))}><Plus size={16}/></button><button aria-label="Oddal plan" disabled={zoom<=1} onClick={()=>setZoom(z=>Math.max(1,z/1.5))}><Minus size={16}/></button><button aria-label="Wyśrodkuj plan" onClick={()=>{setZoom(1);setPan({x:0,y:0})}}><LocateFixed size={16}/></button></div>
 <svg ref={svg} viewBox={`${x} ${y} ${width} ${height}`} role="group" aria-label={sector?`Plan 2D sektora ${sector}. Wybór dostępny także w panelu miejsc.`:'Plan 2D całego stadionu. Wybierz sektor.'}
 onPointerDown={e=>{if(e.button!==0)return;moved.current=false;drag.current={id:e.pointerId,x:e.clientX,y:e.clientY};}}
 onPointerMove={e=>{const active=drag.current;if(!active||active.id!==e.pointerId)return;const distance=Math.hypot(e.clientX-active.x,e.clientY-active.y);if(!moved.current&&distance<5)return;moved.current=true;svg.current?.setPointerCapture(e.pointerId);const a=world(active.x,active.y),b=world(e.clientX,e.clientY);if(a&&b)setPan(p=>({x:p.x+a.x-b.x,y:p.y+a.y-b.y}));drag.current={id:e.pointerId,x:e.clientX,y:e.clientY};}}
 onPointerUp={e=>{drag.current=null;if(svg.current?.hasPointerCapture(e.pointerId))svg.current.releasePointerCapture(e.pointerId);}} onPointerCancel={()=>{drag.current=null;moved.current=true;}}>
 <rect x={-110} y={-90} width={220} height={180} rx={12} fill="#e3e8ed"/>
 <rect x={-58} y={-40} width={116} height={80} rx={2} fill="#42845c"/>
 <rect x={-52.5} y={-34} width={105} height={68} fill="#629e70" stroke="#eef6ec" strokeWidth={.35}/>
 <path d="M0 -34V34M-52.5 -20.16H-36V20.16H-52.5M52.5 -20.16H36V20.16H52.5" fill="none" stroke="#eef6ec" strokeWidth={.35}/><circle r={9.15} fill="none" stroke="#eef6ec" strokeWidth={.35}/>
 {blocks.map(block=><g key={block.id} opacity={sector&&sector!==block.id? .2:1}><rect x={block.bounds.x} y={block.bounds.y} width={block.bounds.width} height={block.bounds.height} rx={.6} fill={sector===block.id?'#d1e5ff':'#8db1e0'} stroke="#f3f7fb" strokeWidth={.5} role="button" tabIndex={sector?-1:0} aria-label={`${block.name}, blok ${block.id}`} onClick={e=>{e.stopPropagation();pick(()=>onSector(block.id))}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSector(block.id)}}}/>{!sector&&<text x={block.bounds.x+block.bounds.width/2} y={block.bounds.y+block.bounds.height/2} textAnchor="middle" dominantBaseline="middle" fontSize={2.6} fill="#173d70" fontWeight={650} pointerEvents="none">{block.id}</text>}</g>)}
 {seats.map(s=><rect key={s.id} x={s.position[0]-.48} y={s.position[2]-.4} width={.96} height={.8} rx={.18} fill={seat?.id===s.id?'#ffd268':!s.available?'#9aa7b7':s.row===row?'#397bd4':'#82b2ec'} stroke={seat?.id===s.id?'#926615':'#fff'} strokeWidth={.12} role="button" tabIndex={s.row===row?0:-1} aria-label={`Rząd ${s.row}, miejsce ${s.number}, ${s.available?s.price+' zł':'zajęte, podgląd dostępny'}`} onClick={e=>{e.stopPropagation();pick(()=>onSeat(s))}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSeat(s)}}}><title>{`Rząd ${s.row} · Miejsce ${s.number} · ${s.available?s.price+' zł':'Zajęte · możesz obejrzeć widok'}`}</title></rect>)}
 </svg>
 <div className="map-caption">{sector?`Sektor ${sector} · rząd ${row} · kliknij fotel`:'Wybierz blok na planie lub trybunę w panelu'}</div>
 </div>;
}
