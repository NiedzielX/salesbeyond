import { useEffect, useLayoutEffect, useRef, useState, useReducer, useCallback, useMemo, lazy, Suspense } from 'react';
import { ArrowUpRight, ArrowRight, ArrowLeft, ChevronRight, RotateCcw, Play, Pause, Maximize2, Layers3, MousePointer2, MoveUpRight, Check, MapPin, X, Ticket, Eye, Orbit, ShieldCheck } from 'lucide-react';
import './rowCamera.css';
const Stadium=lazy(()=>import('./components/Stadium'));
const LocalVenue=lazy(()=>import('./components/LocalVenue'));
const StadiumMap=lazy(()=>import('./components/StadiumMap'));
import {defaultEvent,eventCatalog,resolveEvent,seatsForEvent,ticketPriceMinor,type DemoEvent} from './data/event';
import {canonicalEventSearch,parseEventRoute} from './domain/eventRoute';
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
import {basketReducer,reconcileBasket,type BasketAction} from './domain/basket';
import {toggleFullscreen} from './components/fullscreen';
import {scheduleTour} from './domain/tour';
import {selectionReducer} from './domain/selection';
import {seatGridTarget} from './domain/seatGridNavigation';
import {createSeatNavigationIndex} from './domain/seatNavigation';
import {sceneTouchControl,type SceneTouchMode} from './domain/sceneTouch';
import {serviceBackedSection} from './domain/inventorySource';
import {normalizeTicketTypeAssignments,selectionPolicyIssue} from './domain/ticketTypes';
import { allSectors, stands, seatsInRow, sectorSeats, sectorRows, rows, type SectorId, type Seat } from './data/stadium';
type ExperienceProps={event:DemoEvent;routeSeatId:string|null;routeRevision:number;routeNotice:string;onEventChange:(eventId:string)=>void;onHoldLock:(locked:boolean)=>void;onRouteSeatChange:(seatId:string|null)=>void};
function EventExperience({event,routeSeatId,routeRevision,routeNotice,onEventChange,onHoldLock,onRouteSeatChange}:ExperienceProps){
 const inventory=useMemo(()=>seatsForEvent(event.id,localRenderer),[event.id]);
 const catalogById=useMemo(()=>new Map(inventory.map(seat=>[seat.id,seat] as const)),[inventory]);
 const resolveCatalog=useCallback((id:string)=>catalogById.get(id)??null,[catalogById]);
 const {initial,notice:sessionNotice,dismiss:dismissSessionNotice,save:saveSession}=useFanSession(event.id,localRenderer,resolveCatalog);
 const [{sector,seat:previewSeat,row,view,rowFocused},dispatch]=useReducer(selectionReducer,initial.selection);
 const appliedRouteRevision=useRef(routeRevision);
 const suppressRouteEcho=useRef(false);
 const [roof,setRoof]=useState(true);const [reset,setReset]=useState(0);const [tour,setTour]=useState(false);const [info,setInfo]=useState(false);const [full,setFull]=useState(false);const [flying,setFlying]=useState(initial.surface==='3d'&&initial.selection.view!=='overview');const container=useRef<HTMLDivElement>(null);const panel=useRef<HTMLDivElement>(null);const modal=useRef<HTMLElement>(null);const viewport=useRef<HTMLDivElement>(null);const seatHeading=useRef<HTMLHeadingElement>(null);const previousSeatButton=useRef<HTMLButtonElement>(null);const nextSeatButton=useRef<HTMLButtonElement>(null);const navigationIntent=useRef<'previous'|'next'|null>(null);
 const [controlMessage,setControlMessage]=useState('');
 const [stand,setStand]=useState(initial.stand);
 const [filters,setFilters]=useState(initial.filters);
 const [avoidSingles,setAvoidSingles]=useState(initial.avoidSingles??false);
 const [surface,setSurface]=useState<'map'|'3d'>(initial.surface);
 const [sceneTouchMode,setSceneTouchMode]=useState<SceneTouchMode>('page');
 const [crowd,setCrowd]=useState(false);
 const seatNavigation=useMemo(()=>createSeatNavigationIndex(inventory),[inventory]);
 const liveHold=useLiveHold(inventory,!localRenderer,undefined,event.id);
 const holdLocked=liveHold.state?.locked??false;
 const eventSwitchLocked=holdLocked||liveHold.mode==='loading'||liveHold.mode==='service'&&!liveHold.state;
 useEffect(()=>onHoldLock(eventSwitchLocked),[eventSwitchLocked,onHoldLock]);
 const holdArea=useRef<HTMLDivElement>(null);
 const ownHold=liveHold.state?.phase==='active'?liveHold.state.hold:null;
 const ownedIds=useMemo(()=>ownHold?ownHold.items.map(s=>s.seatId):[],[ownHold]);
 const sectionInventory=useSectionInventory(inventory,liveHold.mode==='service',sector,ownedIds,`${liveHold.state?.phase??''}:${ownHold?.id??''}`,undefined,event.id);
 const overlays=useMemo(()=>new Map(Object.values(sectionInventory.snapshot.bySection).flatMap(seats=>seats.map(s=>[s.id,s] as const))),[sectionInventory.snapshot]);
 const resolveCurrent=useCallback((id:string)=>overlays.get(id)??resolveCatalog(id),[overlays,resolveCatalog]);
 const seat=useMemo(()=>previewSeat?(overlays.get(previewSeat.id)??previewSeat):null,[previewSeat,overlays]);
 const ruleInventory=useMemo(()=>inventory.map(s=>overlays.get(s.id)??s),[inventory,overlays]);
 const scopeLive=serviceBackedSection(sectionInventory.snapshot,sector);
 const [basket,cart]=useReducer((state:Seat[],action:BasketAction)=>basketReducer(state,action,resolveCurrent),initial.basket);
 const [ticketTypeDraft,setTicketTypeDraft]=useState(initial.ticketTypeBySeat);
 const ticketTypeBySeat=useMemo(()=>normalizeTicketTypeAssignments(event,basket,ticketTypeDraft),[event,basket,ticketTypeDraft]);
 const chosenIds=useMemo(()=>[...new Set([...basket.map(s=>s.id),...ownedIds])],[basket,ownedIds]);
 const chosen=useMemo(()=>new Set(chosenIds),[chosenIds]);const [basketMessage,setBasketMessage]=useState('');
 const [review,setReview]=useState(false);
 const [unavailable,setUnavailable]=useState(false);
 const [seatPreview,setSeatPreview]=useState<{seatId:string;image:string}|null>(null);
 const preview=useCallback((image:string|null)=>setSeatPreview(image&&seat?{seatId:seat.id,image}:null),[seat]);
 const [arrived,setArrived]=useState(false);
 const navigationGenerationRef=useRef(0);
 const [navigationGeneration,setNavigationGeneration]=useState(0);
 const [recenterRequest,setRecenterRequest]=useState<{token:number;seatId:string}|null>(null);
 const [previewRequest,setPreviewRequest]=useState(0);
 const lastFocus=useRef({view,unavailable,previewRequest});
 useEffect(()=>setSceneTouchMode('page'),[surface,view]);
 useEffect(()=>{
  if(appliedRouteRevision.current===routeRevision)return;
  appliedRouteRevision.current=routeRevision;
  const linked=routeSeatId?resolveCatalog(routeSeatId):null;
  const currentSeatId=view==='seat'&&previewSeat?previewSeat.id:null;
  if((linked?.id??null)===currentSeatId)return;
  suppressRouteEcho.current=true;
  dispatch(linked?{type:'seat',seat:linked,canonical:linked}:{type:'reset'});
 },[routeRevision,routeSeatId,resolveCatalog,view,previewSeat]);
 useEffect(()=>{
  if(suppressRouteEcho.current){suppressRouteEcho.current=false;return;}
  const next=selectionUrl(window.location.href,{sector,seat,row,view},event.id,resolveCatalog);
  if(next&&next!==window.location.href){try{window.history.replaceState(null,'',next);}catch{/* The saved local selection remains usable if navigation is restricted. */}}
  onRouteSeatChange(view==='seat'&&seat?seat.id:null);
 },[sector,seat,row,view,event.id,resolveCatalog,onRouteSeatChange]);
 useEffect(()=>saveSession({basket,ticketTypeBySeat,selection:{sector,seat,row,view},filters,stand,surface,avoidSingles}),[basket,ticketTypeBySeat,sector,seat,row,view,filters,stand,surface,avoidSingles,saveSession]);
 const advanceNavigation=useCallback(()=>{const next=navigationGenerationRef.current+1;navigationGenerationRef.current=next;setNavigationGeneration(next);},[]);
 const failScene=useCallback(()=>{advanceNavigation();setUnavailable(true);setSurface('map');setFlying(false);setArrived(false);setTour(false)},[advanceNavigation]);
 const ready=useCallback((generation:number)=>{if(generation!==navigationGenerationRef.current)return;setFlying(false);setArrived(true)},[]);
 const localReady=useCallback((atSeat:boolean)=>{setFlying(false);setArrived(atSeat)},[]);
 const selectSector=(id:SectorId,clickedRow?:number)=>{advanceNavigation();setControlMessage('');setStand(allSectors.find(s=>s.id===id)?.side??0);setTour(false);setFlying(surface==='3d');dispatch({type:'sector',id,row:clickedRow});setReset(r=>r+1);};
 const focusRow=(nextRow:number,force=false)=>{if(nextRow===row&&rowFocused&&!force)return;advanceNavigation();setTour(false);if(surface==='3d'&&!localRenderer)setFlying(true);dispatch({type:'row',row:nextRow});if(force)setReset(value=>value+1);};
 const selectSeat=(s:Seat)=>{advanceNavigation();setControlMessage('');setStand(s.side??0);setTour(false);setFlying(surface==='3d');setArrived(false);dispatch({type:'seat',seat:s,canonical:resolveCatalog(s.id)??undefined});};
 const navigateSeat=(direction:'previous'|'next')=>{if(!seat)return;const target=seatNavigation.neighborsOf(seat.id)[direction];if(!target)return;navigationIntent.current=direction;selectSeat(overlays.get(target.id)??target);};
 const previewFromList=(s:Seat)=>{selectSeat(s);setReset(r=>r+1);setPreviewRequest(r=>r+1);};
 const overview=()=>{advanceNavigation();setControlMessage('');setTour(false);setFlying(surface==='3d');dispatch({type:'reset'});setReset(v=>v+1);};
 const neighbors=seat?seatNavigation.neighborsOf(seat.id):{previous:null,next:null};
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
 useLayoutEffect(()=>{
  const intent=navigationIntent.current;if(!intent||!seat)return;navigationIntent.current=null;
  const same=intent==='previous'?previousSeatButton:nextSeatButton;
  const opposite=intent==='previous'?nextSeatButton:previousSeatButton;
  const sameTarget=intent==='previous'?neighbors.previous:neighbors.next;
  const oppositeTarget=intent==='previous'?neighbors.next:neighbors.previous;
  if(sameTarget)same.current?.focus({preventScroll:true});
  else if(oppositeTarget)opposite.current?.focus({preventScroll:true});
  else seatHeading.current?.focus({preventScroll:true});
 },[seat?.id]);
 useEffect(()=>{if(!tour)return;advanceNavigation();dispatch({type:'reset'});setFlying(true);setReset(r=>r+1);return scheduleTour(action=>{advanceNavigation();dispatch(action);setFlying(true)},()=>setTour(false))},[tour,advanceNavigation]);
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
 const eventStatus=sectionInventory.eventStatus&&sectionInventory.eventStatus!=='open'?'closed':event.status;
 const rulePolicy=useMemo(()=>({preventSingleSeats:event.preventSingleSeats||avoidSingles,eventStatus,limit:event.selectionPolicy.maxSeats}),[avoidSingles,eventStatus,event.preventSingleSeats,event.selectionPolicy.maxSeats]);

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
 const policyIssue=selectionPolicyIssue(event,basket.length);if(policyIssue==='below_minimum'){const message=`To wydarzenie wymaga co najmniej ${event.selectionPolicy.minSeats} miejsc.`;setBasketMessage(message);setControlMessage(message);return;}
 setTour(false);setInfo(false);setReview(true);
 }
 function enter3d(){if(unavailable||surface==='3d')return;advanceNavigation();setSurface('3d');setArrived(false);setFlying(true);setReset(v=>v+1);}
 async function fullscreen(){setTour(false);const success=await toggleFullscreen(document,container.current);setControlMessage(success?'':'Pełny ekran jest niedostępny w tej przeglądarce.');}
 const selectedSector=allSectors.find(s=>s.id===sector);
 const activeStand=selectedSector?.side??stand;
 const standName=stands.find(s=>s.side===activeStand)?.name??'Cały stadion';
 const visibleSectors=useMemo(()=>searchSectors(activeStand,localRenderer),[activeStand]);
 const summaries=useMemo(()=>summarizeSeats(visibleSectors.map(s=>s.id),filters,eventStatus==='open',id=>sectorSeats(id).map(s=>overlays.get(s.id)??resolveCatalog(s.id)??s)),[visibleSectors,filters,overlays,resolveCatalog,eventStatus]);
 const summaryById=new Map(summaries.map(s=>[s.id,s]));
 const totalMatches=summaries.reduce((sum,s)=>sum+s.matching,0);
 const searchScope=groupSearchScope(sector,visibleSectors);
 const filterSummaries=sector?summaries.filter(s=>s.id===sector):summaries;
 const filterTotals=filterSummaries.reduce((sum,s)=>({matching:sum.matching+s.matching,total:sum.total+s.total}),{matching:0,total:0});
 const availableRows=sector?sectorRows(sector):Array.from({length:rows},(_,i)=>i+1);
 const liveSeat=seat?overlays.get(seat.id):null;
 const seatAvailability=liveSeat?.ownedHold?'Twoja czasowa blokada':liveSeat?.inventoryStatus==='held'?'Czasowo zablokowane · podgląd dostępny':seat?.available?(liveSeat?'Wolne · stan z usługi demo':'Miejsce wolne · katalog demonstracyjny'):'Niedostępne · podgląd perspektywy';
 const visibleSeats=sector?seatsInRow(sector,row).map(s=>overlays.get(s.id)??resolveCatalog(s.id)??s):[];
 const seatGridTabId=visibleSeats.some(candidate=>candidate.id===seat?.id)?seat!.id:visibleSeats[0]?.id;
 const touchControl=sceneTouchControl(sceneTouchMode);
 const demoTotalMinor=basket.reduce((sum,item)=>sum+ticketPriceMinor(event,item,ticketTypeBySeat[item.id]),0);
 return <div className="app" ref={container}>
 <header className="header"><a className="wordmark" href="./" aria-label="SalesBeyond — strona główna"><span className="brand-symbol">s<span>↗</span></span>salesbeyond<span className="brand-period">.</span></a><span className="header-divider"/><span className="header-project">DLA KLUBÓW PIŁKARSKICH</span><nav><button onClick={()=>{setTour(false);setInfo(true)}}>O projekcie <ArrowUpRight size={14}/></button><span className="demo-pill"><i/> INTERAKTYWNE DEMO</span></nav></header>
 <main>
 <div className="intro"><div className="intro-copy"><div className="eyebrow"><span/> PIERWSZY SCENARIUSZ · POZNAŃ</div><h1>Twoje miejsce.<br/><span>Twoja perspektywa.</span></h1><p>Poczuj atmosferę, zanim wejdziesz na trybuny.<br/>Odkryj stadion i zobacz widok ze swojego miejsca.</p></div><div className="intro-meta"><div className="stadium-mark"><span>1922</span><b>POZNAŃ</b><span>STADION</span></div><div><span className="small-label">KONCEPCJA DOŚWIADCZENIA KIBICA</span><strong>{clubProfile.name}</strong><span className="location"><MapPin size={12}/> 52°23′52″N 16°51′29″E</span></div></div></div>
 {(sessionNotice||routeNotice)&&<div className="session-notice" role="status"><span>{routeNotice||sessionNotice}</span>{sessionNotice&&!routeNotice&&<button aria-label="Zamknij informację o zapisanym wyborze" onClick={dismissSessionNotice}><X size={14}/></button>}</div>}
 <section className="event-chooser" aria-labelledby="event-chooser-title"><div className="event-chooser-copy"><span id="event-chooser-title">WYBIERZ WYDARZENIE</span><strong>{event.title}</strong><small>{event.dateLabel} · DANE DEMONSTRACYJNE</small></div><div className="event-options" role="radiogroup" aria-label="Wydarzenie demonstracyjne">{eventCatalog.map(option=><button key={option.id} type="button" role="radio" tabIndex={option.id===event.id?0:-1} aria-checked={option.id===event.id} disabled={(eventSwitchLocked||localRenderer)&&option.id!==event.id} title={localRenderer&&option.id!==event.id?'Historyczny renderer obsługuje domyślne wydarzenie.':undefined} onClick={()=>onEventChange(option.id)}><span><i className={option.status==='open'?'open':'closed'}/>{eventSelectionLabel(option.status)}</span><b>{option.title}</b><small>{option.dateLabel}</small></button>)}</div></section>
 <div className="event-context"><span><i className={eventStatus==='open'?'open':'closed'}/>{eventSelectionLabel(eventStatus)}</span><strong>{event.title}</strong><small>CENY KATALOGOWE DEMO · {event.currency}</small></div>{holdLocked&&<p className="search-empty" role="status">Zwolnij lub zakończ aktywną blokadę, aby zmienić wydarzenie.</p>}{eventMessage&&<p className="search-empty" role="status">{eventMessage}</p>}
 <SeatFilters liveScope={scopeLive} avoidSingles={avoidSingles} onAvoidSingles={setAvoidSingles} filters={filters} matching={filterTotals.matching} total={filterTotals.total} scope={sector?`Blok ${sector}`:standName} onChange={setFilters}/>
 {liveHold.mode==='service'&&sector&&<div className="inventory-status" role="status"><span>{sectionInventory.error?'Aktualizacja dostępności nie powiodła się — potwierdź miejsca ponownie przed blokadą.':sectionInventory.loading?'Sprawdzam bieżącą dostępność bloku…':sectionInventory.updatedAt?`Blok ${sector} · dostępność z usługi demo · aktualizacja co 15 sekund`:'Dostępność bloku czeka na sprawdzenie.'}</span><button disabled={sectionInventory.loading} onClick={sectionInventory.refresh}>Odśwież dostępność</button></div>}
 <div className="crowd-controls" role="group" aria-label="Symulowana widownia"><div><strong>Symulacja widowni</strong><span>Porównaj perspektywę na pustej i pełnej trybunie.</span></div><div className="crowd-toggle">{[{value:false,label:'Puste trybuny'},{value:true,label:'Z kibicami'}].map(option=><button key={option.label} aria-pressed={crowd===option.value} disabled={surface!=='3d'||unavailable||localRenderer} onClick={()=>{setTour(false);setCrowd(option.value)}}>{option.label}</button>)}</div><small>{surface!=='3d'?'Przejdź do stadionu 3D, aby porównać widownię.':unavailable||localRenderer?'Symulacja widowni jest niedostępna w tym widoku.':'Poglądowe sylwetki · niezależne od dostępności biletów.'}</small></div>
 <section className="experience" aria-label="Interaktywny wybór miejsca na stadionie">
 <div className="viewport" ref={viewport}><div className="viewport-heading"><span className="live-dot"/>{surface==='map'?'PLAN STADIONU 2D':view==='overview'?'ODKRYWAJ STADION':view==='sector'?`${standName.toUpperCase()} / ${sector}`:unavailable?'PODGLĄD NIEDOSTĘPNY':flying?'PRZELOT DO MIEJSCA':localRenderer&&!arrived?'WYBRANE MIEJSCE':'TWÓJ WIDOK Z MIEJSCA'}<span className="render-badge">{surface==='map'?'PLAN 2D':unavailable?'BRAK 3D':'LIVE 3D'}</span></div>
 <div className={`scene ${touchControl.className}`} onPointerDown={()=>setTour(false)} onWheel={()=>setTour(false)}><>{surface==='map'?<Suspense fallback={<div className="scene-loading" role="status">Przygotowujemy plan stadionu…</div>}><StadiumMap focusRequest={previewRequest} inventory={overlays} chosenIds={chosenIds} sector={sector} seat={seat} row={row} legacyOnly={localRenderer} onSector={selectSector} onSeat={selectSeat} onOverview={overview}/></Suspense>:unavailable?<div className="webgl-error" role="alert">Podgląd 3D jest niedostępny.<br/>Odśwież stronę, aby spróbować ponownie.<br/>Dane miejsc nadal możesz sprawdzić w panelu.</div>:<Suspense fallback={<div className="scene-loading" role="status">Przygotowujemy Twój widok stadionu…</div>}>{localRenderer?<LocalVenue sector={sector} seat={seat} row={row} view={view} roof={roof} reset={reset} onSector={selectSector} onSeat={selectSeat} onOverview={overview} onReady={localReady} onUnavailable={failScene} onPreview={preview}/>:<Stadium crowd={crowd} inventory={overlays} rowFocused={rowFocused??false} chosenIds={chosenIds} sector={sector} seat={seat} row={row} flying={flying} navigationGeneration={navigationGeneration} view={view} roof={roof} reset={reset} recenterRequest={recenterRequest} onSector={selectSector} onSeat={selectSeat} onReady={ready} onUnavailable={failScene} onPreview={preview}/>}</Suspense>}</></div>
 <button className="mobile-touch-mode" aria-pressed={touchControl.pressed} onClick={()=>{const next=sceneTouchMode==='page'?'scene':'page';setSceneTouchMode(next);setControlMessage(next==='scene'?'Gesty sterują teraz stadionem. Naciśnij ponownie „Sterowanie sceną”, aby wrócić do przewijania.':'Pionowy gest przewija teraz stronę.');}}>{touchControl.label}</button>
 <div className="scene-top-right"><button title={roof?'Ukryj dach':'Pokaż dach'} aria-label={roof?'Ukryj dach':'Pokaż dach'} aria-pressed={roof} disabled={unavailable||surface==='map'} onClick={()=>{setTour(false);setRoof(v=>!v)}}><Layers3 size={17}/></button><button title="Pełny ekran" aria-pressed={full} onClick={fullscreen}><Maximize2 size={17}/></button></div>
 <div className="surface-switch" aria-label="Sposób oglądania stadionu"><button aria-pressed={surface==='map'} onClick={()=>{advanceNavigation();setTour(false);setFlying(false);setArrived(false);setSurface('map')}}>Plan 2D</button><button aria-pressed={surface==='3d'} disabled={unavailable} title={unavailable?'3D niedostępne — plan 2D pozostaje aktywny':'Otwórz stadion 3D'} onClick={()=>{setTour(false);enter3d()}}>Stadion 3D</button></div>{unavailable&&<div className="map-fallback" role="status">3D jest niedostępne. Wybierz dowolny fotel na planie 2D.</div>}
 <div className="control-message" role="status">{controlMessage||(roof&&view!=='overview'&&surface==='3d'&&!localRenderer?'Przekrój dachu przy wybranej trybunie':'')}</div><div className="scene-bottom"><div className="scene-controls"><button onClick={overview} title="Przywróć widok stadionu"><RotateCcw size={16}/></button><div className="controls-divider"/><MousePointer2 size={14}/><span>{surface==='map'?'Przeciągnij, aby przesunąć plan':unavailable?'Podgląd 3D niedostępny':view==='seat'?'Przeciągnij, aby rozejrzeć się':'Przeciągnij, aby obrócić'}</span><span hidden={unavailable||surface==='map'} className="scroll-hint">{view==='seat'?'· Stały punkt widzenia':view==='sector'&&!localRenderer?'· Shift + przeciągnij: przesuń · Scroll: przybliż':'· Scroll, aby przybliżyć'}</span></div><div className="compass"><span>{surface==='map'?'2D':'3D'}</span><MoveUpRight size={20}/></div></div>
 {view==='overview'&&surface==='3d'&&!unavailable&&<div className="scene-hint"><span className="hint-orbit"><Orbit size={16}/></span>Wybierz niebieski sektor, aby wejść na trybunę<ArrowUpRight size={14}/></div>}
 {tour&&<div className="tour-indicator"><span/> TRWA WYCIECZKA <button onClick={()=>setTour(false)}>Zatrzymaj <Pause size={12}/></button></div>}
 </div>
 <aside className="selection"><div className="steps">{['Stadion','Sektor','Miejsce'].map((label,i)=><div key={label} className={(view==='overview'?0:view==='sector'?1:2)>=i?'done':''}><span>{(view==='overview'?0:view==='sector'?1:2)>i?<Check size={11}/>:i+1}</span>{label}{i<2&&<ChevronRight size={12}/>}</div>)}</div>
 <span className="sr-only" aria-live="polite" aria-atomic="true">{seat?`Sektor ${seat.sectorId}, rząd ${seat.row}, miejsce ${seat.number}.`:''}</span>
 {view==='seat'&&seat&&<div className="seat-navigation-shell"><h3 className="sr-only" ref={seatHeading} tabIndex={-1}>Nawigacja miejsca {seat.number}</h3><div className="seat-navigation" role="group" aria-label="Porównaj miejsca w tym odcinku rzędu"><button ref={previousSeatButton} type="button" disabled={!neighbors.previous} onClick={()=>navigateSeat('previous')}><ArrowLeft size={15}/><span>Poprzednie</span></button><span className="seat-recenter-slot">{surface==='3d'&&!unavailable&&!localRenderer&&<button type="button" disabled={flying||!arrived} onClick={()=>setRecenterRequest(current=>({token:(current?.token??0)+1,seatId:seat.id}))}><RotateCcw size={15}/><span>Na boisko</span></button>}</span><button ref={nextSeatButton} type="button" disabled={!neighbors.next} onClick={()=>navigateSeat('next')}><span>Następne</span><ArrowRight size={15}/></button></div></div>}
 <div className="panel-content" ref={panel} tabIndex={-1} aria-label="Wybór i podsumowanie miejsca">{view==='seat'&&seat?<><div className="panel-eyebrow">WŁAŚNIE TUTAJ MOŻESZ BYĆ</div><h2>Dobry widok.{' '}<br/>Wielkie emocje.</h2><p className="panel-description">{surface==='map'?'Wybrano fotel na planie 2D. Możesz zmienić wybór lub otworzyć perspektywę 3D.':unavailable?'Wybrano miejsce. Podgląd 3D jest obecnie niedostępny.':<>Spójrz na boisko z perspektywy<br/>wybranego miejsca.</>}</p><div className="ticket"><div className="ticket-head"><Ticket size={20}/><span>TWOJE MIEJSCE <small>DEMO</small></span><Check size={16}/></div>{seatPreview?.seatId===seat.id&&surface==='3d'&&!flying&&arrived&&!unavailable&&<figure className="ticket-preview"><img src={seatPreview.image} alt={`Poglądowy widok 3D z sektora ${seat.sectorId}, rzędu ${seat.row}, miejsca ${seat.number}`}/><figcaption>Twoja perspektywa · geometria 3D</figcaption></figure>}<strong>{seat.standId}</strong><div className="ticket-availability">{seatAvailability}</div><div className="ticket-data"><div><small>SEKTOR</small><b>{seat.sectorId}</b></div><div><small>RZĄD</small><b>{seat.row.toString().padStart(2,'0')}</b></div><div><small>MIEJSCE</small><b>{seat.number.toString().padStart(2,'0')}</b></div></div><div className="ticket-price"><span>{liveSeat?'Cena z usługi demo':'Cena katalogowa demo'}</span><strong>{seat.price}<small> zł</small></strong></div></div><button className="primary-button add-to-basket" disabled={holdLocked||!seat.available||!!eventMessage&&!basket.some(s=>s.id===seat.id)||basket.length>=event.selectionPolicy.maxSeats&&!basket.some(s=>s.id===seat.id)} onClick={addSeat}><Ticket size={16}/>{!seat.available?'Zajęte — dostępny podgląd':basket.some(s=>s.id===seat.id)?'Usuń z wyboru':eventMessage?eventSelectionLabel(eventStatus):basket.length>=event.selectionPolicy.maxSeats?`Osiągnięto limit ${event.selectionPolicy.maxSeats} miejsc`:'Dodaj do wyboru'}</button><SeatShare key={`${event.id}:${seat.id}`} id={seat.id} legacyOnly={localRenderer} eventId={event.id} resolve={resolveCatalog}/>{surface==='map'&&!unavailable&&<button className="primary-button view-seat-3d" onClick={enter3d}><Eye size={16}/> Zobacz z tego miejsca w 3D</button>}<button className="primary-button" onClick={()=>{advanceNavigation();dispatch({type:'back'});setFlying(surface==='3d');setTour(false)}}><ArrowLeft size={16}/> Wybierz inne miejsce</button><div className="seat-note" aria-live="polite"><Eye size={14}/>{surface==='map'?'Wybrano na planie 2D':unavailable?'Podgląd 3D niedostępny':flying?'Trwa przelot do Twojego miejsca…':localRenderer&&!arrived?'Przelot przerwany — wybrane miejsce zachowane':'Perspektywa z geometrii 3D'}</div>{localRenderer&&surface==='3d'&&!unavailable&&!flying&&!arrived&&<button className="retry-view" onClick={()=>{setTour(false);setFlying(true);setReset(value=>value+1)}}>Zobacz ponownie z tego miejsca <Eye size={13}/></button>}</>:<><div className="panel-eyebrow">TWÓJ MECZ ZACZYNA SIĘ TUTAJ</div><h2>{sector?'Znajdź swój':'Gdzie chcesz'}{' '}<br/>{sector?'punkt widzenia.':'poczuć emocje?'}</h2><p className="panel-description">{unavailable?'Plan 2D pozostaje dostępny. Wybierz trybunę, sektor i dowolny fotel.':sector?'Wybierz rząd i dowolny fotel. Możesz obejrzeć perspektywę także zajętego miejsca.':'Wybierz trybunę i sektor. Każdy fotel w modelu ma własną perspektywę.'}</p>
 <label className="field-label" htmlFor="stand">TRYBUNA <span>{localRenderer?1:4} TRYBUNY</span></label><div className="stand-field"><span className="stand-icon"><Layers3 size={18}/></span><div><select id="stand" value={activeStand} onChange={e=>{overview();setStand(Number(e.target.value))}}><option value={-1}>Cały stadion</option>{stands.filter(s=>!localRenderer||s.side===0).map(s=><option key={s.side} value={s.side}>{s.name}</option>)}</select><small>{visibleSectors.length} bloków · {totalMatches.toLocaleString('pl-PL')} pasujących miejsc</small></div><Check size={15}/></div>
 {!sector?<><div className="field-label sector-field-label">WYBIERZ SEKTOR <span>{visibleSectors.length} BLOKÓW</span></div>{totalMatches===0&&<p className="search-empty" role="status">Brak miejsc spełniających filtry. Zmień cenę lub trybunę. Każdy blok nadal możesz obejrzeć.</p>}<div className="sector-list">{visibleSectors.map(s=><button key={s.id} className={summaryById.get(s.id)?.matching===0?'no-matches':''} onClick={()=>selectSector(s.id)}><span className="sector-number">{s.id}</span><span className="sector-copy"><b>{s.name}</b><small>{summaryById.get(s.id)?.matching?`${summaryById.get(s.id)!.matching.toLocaleString('pl-PL')} pasuje · od ${summaryById.get(s.id)!.minPrice} zł`:'Brak miejsc spełniających filtry · podgląd'}</small></span><ArrowUpRight size={17}/></button>)}</div>{!unavailable&&<div className="panel-tip"><MousePointer2 size={16}/><span>Możesz też wybrać sektor<br/>bezpośrednio na stadionie.</span></div>}</>:<><div className="sector-selected"><span>Sektor <b>{sector}</b></span><button onClick={overview}>Zmień <ArrowUpRight size={12}/></button></div><label className="field-label" htmlFor="row">RZĄD <span>{row.toString().padStart(2,'0')} / {availableRows.at(-1)}</span></label><input id="row" aria-label="Wybierz rząd" type="range" min={availableRows[0]} max={availableRows.at(-1)} value={row} onChange={e=>focusRow(Number(e.target.value))}/>{surface==='3d'&&!localRenderer&&!unavailable&&<div className="row-camera-controls"><button type="button" onClick={()=>focusRow(row,true)}>Pokaż rząd {row.toString().padStart(2,'0')} w 3D</button><span>Przesuń widok dwoma palcami lub Shift + przeciągnij.</span></div>}<div className="seat-grid" role="group" aria-label={`Miejsca w rzędzie ${row}`}>{visibleSeats.map((s,index)=><button key={s.id} tabIndex={s.id===seatGridTabId?0:-1} className={`${!s.available?'occupied':''} ${matchesSeat(s,filters,eventStatus==='open')?'':'outside-filter'} ${chosen.has(s.id)?'in-basket':''}`} onKeyDown={event=>{const target=seatGridTarget(visibleSeats.length,index,event.key);if(target===null)return;event.preventDefault();event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button')[target]?.focus();}} onClick={()=>selectSeat(s)} aria-label={`Miejsce ${s.number}, ${s.available?s.price+' zł':'zajęte, podgląd dostępny'}${chosen.has(s.id)?', w Twoim wyborze':''}`}>{s.number}</button>)}</div><p className="row-results" role="status">{visibleSeats.filter(s=>matchesSeat(s,filters,eventStatus==='open')).length} z {visibleSeats.length} miejsc w rzędzie spełnia filtry. Pozostałe też możesz obejrzeć.</p><div className="seat-legend"><span><i/>Wolne</span><span><i/>Zajęte · podgląd</span><span className="basket-legend"><i/>Twój wybór</span><b>od {visibleSeats[0]?.price??selectedSector?.price} zł</b></div><p className="select-seat-tip">{unavailable?'Kliknij dowolny fotel, aby sprawdzić dane':'Kliknij dowolny fotel, aby zobaczyć widok'} <ArrowRight size={13}/></p></>}
 </>}</div><div className="panel-footer"><ShieldCheck size={14}/><span>Demo koncepcyjne — dane poglądowe</span></div></aside>
 </section>
 <GroupFinder resolve={resolveCurrent} accept={candidate=>checkAddition(candidate.map(s=>s.id)).ok} ruleKey={`${rulePolicy.eventStatus}:${rulePolicy.preventSingleSeats}`} eventMessage={holdLocked?'Najpierw zwolnij obecną blokadę lub sprawdź jej wynik.':eventMessage} scope={searchScope} scopeLabel={sector?`blok ${sector}`:standName} maxPrice={filters.maxPrice} basket={basket} onPreview={previewFromList} onAdd={addGroup}/>
 <Basket event={event} live={liveHold.mode==='service'} locked={holdLocked} seats={basket} ticketTypeBySeat={ticketTypeBySeat} message={basketMessage} onTicketType={(seatId,ticketTypeId)=>{if(holdLocked)return;setTicketTypeDraft(current=>({...current,[seatId]:ticketTypeId}));setBasketMessage('Zmieniono rodzaj biletu. Sprawdź cenę ponownie.')}} onRemove={id=>{if(holdLocked)return;cart({type:'remove',id});setBasketMessage('Usunięto miejsce z wyboru.')}} onClear={()=>{if(holdLocked)return;cart({type:'clear'});setBasketMessage('Wyczyszczono wybór.')}} onPreview={previewFromList} onReview={reviewBasket}/>
 <div ref={holdArea} tabIndex={-1}><LiveHoldPanel service={liveHold} seats={basket} avoidSingle={avoidSingles} onPreview={previewFromList} resolve={resolveCurrent}/></div>
 <div className="bottom-bar"><div className="bottom-caption"><span className="mini-plus">+</span><div><b>Najlepsze miejsce? To Twoje.</b><span>Poznaj stadion z zupełnie nowej perspektywy.</span></div></div><button disabled={unavailable} className={`tour-button ${tour?'playing':''}`} onClick={()=>{enter3d();setTour(v=>!v)}}>{tour?<Pause size={13}/>:<Play size={13} fill="currentColor"/>}{tour?'Zatrzymaj wycieczkę':'Zobacz, jak to działa'}<span>24 S</span></button></div>
 </main><footer><span>© 2026 SALESBEYOND</span><span>PROTOTYP DOŚWIADCZENIA KIBICA <span className="footer-dot">·</span> ZBUDOWANY DLA EMOCJI</span><span>POZNAŃ, POLSKA <ArrowUpRight size={11}/></span></footer>
 {(info||review)&&<div className="modal-backdrop" onClick={()=>{setInfo(false);setReview(false)}}><section className="modal" ref={modal} role="dialog" aria-modal="true" aria-labelledby="about-title" onClick={e=>e.stopPropagation()}><button className="close-modal" aria-label="Zamknij" onClick={()=>{setInfo(false);setReview(false)}}><X/></button>{review?<><div className="eyebrow">SALESBEYOND / TWÓJ WYBÓR</div><h2 id="about-title">{basket.length} miejsc.<br/>Wspólne emocje.</h2><p>{basket.map(s=>`${s.sectorId} / rząd ${s.row} / miejsce ${s.number}`).join('; ')}</p><strong className="review-total">Razem demo {(demoTotalMinor/100).toLocaleString('pl-PL',{style:'currency',currency:event.currency})}</strong><p>{liveHold.mode==='service'?'To podsumowanie wyboru na planie demo. Dostępność i aktualną cenę potwierdzisz w następnym kroku, przed czasową blokadą. Blokada nie jest zakupem.':'To podsumowanie demonstracyjne. Miejsca nie są blokowane, a dostępność i ceny są poglądowe.'}</p>{liveHold.mode==='service'&&<button className="primary-button" onClick={()=>{setReview(false);requestAnimationFrame(()=>{holdArea.current?.focus({preventScroll:true});holdArea.current?.scrollIntoView({block:'start',behavior:'auto'});});}}>Sprawdź blokadę miejsc <ArrowRight size={16}/></button>}<button className="primary-button" onClick={()=>setReview(false)}>Wróć do wyboru <ArrowRight size={16}/></button></>:<><div className="eyebrow">SALESBEYOND / PROTOTYP</div><h2 id="about-title">Bliżej stadionu.<br/>Bliżej emocji.</h2><p>Moduł „Zobacz widok ze swojego miejsca” dla klubów piłkarskich. Pierwszy scenariusz: Enea Stadion w Poznaniu. Wybierz sektor, rząd i fotel — kamera przeniesie Cię na trybunę.</p><p>Bryła jest uproszczoną interpretacją stadionu. Nazwy sektorów, miejsca, dostępność i ceny są przykładowe. Nie jest to oficjalny produkt klubu. Dokładność wymaga oficjalnych planów i weryfikacji z klubem.</p><button className="primary-button" onClick={()=>setInfo(false)}>Odkrywaj stadion <ArrowRight size={16}/></button></>}</section></div>}
 </div>
}

const routeNoticeMessage=(notice:ReturnType<typeof parseEventRoute>['notice'])=>notice==='unknown-event'?'Nie znaleźliśmy tego wydarzenia. Otwieramy domyślne demo.':notice==='invalid-seat'?'Link wskazuje nieznane miejsce. Możesz wybrać dowolny fotel.':notice==='legacy-event'?'Historyczny widok działa tylko dla domyślnego wydarzenia. Otwieramy bezpieczny katalog demo.':'';

function readEventRoute(){
 const parsed=parseEventRoute(window.location.search,{
  defaultEventId:defaultEvent.id,
  isKnownEvent:id=>eventCatalog.some(event=>event.id===id),
  isValidSeat:(eventId,seatId,legacyOnly)=>seatsForEvent(eventId,legacyOnly).some(seat=>seat.id===seatId),
 });
 if(parsed.renderer==='local')return parsed;
 try{
  const holdEvent=eventCatalog.find(event=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(window.localStorage.getItem(`salesbeyond:seat-hold:${event.id}`)??''));
  if(holdEvent&&holdEvent.id!==parsed.eventId){
   const canonicalSearch=canonicalEventSearch({eventId:holdEvent.id,seatId:null,renderer:'webgl'});
   return {...parsed,eventId:holdEvent.id,seatId:null,canonicalSearch,storedHoldRedirect:true} as typeof parsed&{storedHoldRedirect:true};
  }
 }catch{/* A denied storage API cannot weaken server-side hold ownership or validation. */}
 return parsed;
}

export default function App(){
 const [route,setRoute]=useState(readEventRoute);
 const [routeRevision,setRouteRevision]=useState(0);
 const [notice,setNotice]=useState(()=>('storedHoldRedirect'in route)?'Wróciliśmy do wydarzenia z zapisaną blokadą. Sprawdzamy jej aktualny stan.':routeNoticeMessage(route.notice));
 const [switchLocked,setSwitchLocked]=useState(false);
 const acceptedSeatRef=useRef(route.seatId);
 const event=resolveEvent(route.eventId);
 const canonicalFor=(eventId:string,seatId:string|null=null)=>canonicalEventSearch({eventId,seatId,renderer:localRenderer?'local':'webgl'});

 useEffect(()=>{
  if(window.location.search!==route.canonicalSearch)window.history.replaceState(null,'',route.canonicalSearch);
 },[]);

 const changeEvent=useCallback((eventId:string)=>{
  if(eventId===route.eventId)return;
  if(localRenderer){setNotice('Historyczny renderer obsługuje wyłącznie domyślne wydarzenie.');return;}
  if(switchLocked){setNotice('Najpierw zwolnij lub zakończ aktywną blokadę miejsc.');return;}
  const next=readEventRoute();
  const nextSearch=canonicalFor(eventId);
  window.history.pushState(null,'',nextSearch);
  acceptedSeatRef.current=null;
  setRoute({...next,eventId,seatId:null,notice:null,canonicalSearch:nextSearch});
  setNotice('');
 },[route.eventId,switchLocked]);

 useEffect(()=>{
  const onPopState=()=>{
   const next=readEventRoute();
   if(switchLocked&&next.eventId!==route.eventId){
    const restored=canonicalFor(route.eventId,acceptedSeatRef.current);
    window.history.replaceState(null,'',restored);
    setNotice('Aktywna blokada miejsc pozostaje przy bieżącym wydarzeniu. Zwolnij ją przed zmianą.');
    return;
   }
   if(next.canonicalSearch!==window.location.search)window.history.replaceState(null,'',next.canonicalSearch);
   acceptedSeatRef.current=next.seatId;
   setRoute(next);setRouteRevision(value=>value+1);setNotice(routeNoticeMessage(next.notice));
  };
  window.addEventListener('popstate',onPopState);
  return()=>window.removeEventListener('popstate',onPopState);
 },[route.eventId,switchLocked]);

 const updateHoldLock=useCallback((locked:boolean)=>setSwitchLocked(locked),[]);
 const updateAcceptedSeat=useCallback((seatId:string|null)=>{acceptedSeatRef.current=seatId;},[]);
 return <EventExperience key={event.id} event={event} routeSeatId={route.seatId} routeRevision={routeRevision} routeNotice={notice} onEventChange={changeEvent} onHoldLock={updateHoldLock} onRouteSeatChange={updateAcceptedSeat}/>;
}
