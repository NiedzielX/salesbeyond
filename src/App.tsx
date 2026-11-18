import { useEffect, useRef, useState, useReducer, useCallback, lazy, Suspense } from 'react';
import { ArrowUpRight, ArrowRight, ArrowLeft, ChevronRight, RotateCcw, Play, Pause, Maximize2, Layers3, MousePointer2, MoveUpRight, Check, MapPin, X, Ticket, Eye, Orbit, ShieldCheck } from 'lucide-react';
const Stadium=lazy(()=>import('./components/Stadium'));
const LocalVenue=lazy(()=>import('./components/LocalVenue'));
import {clubProfile} from './data/venueChart';
const localRenderer=new URLSearchParams(window.location.search).get('renderer')==='local';
import {toggleFullscreen} from './components/fullscreen';
import {scheduleTour} from './domain/tour';
import {initialSelection, selectionReducer} from './domain/selection';
import { sectors, getSeat, seatsPerRow, rows, type SectorId, type Seat } from './data/stadium';
export default function App(){
 const [{sector,seat,row,view},dispatch]=useReducer(selectionReducer,initialSelection);
 const [roof,setRoof]=useState(false);const [reset,setReset]=useState(0);const [tour,setTour]=useState(false);const [info,setInfo]=useState(false);const [full,setFull]=useState(false);const [flying,setFlying]=useState(false);const container=useRef<HTMLDivElement>(null);const panel=useRef<HTMLDivElement>(null);const modal=useRef<HTMLElement>(null);const viewport=useRef<HTMLDivElement>(null);
 const [controlMessage,setControlMessage]=useState('');
 const [unavailable,setUnavailable]=useState(false);
 const [seatPreview,setSeatPreview]=useState<string|null>(null);
 const [arrived,setArrived]=useState(false);
 const failScene=useCallback(()=>{setUnavailable(true);setFlying(false);setTour(false)},[]);
 const ready=useCallback(()=>{setFlying(false);setArrived(true)},[]);
 const localReady=useCallback((atSeat:boolean)=>{setFlying(false);setArrived(atSeat)},[]);
 const selectSector=(id:SectorId)=>{setTour(false);setFlying(true);dispatch({type:'sector',id});setReset(r=>r+1);};
 const selectSeat=(s:Seat)=>{if(!s.available)return;setTour(false);setFlying(true);setArrived(false);dispatch({type:'seat',seat:s});};
 const overview=()=>{setTour(false);setFlying(true);dispatch({type:'reset'});setReset(v=>v+1);};
 useEffect(()=>{
 if(modal.current)return; // Keep modal focus if the GPU context is lost behind it.
 panel.current?.focus({preventScroll:true});
 if(window.matchMedia('(max-width: 700px)').matches&&(view==='seat'||unavailable)){
 (unavailable?panel.current:viewport.current)?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
 }
 },[view,unavailable]);
 useEffect(()=>{if(!tour)return;dispatch({type:'reset'});setFlying(true);setReset(r=>r+1);return scheduleTour(action=>{dispatch(action);setFlying(true)},()=>setTour(false))},[tour]);
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'){setTour(false);setInfo(false);}};const onFull=()=>setFull(!!document.fullscreenElement);window.addEventListener('keydown',onKey);document.addEventListener('fullscreenchange',onFull);return()=>{window.removeEventListener('keydown',onKey);document.removeEventListener('fullscreenchange',onFull)}},[]);
 useEffect(()=>{
 if(!info)return;
 const opener=document.activeElement instanceof HTMLElement?document.activeElement:null;
 const dialog=modal.current;
 const focusable=()=>Array.from(dialog?.querySelectorAll<HTMLElement>('button, a[href], input, [tabindex="0"]')||[]).filter(el=>!el.hasAttribute('disabled'));
 focusable()[0]?.focus();
 const trap=(event:KeyboardEvent)=>{
 if(event.key!=='Tab')return;
 const items=focusable();const first=items[0];const last=items[items.length-1];
 if(event.shiftKey&&(document.activeElement===first||!dialog?.contains(document.activeElement))){event.preventDefault();last?.focus()}
 else if(!event.shiftKey&&(document.activeElement===last||!dialog?.contains(document.activeElement))){event.preventDefault();first?.focus()}
 };
 document.addEventListener('keydown',trap);
 return()=>{document.removeEventListener('keydown',trap);if(opener?.isConnected)opener.focus()};
 },[info]);
 async function fullscreen(){setTour(false);const success=await toggleFullscreen(document,container.current);setControlMessage(success?'':'Pełny ekran jest niedostępny w tej przeglądarce.');}
 const selectedSector=sectors.find(s=>s.id===sector);
 return <div className="app" ref={container}>
 <header className="header"><a className="wordmark" href="./" aria-label="SalesBeyond — strona główna"><span className="brand-symbol">s<span>↗</span></span>salesbeyond<span className="brand-period">.</span></a><span className="header-divider"/><span className="header-project">DLA KLUBÓW PIŁKARSKICH</span><nav><button onClick={()=>{setTour(false);setInfo(true)}}>O projekcie <ArrowUpRight size={14}/></button><span className="demo-pill"><i/> INTERAKTYWNE DEMO</span></nav></header>
 <main>
 <div className="intro"><div className="intro-copy"><div className="eyebrow"><span/> PIERWSZY SCENARIUSZ · POZNAŃ</div><h1>Twoje miejsce.<br/><span>Twoja perspektywa.</span></h1><p>Poczuj atmosferę, zanim wejdziesz na trybuny.<br/>Odkryj stadion i zobacz widok ze swojego miejsca.</p></div><div className="intro-meta"><div className="stadium-mark"><span>1922</span><b>POZNAŃ</b><span>STADION</span></div><div><span className="small-label">KONCEPCJA DOŚWIADCZENIA KIBICA</span><strong>{clubProfile.name}</strong><span className="location"><MapPin size={12}/> 52°23′52″N 16°51′29″E</span></div></div></div>
 <section className="experience" aria-label="Interaktywny wybór miejsca na stadionie">
 <div className="viewport" ref={viewport}><div className="viewport-heading"><span className="live-dot"/>{view==='overview'?'ODKRYWAJ STADION':view==='sector'?`TRYBUNA PÓŁNOCNA / ${sector}`:unavailable?'PODGLĄD NIEDOSTĘPNY':flying?'PRZELOT DO MIEJSCA':localRenderer&&!arrived?'WYBRANE MIEJSCE':'TWÓJ WIDOK Z MIEJSCA'}<span className="render-badge">{unavailable?'BRAK 3D':'LIVE 3D'}</span></div>
 <div className="scene" onPointerDown={()=>setTour(false)} onWheel={()=>setTour(false)}><>{unavailable?<div className="webgl-error" role="alert">Podgląd 3D jest niedostępny.<br/>Odśwież stronę, aby spróbować ponownie.<br/>Dane miejsc nadal możesz sprawdzić w panelu.</div>:<Suspense fallback={<div className="scene-loading" role="status">Przygotowujemy Twój widok stadionu…</div>}>{localRenderer?<LocalVenue sector={sector} seat={seat} row={row} view={view} roof={roof} reset={reset} onSector={selectSector} onSeat={selectSeat} onOverview={overview} onReady={localReady} onUnavailable={failScene} onPreview={setSeatPreview}/>:<Stadium sector={sector} seat={seat} view={view} roof={roof} reset={reset} onSector={selectSector} onSeat={selectSeat} onReady={ready} onUnavailable={failScene}/>}</Suspense>}</></div>
 <div className="scene-top-right"><button title={view!=='overview'?'Dach jest dostępny w panoramie':roof?'Odkryj trybuny':'Pokaż dach'} aria-pressed={roof} disabled={unavailable||view!=='overview'} onClick={()=>{setTour(false);setRoof(v=>!v)}}><Layers3 size={17}/></button><button title="Pełny ekran" aria-pressed={full} onClick={fullscreen}><Maximize2 size={17}/></button></div>
 <div className="control-message" role="status">{controlMessage}</div><div className="scene-bottom"><div className="scene-controls"><button onClick={overview} title="Przywróć widok stadionu"><RotateCcw size={16}/></button><div className="controls-divider"/><MousePointer2 size={14}/><span>{unavailable?'Podgląd 3D niedostępny':view==='seat'?'Przeciągnij, aby rozejrzeć się':'Przeciągnij, aby obrócić'}</span><span hidden={unavailable} className="scroll-hint">{view==='seat'?'· Stały punkt widzenia':'· Scroll, aby przybliżyć'}</span></div><div className="compass"><span>N</span><MoveUpRight size={20}/></div></div>
 {view==='overview'&&!unavailable&&<div className="scene-hint"><span className="hint-orbit"><Orbit size={16}/></span>Wybierz niebieski sektor, aby wejść na trybunę<ArrowUpRight size={14}/></div>}
 {tour&&<div className="tour-indicator"><span/> TRWA WYCIECZKA <button onClick={()=>setTour(false)}>Zatrzymaj <Pause size={12}/></button></div>}
 </div>
 <aside className="selection"><div className="steps">{['Stadion','Sektor','Miejsce'].map((label,i)=><div key={label} className={(view==='overview'?0:view==='sector'?1:2)>=i?'done':''}><span>{(view==='overview'?0:view==='sector'?1:2)>i?<Check size={11}/>:i+1}</span>{label}{i<2&&<ChevronRight size={12}/>}</div>)}</div>
 <div className="panel-content" ref={panel} tabIndex={-1} aria-label="Wybór i podsumowanie miejsca">{view==='seat'&&seat?<><div className="panel-eyebrow">WŁAŚNIE TUTAJ MOŻESZ BYĆ</div><h2>Dobry widok.{' '}<br/>Wielkie emocje.</h2><p className="panel-description">{unavailable?'Wybrano miejsce. Podgląd 3D jest obecnie niedostępny.':<>Spójrz na boisko z perspektywy<br/>wybranego miejsca.</>}</p><div className="ticket"><div className="ticket-head"><Ticket size={20}/><span>TWOJE MIEJSCE <small>DEMO</small></span><Check size={16}/></div>{seatPreview&&localRenderer&&!unavailable&&<figure className="ticket-preview"><img src={seatPreview} alt={`Poglądowy widok 3D z sektora ${seat.sectorId}, rzędu ${seat.row}, miejsca ${seat.number}`}/><figcaption>Twoja perspektywa · geometria 3D</figcaption></figure>}<strong>Trybuna północna</strong><div className="ticket-data"><div><small>SEKTOR</small><b>{seat.sectorId}</b></div><div><small>RZĄD</small><b>{seat.row.toString().padStart(2,'0')}</b></div><div><small>MIEJSCE</small><b>{seat.number.toString().padStart(2,'0')}</b></div></div><div className="ticket-price"><span>Cena poglądowa</span><strong>{seat.price}<small> zł</small></strong></div></div><button className="primary-button" onClick={()=>{dispatch({type:'back'});setFlying(true);setTour(false)}}><ArrowLeft size={16}/> Wybierz inne miejsce</button><div className="seat-note" aria-live="polite"><Eye size={14}/>{unavailable?'Podgląd 3D niedostępny':flying?'Trwa przelot do Twojego miejsca…':localRenderer&&!arrived?'Przelot przerwany — wybrane miejsce zachowane':'Perspektywa z geometrii 3D'}</div>{localRenderer&&!unavailable&&!flying&&!arrived&&<button className="retry-view" onClick={()=>{setTour(false);setFlying(true);setReset(value=>value+1)}}>Zobacz ponownie z tego miejsca <Eye size={13}/></button>}</>:<><div className="panel-eyebrow">TWÓJ MECZ ZACZYNA SIĘ TUTAJ</div><h2>{sector?'Znajdź swój':'Gdzie chcesz'}{' '}<br/>{sector?'punkt widzenia.':'poczuć emocje?'}</h2><p className="panel-description">{unavailable?'Możesz sprawdzić dane miejsc. Podgląd 3D jest obecnie niedostępny.':sector?'Wybierz rząd i wolne miejsce. Sprawdzisz, jak wygląda boisko z trybuny.':'Wybierz jeden z trzech sektorów i sprawdź swoją perspektywę na boisko.'}</p>
 <label className="field-label">TRYBUNA <span>01 / 01</span></label><div className="stand-field"><span className="stand-icon"><Layers3 size={18}/></span><div><b>Trybuna północna</b><small>3 sektory demonstracyjne</small></div><Check size={15}/></div>
 {!sector?<><div className="field-label sector-field-label">WYBIERZ SEKTOR <span>03 DOSTĘPNE</span></div><div className="sector-list">{sectors.map(s=><button key={s.id} onClick={()=>selectSector(s.id)}><span className="sector-number">{s.id}</span><span className="sector-copy"><b>{s.name}</b><small>od {s.price} zł <span>/ demo</span></small></span><ArrowUpRight size={17}/></button>)}</div>{!unavailable&&<div className="panel-tip"><MousePointer2 size={16}/><span>Możesz też wybrać sektor<br/>bezpośrednio na stadionie.</span></div>}</>:<><div className="sector-selected"><span>Sektor <b>{sector}</b></span><button onClick={overview}>Zmień <ArrowUpRight size={12}/></button></div><label className="field-label" htmlFor="row">RZĄD <span>{row.toString().padStart(2,'0')} / {rows}</span></label><input id="row" aria-label="Wybierz rząd" type="range" min="1" max={rows} value={row} onChange={e=>{setTour(false);dispatch({type:'row',row:Number(e.target.value)})}}/><div className="seat-grid" aria-label={`Miejsca w rzędzie ${row}`}>{Array.from({length:seatsPerRow},(_,i)=>getSeat(sector,row,i+1)).map(s=><button key={s.id} disabled={!s.available} onClick={()=>selectSeat(s)} aria-label={`Miejsce ${s.number}, ${s.available?s.price+' zł':'niedostępne'}`}>{s.number}</button>)}</div><div className="seat-legend"><span><i/>Wolne</span><span><i/>Zajęte</span><b>od {sector?getSeat(sector,row,1).price:selectedSector?.price} zł</b></div><p className="select-seat-tip">{unavailable?'Kliknij wolne miejsce, aby sprawdzić dane':'Kliknij wolne miejsce, aby zobaczyć widok'} <ArrowRight size={13}/></p></>}
 </>}</div><div className="panel-footer"><ShieldCheck size={14}/><span>Demo koncepcyjne — dane poglądowe</span></div></aside>
 </section>
 <div className="bottom-bar"><div className="bottom-caption"><span className="mini-plus">+</span><div><b>Najlepsze miejsce? To Twoje.</b><span>Poznaj stadion z zupełnie nowej perspektywy.</span></div></div><button disabled={unavailable} className={`tour-button ${tour?'playing':''}`} onClick={()=>setTour(v=>!v)}>{tour?<Pause size={13}/>:<Play size={13} fill="currentColor"/>}{tour?'Zatrzymaj wycieczkę':'Zobacz, jak to działa'}<span>24 S</span></button></div>
 </main><footer><span>© 2026 SALESBEYOND</span><span>PROTOTYP DOŚWIADCZENIA KIBICA <span className="footer-dot">·</span> ZBUDOWANY DLA EMOCJI</span><span>POZNAŃ, POLSKA <ArrowUpRight size={11}/></span></footer>
 {info&&<div className="modal-backdrop" onClick={()=>setInfo(false)}><section className="modal" ref={modal} role="dialog" aria-modal="true" aria-labelledby="about-title" onClick={e=>e.stopPropagation()}><button className="close-modal" aria-label="Zamknij" onClick={()=>setInfo(false)}><X/></button><div className="eyebrow">SALESBEYOND / PROTOTYP</div><h2 id="about-title">Bliżej stadionu.<br/>Bliżej emocji.</h2><p>Moduł „Zobacz widok ze swojego miejsca” dla klubów piłkarskich. Pierwszy scenariusz: Enea Stadion w Poznaniu. Wybierz sektor, rząd i fotel — kamera przeniesie Cię na trybunę.</p><p>Bryła jest uproszczoną interpretacją stadionu. Nazwy sektorów, miejsca, dostępność i ceny są przykładowe. Nie jest to oficjalny produkt klubu. Dokładność wymaga oficjalnych planów i weryfikacji z klubem.</p><button className="primary-button" onClick={()=>setInfo(false)}>Odkrywaj stadion <ArrowRight size={16}/></button></section></div>}
 </div>
}
