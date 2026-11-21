import { useEffect, useRef, useState, useReducer, useCallback, useMemo, lazy, Suspense } from 'react';
import { ArrowUpRight, ArrowRight, ArrowLeft, ChevronRight, RotateCcw, Play, Pause, Maximize2, Layers3, MousePointer2, MoveUpRight, Check, MapPin, X, Ticket, Eye, Orbit, ShieldCheck } from 'lucide-react';
const Stadium=lazy(()=>import('./components/Stadium'));
const LocalVenue=lazy(()=>import('./components/LocalVenue'));
const StadiumMap=lazy(()=>import('./components/StadiumMap'));
import {demoEvent} from './data/event';
import {createSeatRuleCatalog} from './domain/seatRules';
import {eventSelectionLabel,seatRuleMessage} from './domain/eventSelection';
import {clubProfile} from './data/venueChart';
const localRenderer=new URLSearchParams(window.location.search).get('renderer')==='local';
import Basket from './components/Basket';
import SeatFilters from './components/SeatFilters';
import GroupFinder from './components/GroupFinder';
import SeatShare from './components/SeatShare';
import {useFanSession} from './components/useFanSession';
import {useLiveHold} from './components/useLiveHold';
import {useSectionInventory} from './components/useSectionInventory';
import LiveHoldPanel from './components/LiveHoldPanel';
import {selectionUrl} from './domain/fanSession';
import {matchesSeat,searchSectors,summarizeSeats,groupSearchScope} from './domain/seatSearch';
import {basketReducer,basketLimit,basketTotal,reconcileBasket,type BasketAction} from './domain/basket';
import {toggleFullscreen} from './components/fullscreen';
import {scheduleTour} from './domain/tour';
import {selectionReducer} from './domain/selection';
import { allSectors, stadiumSeats, stands, seatsInRow, sectorSeats, sectorRows, getSeat, resolveSeat, rows, type SectorId, type Seat } from './data/stadium';
export default function App(){
 const {initial,notice:sessionNotice,dismiss:dismissSessionNotice,save:saveSession}=useFanSession(localRenderer);
 const [{sector,seat:previewSeat,row,view,rowFocused},dispatch]=useReducer(selectionReducer,initial.selection);
 const [roof,setRoof]=useState(true);const [reset,setReset]=useState(0);const [tour,setTour]=useState(false);const [info,setInfo]=useState(false);const [full,setFull]=useState(false);const [flying,setFlying]=useState(initial.surface==='3d'&&initial.selection.view!=='overview');const container=useRef<HTMLDivElement>(null);const panel=useRef<HTMLDivElement>(null);const modal=useRef<HTMLElement>(null);const viewport=useRef<HTMLDivElement>(null);
 const [controlMessage,setControlMessage]=useState('');
 const [stand,setStand]=useState(initial.stand);
 const [filters,setFilters]=useState(initial.filters);
 const [avoidSingles,setAvoidSingles]=useState(initial.avoidSingles??false);
 const [surface,setSurface]=useState<'map'|'3d'>(initial.surface);
 const [crowd,setCrowd]=useState(false);
 const inventory=useMemo(()=>stadiumSeats().filter(s=>!localRenderer||['101','102','103'].includes(s.sectorId)),[]);
 const liveHold=useLiveHold(inventory,!localRenderer);
 const holdLocked=liveHold.state?.locked??false;
 const holdArea=useRef<HTMLDivElement>(null);
 const ownHold=liveHold.state?.phase==='active'?liveHold.state.hold:null;
 const ownedIds=useMemo(()=>ownHold?ownHold.items.map(s=>s.seatId):[],[ownHold]);
 const sectionInventory=useSectionInventory(inventory,liveHold.mode==='service',sector,ownedIds,`${liveHold.state?.phase??''}:${ownHold?.id??''}`);
 const overlays=useMemo(()=>new Map(Object.values(sectionInventory.snapshot.bySection).flatMap(seats=>seats.map(s=>[s.id,s] as const))),[sectionInventory.snapshot]);
 const resolveCurrent=useCallback((id:string)=>overlays.get(id)??resolveSeat(id),[overlays]);
 const seat=useMemo(()=>previewSeat?(overlays.get(previewSeat.id)??previewSeat):null,[previewSeat,overlays]);
 const ruleInventory=useMemo(()=>inventory.map(s=>overlays.get(s.id)??s),[inventory,overlays]);
 const scopeLive=!!sector&&!!sectionInventory.snapshot.bySection[sector]&&!sectionInventory.error&&!sectionInventory.loading;
 const [basket,cart]=useReducer((state:Seat[],action:BasketAction)=>basketReducer(state,action,resolveCurrent),initial.basket);
 const chosenIds=useMemo(()=>[...new Set([...basket.map(s=>s.id),...ownedIds])],[basket,ownedIds]);
 const chosen=useMemo(()=>new Set(chosenIds),[chosenIds]);const [basketMessage,setBasketMessage]=useState('');
 const [review,setReview]=useState(false);
 const [unavailable,setUnavailable]=useState(false);
 const [seatPreview,setSeatPreview]=useState<{seatId:string;image:string}|null>(null);
 const preview=useCallback((image:string|null)=>setSeatPreview(image&&seat?{seatId:seat.id,image}:null),[seat]);
 const [arrived,setArrived]=useState(false);
 const [previewRequest,setPreviewRequest]=useState(0);
 const lastFocus=useRef({view,unavailable,previewRequest});
 useEffect(()=>{const next=selectionUrl(window.location.href,{sector,seat,row,view});if(next&&next!==window.location.href){try{window.history.replaceState(null,'',next);}catch{/* The saved local selection remains usable if navigation is restricted. */}}},[sector,seat,row,view]);
 useEffect(()=>saveSession({basket,selection:{sector,seat,row,view},filters,stand,surface,avoidSingles}),[basket,sector,seat,row,view,filters,stand,surface,avoidSingles,saveSession]);
 const failScene=useCallback(()=>{setUnavailable(true);setSurface('map');setFlying(false);setArrived(false);setTour(false)},[]);
 const ready=useCallback(()=>{setFlying(false);setArrived(true)},[]);
 const localReady=useCallback((atSeat:boolean)=>{setFlying(false);setArrived(atSeat)},[]);
 const selectSector=(id:SectorId,clickedRow?:number)=>{setControlMessage('');setStand(allSectors.find(s=>s.id===id)?.side??0);setTour(false);setFlying(surface==='3d');dispatch({type:'sector',id,row:clickedRow});setReset(r=>r+1);};
 const selectSeat=(s:Seat)=>{setControlMessage('');setStand(s.side??0);setTour(false);setFlying(surface==='3d');setArrived(false);dispatch({type:'seat',seat:s});};
 const previewFromList=(s:Seat)=>{selectSeat(s);setReset(r=>r+1);setPreviewRequest(r=>r+1);};
 const overview=()=>{setControlMessage('');setTour(false);setFlying(surface==='3d');dispatch({type:'reset'});setReset(v=>v+1);};
 useEffect(()=>{
 const previous=lastFocus.current,explicitPreview=previous.previewRequest!==previewRequest;
 lastFocus.current={view,unavailable,previewRequest};
 if(previous.view===view&&previous.unavailable===unavailable&&!explicitPreview)return;
 if(modal.current)return; // Keep modal focus if the GPU context is lost behind it.
 panel.current?.focus({preventScroll:true});
 if(panel.current)panel.current.scrollTop=0;
 if(explicitPreview||window.matchMedia('(max-width: 700px)').matches&&(view==='seat'||unavailable)){
 (unavailable?panel.current:viewport.current)?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
 }
 },[view,unavailable,previewRequest]);
 useEffect(()=>{if(!tour)return;dispatch({type:'reset'});setFlying(true);setReset(r=>r+1);return scheduleTour(action=>{dispatch(action);setFlying(true)},()=>setTour(false))},[tour]);
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'){setTour(false);setInfo(false);setReview(false);}};const onFull=()=>setFull(!!document.fullscreenElement);window.addEventListener('keydown',onKey);document.addEventListener('fullscreenchange',onFull);return()=>{window.removeEventListener('keydown',onKey);document.removeEventListener('fullscreenchange',onFull)}},[]);
 useEffect(()=>{
 if(!info&&!review)return;
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
 },[info,review]);
 const eventStatus=sectionInventory.eventStatus&&sectionInventory.eventStatus!=='open'?'closed':demoEvent.status;
 const rulePolicy=useMemo(()=>({preventSingleSeats:demoEvent.preventSingleSeats||avoidSingles,eventStatus,limit:basketLimit}),[avoidSingles,eventStatus]);

 const ruleCatalog=useMemo(()=>createSeatRuleCatalog(ruleInventory),[ruleInventory]);
 const checkAddition=useMemo(()=>ruleCatalog.forBasket(chosenIds,rulePolicy),[ruleCatalog,chosenIds,rulePolicy]);
 const eventMessage=eventStatus==='open'?'':seatRuleMessage(eventStatus);
 function reportRule(reason:Parameters<typeof seatRuleMessage>[0]){const message=seatRuleMessage(reason);setBasketMessage(message);setControlMessage(message);}
 function addSeat(){
 if(holdLocked){setBasketMessage('Zwolnij obecną grupę lub wyjaśnij wynik blokady przed zmianą wyboru.');return;}
 if(!seat)return;
 if(basket.some(s=>s.id===seat.id)){cart({type:'remove',id:seat.id});setBasketMessage('Usunięto miejsce z wyboru.');setControlMessage('');return;}
 const result=checkAddition([seat.id]);if(!result.ok){reportRule(result.reason);return;}
 cart({type:'add',ids:[seat.id]});setControlMessage('');setBasketMessage(`Dodano miejsce ${seat.number}, sektor ${seat.sectorId}.`);
 }
 function addGroup(group:Seat[]){
 if(holdLocked){setBasketMessage('Zwolnij obecną grupę przed zmianą wyboru.');return false;}
 const result=checkAddition(group.map(s=>s.id));if(!result.ok){reportRule(result.reason);return false;}
 const action={type:'add' as const,ids:group.map(s=>s.id)};
 if(basketReducer(basket,action,resolveCurrent)===basket)return false;
 cart(action);setControlMessage('');setBasketMessage(`Dodano grupę: ${group.length} miejsc · blok ${group[0].sectorId}, rząd ${group[0].row}.`);return true;
 }
 function reviewBasket(){
 if(holdLocked){holdArea.current?.scrollIntoView({block:'start',behavior:'auto'});return;}
 const checked=reconcileBasket(basket,resolveCurrent);
 if(checked.changed){cart({type:'replace',ids:checked.seats.map(s=>s.id)});setBasketMessage(checked.discarded?'Część miejsc nie jest już dostępna w katalogu demo. Zaktualizowano wybór — sprawdź go ponownie.':'Cena w katalogu demo uległa zmianie. Sprawdź nową sumę przed podsumowaniem.');return;}
 const allowed=checkAddition([]);if(!allowed.ok){reportRule(allowed.reason);return;}
 setTour(false);setInfo(false);setReview(true);
 }
 function enter3d(){if(unavailable||surface==='3d')return;setSurface('3d');setArrived(false);setFlying(true);setReset(v=>v+1);}
 async function fullscreen(){setTour(false);const success=await toggleFullscreen(document,container.current);setControlMessage(success?'':'Pełny ekran jest niedostępny w tej przeglądarce.');}
 const selectedSector=allSectors.find(s=>s.id===sector);
 const activeStand=selectedSector?.side??stand;
 const standName=stands.find(s=>s.side===activeStand)?.name??'Cały stadion';
 const visibleSectors=useMemo(()=>searchSectors(activeStand,localRenderer),[activeStand]);
 const summaries=useMemo(()=>summarizeSeats(visibleSectors.map(s=>s.id),filters,eventStatus==='open',id=>sectorSeats(id).map(s=>overlays.get(s.id)??s)),[visibleSectors,filters,overlays]);
 const summaryById=new Map(summaries.map(s=>[s.id,s]));
 const totalMatches=summaries.reduce((sum,s)=>sum+s.matching,0);
 const searchScope=groupSearchScope(sector,visibleSectors);
 const filterSummaries=sector?summaries.filter(s=>s.id===sector):summaries;
 const filterTotals=filterSummaries.reduce((sum,s)=>({matching:sum.matching+s.matching,total:sum.total+s.total}),{matching:0,total:0});
 const availableRows=sector?sectorRows(sector):Array.from({length:rows},(_,i)=>i+1);
 const liveSeat=seat?overlays.get(seat.id):null;
 const seatAvailability=liveSeat?.ownedHold?'Twoja czasowa blokada':liveSeat?.inventoryStatus==='held'?'Czasowo zablokowane · podgląd dostępny':seat?.available?(liveSeat?'Wolne · stan z usługi demo':'Miejsce wolne · katalog demonstracyjny'):'Niedostępne · podgląd perspektywy';
 const visibleSeats=sector?seatsInRow(sector,row).map(s=>overlays.get(s.id)??s):[];
 return <div className="app" ref={container}>
 <header className="header"><a className="wordmark" href="./" aria-label="SalesBeyond — strona główna"><span className="brand-symbol">s<span>↗</span></span>salesbeyond<span className="brand-period">.</span></a><span className="header-divider"/><span className="header-project">DLA KLUBÓW PIŁKARSKICH</span><nav><button onClick={()=>{setTour(false);setInfo(true)}}>O projekcie <ArrowUpRight size={14}/></button><span className="demo-pill"><i/> INTERAKTYWNE DEMO</span></nav></header>
 <main>
 <div className="intro"><div className="intro-copy"><div className="eyebrow"><span/> PIERWSZY SCENARIUSZ · POZNAŃ</div><h1>Twoje miejsce.<br/><span>Twoja perspektywa.</span></h1><p>Poczuj atmosferę, zanim wejdziesz na trybuny.<br/>Odkryj stadion i zobacz widok ze swojego miejsca.</p></div><div className="intro-meta"><div className="stadium-mark"><span>1922</span><b>POZNAŃ</b><span>STADION</span></div><div><span className="small-label">KONCEPCJA DOŚWIADCZENIA KIBICA</span><strong>{clubProfile.name}</strong><span className="location"><MapPin size={12}/> 52°23′52″N 16°51′29″E</span></div></div></div>
 {sessionNotice&&<div className="session-notice" role="status"><span>{sessionNotice}</span><button aria-label="Zamknij informację o zapisanym wyborze" onClick={dismissSessionNotice}><X size={14}/></button></div>}
 <div className="event-context"><span><i className={eventStatus==='open'?'open':'closed'}/>{eventSelectionLabel(eventStatus)}</span><strong>{demoEvent.title}</strong><small>DANE DEMONSTRACYJNE</small></div>{eventMessage&&<p className="search-empty" role="status">{eventMessage}</p>}
 <SeatFilters liveScope={scopeLive} avoidSingles={avoidSingles} onAvoidSingles={setAvoidSingles} filters={filters} matching={filterTotals.matching} total={filterTotals.total} scope={sector?`Blok ${sector}`:standName} onChange={setFilters}/>
 {liveHold.mode==='service'&&sector&&<div className="inventory-status" role="status"><span>{sectionInventory.error?'Aktualizacja dostępności nie powiodła się — potwierdź miejsca ponownie przed blokadą.':sectionInventory.loading?'Sprawdzam bieżącą dostępność bloku…':sectionInventory.updatedAt?`Blok ${sector} · dostępność z usługi demo · aktualizacja co 15 sekund`:'Dostępność bloku czeka na sprawdzenie.'}</span><button disabled={sectionInventory.loading} onClick={sectionInventory.refresh}>Odśwież dostępność</button></div>}
 <div className="crowd-controls" role="group" aria-label="Symulowana widownia"><div><strong>Symulacja widowni</strong><span>Porównaj perspektywę na pustej i pełnej trybunie.</span></div><div className="crowd-toggle">{[{value:false,label:'Puste trybuny'},{value:true,label:'Z kibicami'}].map(option=><button key={option.label} aria-pressed={crowd===option.value} disabled={surface!=='3d'||unavailable||localRenderer} onClick={()=>{setTour(false);setCrowd(option.value)}}>{option.label}</button>)}</div><small>{surface!=='3d'?'Przejdź do stadionu 3D, aby porównać widownię.':unavailable||localRenderer?'Symulacja widowni jest niedostępna w tym widoku.':'Poglądowe sylwetki · niezależne od dostępności biletów.'}</small></div>
 <section className="experience" aria-label="Interaktywny wybór miejsca na stadionie">
 <div className="viewport" ref={viewport}><div className="viewport-heading"><span className="live-dot"/>{surface==='map'?'PLAN STADIONU 2D':view==='overview'?'ODKRYWAJ STADION':view==='sector'?`${standName.toUpperCase()} / ${sector}`:unavailable?'PODGLĄD NIEDOSTĘPNY':flying?'PRZELOT DO MIEJSCA':localRenderer&&!arrived?'WYBRANE MIEJSCE':'TWÓJ WIDOK Z MIEJSCA'}<span className="render-badge">{surface==='map'?'PLAN 2D':unavailable?'BRAK 3D':'LIVE 3D'}</span></div>
 <div className="scene" onPointerDown={()=>setTour(false)} onWheel={()=>setTour(false)}><>{surface==='map'?<Suspense fallback={<div className="scene-loading" role="status">Przygotowujemy plan stadionu…</div>}><StadiumMap focusRequest={previewRequest} inventory={overlays} chosenIds={chosenIds} sector={sector} seat={seat} row={row} legacyOnly={localRenderer} onSector={selectSector} onSeat={selectSeat} onOverview={overview}/></Suspense>:unavailable?<div className="webgl-error" role="alert">Podgląd 3D jest niedostępny.<br/>Odśwież stronę, aby spróbować ponownie.<br/>Dane miejsc nadal możesz sprawdzić w panelu.</div>:<Suspense fallback={<div className="scene-loading" role="status">Przygotowujemy Twój widok stadionu…</div>}>{localRenderer?<LocalVenue sector={sector} seat={seat} row={row} view={view} roof={roof} reset={reset} onSector={selectSector} onSeat={selectSeat} onOverview={overview} onReady={localReady} onUnavailable={failScene} onPreview={preview}/>:<Stadium crowd={crowd} inventory={overlays} rowFocused={rowFocused??false} chosenIds={chosenIds} sector={sector} seat={seat} row={row} flying={flying} view={view} roof={roof} reset={reset} onSector={selectSector} onSeat={selectSeat} onReady={ready} onUnavailable={failScene} onPreview={preview}/>}</Suspense>}</></div>
 <div className="scene-top-right"><button title={roof?'Ukryj dach':'Pokaż dach'} aria-label={roof?'Ukryj dach':'Pokaż dach'} aria-pressed={roof} disabled={unavailable||surface==='map'} onClick={()=>{setTour(false);setRoof(v=>!v)}}><Layers3 size={17}/></button><button title="Pełny ekran" aria-pressed={full} onClick={fullscreen}><Maximize2 size={17}/></button></div>
 <div className="surface-switch" aria-label="Sposób oglądania stadionu"><button aria-pressed={surface==='map'} onClick={()=>{setTour(false);setFlying(false);setArrived(false);setSurface('map')}}>Plan 2D</button><button aria-pressed={surface==='3d'} disabled={unavailable} title={unavailable?'3D niedostępne — plan 2D pozostaje aktywny':'Otwórz stadion 3D'} onClick={()=>{setTour(false);enter3d()}}>Stadion 3D</button></div>{unavailable&&<div className="map-fallback" role="status">3D jest niedostępne. Wybierz dowolny fotel na planie 2D.</div>}
 <div className="control-message" role="status">{controlMessage||(roof&&view!=='overview'&&surface==='3d'&&!localRenderer?'Przekrój dachu przy wybranej trybunie':'')}</div><div className="scene-bottom"><div className="scene-controls"><button onClick={overview} title="Przywróć widok stadionu"><RotateCcw size={16}/></button><div className="controls-divider"/><MousePointer2 size={14}/><span>{surface==='map'?'Przeciągnij, aby przesunąć plan':unavailable?'Podgląd 3D niedostępny':view==='seat'?'Przeciągnij, aby rozejrzeć się':'Przeciągnij, aby obrócić'}</span><span hidden={unavailable||surface==='map'} className="scroll-hint">{view==='seat'?'· Stały punkt widzenia':view==='sector'&&!localRenderer?'· Shift + przeciągnij: przesuń · Scroll: przybliż':'· Scroll, aby przybliżyć'}</span></div><div className="compass"><span>{surface==='map'?'2D':'3D'}</span><MoveUpRight size={20}/></div></div>
 {view==='overview'&&surface==='3d'&&!unavailable&&<div className="scene-hint"><span className="hint-orbit"><Orbit size={16}/></span>Wybierz niebieski sektor, aby wejść na trybunę<ArrowUpRight size={14}/></div>}
 {tour&&<div className="tour-indicator"><span/> TRWA WYCIECZKA <button onClick={()=>setTour(false)}>Zatrzymaj <Pause size={12}/></button></div>}
 </div>
 <aside className="selection"><div className="steps">{['Stadion','Sektor','Miejsce'].map((label,i)=><div key={label} className={(view==='overview'?0:view==='sector'?1:2)>=i?'done':''}><span>{(view==='overview'?0:view==='sector'?1:2)>i?<Check size={11}/>:i+1}</span>{label}{i<2&&<ChevronRight size={12}/>}</div>)}</div>
 <div className="panel-content" ref={panel} tabIndex={-1} aria-label="Wybór i podsumowanie miejsca">{view==='seat'&&seat?<><div className="panel-eyebrow">WŁAŚNIE TUTAJ MOŻESZ BYĆ</div><h2>Dobry widok.{' '}<br/>Wielkie emocje.</h2><p className="panel-description">{surface==='map'?'Wybrano fotel na planie 2D. Możesz zmienić wybór lub otworzyć perspektywę 3D.':unavailable?'Wybrano miejsce. Podgląd 3D jest obecnie niedostępny.':<>Spójrz na boisko z perspektywy<br/>wybranego miejsca.</>}</p><div className="ticket"><div className="ticket-head"><Ticket size={20}/><span>TWOJE MIEJSCE <small>DEMO</small></span><Check size={16}/></div>{seatPreview?.seatId===seat.id&&surface==='3d'&&!flying&&arrived&&!unavailable&&<figure className="ticket-preview"><img src={seatPreview.image} alt={`Poglądowy widok 3D z sektora ${seat.sectorId}, rzędu ${seat.row}, miejsca ${seat.number}`}/><figcaption>Twoja perspektywa · geometria 3D</figcaption></figure>}<strong>{seat.standId}</strong><div className="ticket-availability">{seatAvailability}</div><div className="ticket-data"><div><small>SEKTOR</small><b>{seat.sectorId}</b></div><div><small>RZĄD</small><b>{seat.row.toString().padStart(2,'0')}</b></div><div><small>MIEJSCE</small><b>{seat.number.toString().padStart(2,'0')}</b></div></div><div className="ticket-price"><span>{liveSeat?'Cena z usługi demo':'Cena poglądowa'}</span><strong>{seat.price}<small> zł</small></strong></div></div><button className="primary-button add-to-basket" disabled={holdLocked||!seat.available||!!eventMessage&&!basket.some(s=>s.id===seat.id)||basket.length>=basketLimit&&!basket.some(s=>s.id===seat.id)} onClick={addSeat}><Ticket size={16}/>{!seat.available?'Zajęte — dostępny podgląd':basket.some(s=>s.id===seat.id)?'Usuń z wyboru':eventMessage?eventSelectionLabel(eventStatus):basket.length>=basketLimit?'Osiągnięto limit 10 miejsc':'Dodaj do wyboru'}</button><SeatShare key={seat.id} id={seat.id} legacyOnly={localRenderer}/>{surface==='map'&&!unavailable&&<button className="primary-button view-seat-3d" onClick={enter3d}><Eye size={16}/> Zobacz z tego miejsca w 3D</button>}<button className="primary-button" onClick={()=>{dispatch({type:'back'});setFlying(surface==='3d');setTour(false)}}><ArrowLeft size={16}/> Wybierz inne miejsce</button><div className="seat-note" aria-live="polite"><Eye size={14}/>{surface==='map'?'Wybrano na planie 2D':unavailable?'Podgląd 3D niedostępny':flying?'Trwa przelot do Twojego miejsca…':localRenderer&&!arrived?'Przelot przerwany — wybrane miejsce zachowane':'Perspektywa z geometrii 3D'}</div>{localRenderer&&surface==='3d'&&!unavailable&&!flying&&!arrived&&<button className="retry-view" onClick={()=>{setTour(false);setFlying(true);setReset(value=>value+1)}}>Zobacz ponownie z tego miejsca <Eye size={13}/></button>}</>:<><div className="panel-eyebrow">TWÓJ MECZ ZACZYNA SIĘ TUTAJ</div><h2>{sector?'Znajdź swój':'Gdzie chcesz'}{' '}<br/>{sector?'punkt widzenia.':'poczuć emocje?'}</h2><p className="panel-description">{unavailable?'Plan 2D pozostaje dostępny. Wybierz trybunę, sektor i dowolny fotel.':sector?'Wybierz rząd i dowolny fotel. Możesz obejrzeć perspektywę także zajętego miejsca.':'Wybierz trybunę i sektor. Każdy fotel w modelu ma własną perspektywę.'}</p>
 <label className="field-label" htmlFor="stand">TRYBUNA <span>{localRenderer?1:4} TRYBUNY</span></label><div className="stand-field"><span className="stand-icon"><Layers3 size={18}/></span><div><select id="stand" value={activeStand} onChange={e=>{overview();setStand(Number(e.target.value))}}><option value={-1}>Cały stadion</option>{stands.filter(s=>!localRenderer||s.side===0).map(s=><option key={s.side} value={s.side}>{s.name}</option>)}</select><small>{visibleSectors.length} bloków · {totalMatches.toLocaleString('pl-PL')} pasujących miejsc</small></div><Check size={15}/></div>
 {!sector?<><div className="field-label sector-field-label">WYBIERZ SEKTOR <span>{visibleSectors.length} BLOKÓW</span></div>{totalMatches===0&&<p className="search-empty" role="status">Brak miejsc spełniających filtry. Zmień cenę lub trybunę. Każdy blok nadal możesz obejrzeć.</p>}<div className="sector-list">{visibleSectors.map(s=><button key={s.id} className={summaryById.get(s.id)?.matching===0?'no-matches':''} onClick={()=>selectSector(s.id)}><span className="sector-number">{s.id}</span><span className="sector-copy"><b>{s.name}</b><small>{summaryById.get(s.id)?.matching?`${summaryById.get(s.id)!.matching.toLocaleString('pl-PL')} pasuje · od ${summaryById.get(s.id)!.minPrice} zł`:'Brak miejsc spełniających filtry · podgląd'}</small></span><ArrowUpRight size={17}/></button>)}</div>{!unavailable&&<div className="panel-tip"><MousePointer2 size={16}/><span>Możesz też wybrać sektor<br/>bezpośrednio na stadionie.</span></div>}</>:<><div className="sector-selected"><span>Sektor <b>{sector}</b></span><button onClick={overview}>Zmień <ArrowUpRight size={12}/></button></div><label className="field-label" htmlFor="row">RZĄD <span>{row.toString().padStart(2,'0')} / {availableRows.at(-1)}</span></label><input id="row" aria-label="Wybierz rząd" type="range" min={availableRows[0]} max={availableRows.at(-1)} value={row} onChange={e=>{const nextRow=Number(e.target.value);if(nextRow===row&&rowFocused)return;setTour(false);if(surface==='3d'&&!localRenderer)setFlying(true);dispatch({type:'row',row:nextRow})}}/>{surface==='3d'&&!localRenderer&&!unavailable&&<p className="row-results">Suwak ustawia kadr na rzędzie. Przesuń widok dwoma palcami lub Shift + przeciągnij.</p>}<div className="seat-grid" aria-label={`Miejsca w rzędzie ${row}`}>{visibleSeats.map(s=><button key={s.id} className={`${!s.available?'occupied':''} ${matchesSeat(s,filters,eventStatus==='open')?'':'outside-filter'} ${chosen.has(s.id)?'in-basket':''}`} onClick={()=>selectSeat(s)} aria-label={`Miejsce ${s.number}, ${s.available?s.price+' zł':'zajęte, podgląd dostępny'}${chosen.has(s.id)?', w Twoim wyborze':''}`}>{s.number}</button>)}</div><p className="row-results" role="status">{visibleSeats.filter(s=>matchesSeat(s,filters,eventStatus==='open')).length} z {visibleSeats.length} miejsc w rzędzie spełnia filtry. Pozostałe też możesz obejrzeć.</p><div className="seat-legend"><span><i/>Wolne</span><span><i/>Zajęte · podgląd</span><span className="basket-legend"><i/>Twój wybór</span><b>od {sector?getSeat(sector,row,1).price:selectedSector?.price} zł</b></div><p className="select-seat-tip">{unavailable?'Kliknij dowolny fotel, aby sprawdzić dane':'Kliknij dowolny fotel, aby zobaczyć widok'} <ArrowRight size={13}/></p></>}
 </>}</div><div className="panel-footer"><ShieldCheck size={14}/><span>Demo koncepcyjne — dane poglądowe</span></div></aside>
 </section>
 <GroupFinder resolve={resolveCurrent} accept={candidate=>checkAddition(candidate.map(s=>s.id)).ok} ruleKey={`${rulePolicy.eventStatus}:${rulePolicy.preventSingleSeats}`} eventMessage={holdLocked?'Najpierw zwolnij obecną blokadę lub sprawdź jej wynik.':eventMessage} scope={searchScope} scopeLabel={sector?`blok ${sector}`:standName} maxPrice={filters.maxPrice} basket={basket} onPreview={previewFromList} onAdd={addGroup}/>
 <Basket live={liveHold.mode==='service'} locked={holdLocked} seats={basket} message={basketMessage} onRemove={id=>{if(holdLocked)return;cart({type:'remove',id});setBasketMessage('Usunięto miejsce z wyboru.')}} onClear={()=>{if(holdLocked)return;cart({type:'clear'});setBasketMessage('Wyczyszczono wybór.')}} onPreview={previewFromList} onReview={reviewBasket}/>
 <div ref={holdArea} tabIndex={-1}><LiveHoldPanel service={liveHold} seats={basket} avoidSingle={avoidSingles} onPreview={previewFromList} resolve={resolveCurrent}/></div>
 <div className="bottom-bar"><div className="bottom-caption"><span className="mini-plus">+</span><div><b>Najlepsze miejsce? To Twoje.</b><span>Poznaj stadion z zupełnie nowej perspektywy.</span></div></div><button disabled={unavailable} className={`tour-button ${tour?'playing':''}`} onClick={()=>{enter3d();setTour(v=>!v)}}>{tour?<Pause size={13}/>:<Play size={13} fill="currentColor"/>}{tour?'Zatrzymaj wycieczkę':'Zobacz, jak to działa'}<span>24 S</span></button></div>
 </main><footer><span>© 2026 SALESBEYOND</span><span>PROTOTYP DOŚWIADCZENIA KIBICA <span className="footer-dot">·</span> ZBUDOWANY DLA EMOCJI</span><span>POZNAŃ, POLSKA <ArrowUpRight size={11}/></span></footer>
 {(info||review)&&<div className="modal-backdrop" onClick={()=>{setInfo(false);setReview(false)}}><section className="modal" ref={modal} role="dialog" aria-modal="true" aria-labelledby="about-title" onClick={e=>e.stopPropagation()}><button className="close-modal" aria-label="Zamknij" onClick={()=>{setInfo(false);setReview(false)}}><X/></button>{review?<><div className="eyebrow">SALESBEYOND / TWÓJ WYBÓR</div><h2 id="about-title">{basket.length} miejsc.<br/>Wspólne emocje.</h2><p>{basket.map(s=>`${s.sectorId} / rząd ${s.row} / miejsce ${s.number}`).join('; ')}</p><strong className="review-total">Razem {basketTotal(basket)} zł</strong><p>{liveHold.mode==='service'?'To podsumowanie wyboru na planie demo. Dostępność i aktualną cenę potwierdzisz w następnym kroku, przed czasową blokadą. Blokada nie jest zakupem.':'To podsumowanie demonstracyjne. Miejsca nie są blokowane, a dostępność i ceny są poglądowe.'}</p>{liveHold.mode==='service'&&<button className="primary-button" onClick={()=>{setReview(false);requestAnimationFrame(()=>{holdArea.current?.focus({preventScroll:true});holdArea.current?.scrollIntoView({block:'start',behavior:'auto'});});}}>Sprawdź blokadę miejsc <ArrowRight size={16}/></button>}<button className="primary-button" onClick={()=>setReview(false)}>Wróć do wyboru <ArrowRight size={16}/></button></>:<><div className="eyebrow">SALESBEYOND / PROTOTYP</div><h2 id="about-title">Bliżej stadionu.<br/>Bliżej emocji.</h2><p>Moduł „Zobacz widok ze swojego miejsca” dla klubów piłkarskich. Pierwszy scenariusz: Enea Stadion w Poznaniu. Wybierz sektor, rząd i fotel — kamera przeniesie Cię na trybunę.</p><p>Bryła jest uproszczoną interpretacją stadionu. Nazwy sektorów, miejsca, dostępność i ceny są przykładowe. Nie jest to oficjalny produkt klubu. Dokładność wymaga oficjalnych planów i weryfikacji z klubem.</p><button className="primary-button" onClick={()=>setInfo(false)}>Odkrywaj stadion <ArrowRight size={16}/></button></>}</section></div>}
 </div>
}
