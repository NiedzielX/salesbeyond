import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createVenueSession,type ManagedVenue} from './venueSession.ts';
import {initialSelection,selectionReducer,type Selection} from '../domain/selection.ts';
import {getSeat} from '../data/stadium.ts';
import {venueSeatId} from '../data/venueChart.ts';
function deferred<T>(){let resolve!:(value:T)=>void;let reject!:(reason:unknown)=>void;const promise=new Promise<T>((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
const tick=()=>Promise.resolve();
function fixture(){
 let state:Selection=initialSelection;
 const calls:string[]=[],failures:unknown[]=[],cleanupErrors:unknown[]=[];
 const flights:Array<ReturnType<typeof deferred<void>>>=[];
 let losses:(()=>void)|null=null;
 const venue:ManagedVenue={
  focusOverview:()=>{calls.push('overview');},focusSection:id=>{calls.push(`section:${id}`);return true;},focusRow:id=>{calls.push(`row:${id}`);return true;},
  setSelection:ids=>calls.push(`selection:${ids.join(',')}`),
  flyToSeat:id=>{calls.push(`flight:${id}`);const pending=deferred<void>();flights.push(pending);return pending.promise;},
  captureImage:()=>{calls.push('capture');return 'image';},seatViewStop:()=>'seat',
  dispose:()=>{calls.push('dispose');},resize:()=>{calls.push('resize');},
 };
 const deps={
  host:{selection:()=>state,onSector:()=>calls.push('host:sector'),onSeat:()=>calls.push('host:seat'),onOverview:()=>calls.push('host:overview')},revision:0,
  load:async()=>{calls.push('load');return ()=>{calls.push('mount');return venue;};},
  watchContext:(_venue:ManagedVenue,lost:()=>void)=>{calls.push('watch');losses=lost;return()=>{calls.push('unwatch');};},
  observeResize:(_venue:ManagedVenue)=>{calls.push('observe');return()=>{calls.push('disconnect');};},
  onReady:(arrived:boolean)=>{calls.push(`ready:${arrived}`);},onPreview:(url:string|null)=>{calls.push(`preview:${url}`);},
  onUnavailable:(reason:unknown)=>{failures.push(reason);},onCleanupError:(reason:unknown)=>{cleanupErrors.push(reason);},
 };
 return {deps,venue,calls,flights,failures,cleanupErrors,setState:(next:Selection)=>{state=next;},lose:()=>losses?.()};
}
test('StrictMode: anulowane pierwsze uruchomienie nie ładuje ani nie montuje runtime',async()=>{
 const first=fixture(),abandoned=createVenueSession(first.deps);abandoned.dispose();await abandoned.initialized;
 assert.deepEqual(first.calls,[]);
 const second=fixture(),active=createVenueSession(second.deps);await active.initialized;active.dispose();active.dispose();
 assert.equal(second.calls.filter(c=>c==='mount').length,1);assert.equal(second.calls.filter(c=>c==='dispose').length,1);
 assert.deepEqual(second.calls.slice(-3),['disconnect','unwatch','dispose']);
});
test('opóźniony import po unmount nie montuje sceny i nie zgłasza błędu',async()=>{
 const f=fixture(),load=deferred<Awaited<ReturnType<typeof f.deps.load>>>();f.deps.load=()=>load.promise;
 const session=createVenueSession(f.deps);await tick();session.dispose();load.resolve(()=>{f.calls.push('mount');return f.venue;});await session.initialized;
 assert.deepEqual(f.calls,[]);assert.deepEqual(f.failures,[]);
});
test('najnowszy wybór podczas importu jest odtwarzany raz; revision ponawia ten sam fotel',async()=>{
 const f=fixture(),load=deferred<Awaited<ReturnType<typeof f.deps.load>>>();f.deps.load=()=>load.promise;
 const session=createVenueSession(f.deps);
 const sector=selectionReducer(initialSelection,{type:'sector',id:'102'}),seat=selectionReducer(sector,{type:'seat',seat:getSeat('102',6,10)});
 session.update(sector,0);f.setState(seat);session.update(seat,0);
 load.resolve(()=>f.venue);await session.initialized;
 assert.deepEqual(f.calls.filter(c=>c.startsWith('flight:')),[`flight:${venueSeatId(seat.seat!)}`]);
 session.update(seat,0);assert.equal(f.flights.length,1);
 session.update(seat,1);assert.equal(f.flights.length,2);
 session.dispose();f.flights.forEach(flight=>flight.resolve());await tick();assert.ok(!f.calls.includes('capture'));
});
test('remount dachu ma świeżego właściciela i odtwarza bieżący wybór',async()=>{
 const first=fixture(),session=createVenueSession(first.deps);await session.initialized;session.dispose();
 const next=fixture(),sector=selectionReducer(initialSelection,{type:'sector',id:'103'});next.setState(sector);
 const remount=createVenueSession(next.deps);await remount.initialized;
 assert.equal(next.calls.filter(c=>c==='section:103').length,1);assert.ok(!next.calls.includes('overview'));
 remount.dispose();assert.equal(first.calls.filter(c=>c==='dispose').length,1);assert.equal(next.calls.filter(c=>c==='dispose').length,1);
});
test('błędy importu i mount nie publikują gotowości ani nie montują zasobów obserwacji',async()=>{
 for(const phase of ['load','mount']){
  const f=fixture();f.deps.load=async()=>{if(phase==='load')throw new Error('load');return()=>{throw new Error('mount');};};
  const session=createVenueSession(f.deps);await session.initialized;session.dispose();
  assert.equal(f.failures.length,1);assert.ok(!f.calls.some(c=>c.startsWith('ready:')));assert.ok(!f.calls.includes('watch'));
 }
});
test('błąd podłączenia kontekstu lub observera sprząta już utworzone zasoby natychmiast',async()=>{
 for(const phase of ['watch','observe']){
  const f=fixture();
  if(phase==='watch')f.deps.watchContext=()=>{throw new Error('watch');};
  else f.deps.observeResize=()=>{throw new Error('observe');};
  const session=createVenueSession(f.deps);await session.initialized;session.dispose();
  assert.equal(f.failures.length,1);assert.equal(f.calls.filter(c=>c==='dispose').length,1);
  assert.equal(f.calls.filter(c=>c==='unwatch').length,phase==='observe'?1:0);assert.ok(!f.calls.some(c=>c.startsWith('ready:')));
 }
});
test('utrata kontekstu sprząta observer/listener/handle raz i odrzuca stare wyniki',async()=>{
 const f=fixture();const seat=selectionReducer(initialSelection,{type:'seat',seat:getSeat('102',6,10)});f.setState(seat);
 const session=createVenueSession(f.deps);await session.initialized;f.lose();f.lose();session.dispose();
 f.flights[0].resolve();await tick();assert.equal(f.failures.length,1);assert.equal(f.calls.filter(c=>c==='dispose').length,1);
 assert.deepEqual(f.calls.slice(-3),['disconnect','unwatch','dispose']);assert.ok(!f.calls.includes('capture'));
});
test('awaria podczas rejestracji listenera nie pozostawia późno zwróconego cleanupu',async()=>{
 const f=fixture();f.deps.watchContext=(_venue,lost)=>{lost();return()=>{f.calls.push('late-unwatch');};};
 const session=createVenueSession(f.deps);await session.initialized;
 assert.equal(f.failures.length,1);assert.ok(f.calls.includes('late-unwatch'));assert.ok(!f.calls.includes('observe'));assert.equal(f.calls.filter(c=>c==='dispose').length,1);
});
test('wyjątek w cleanupie nie blokuje pozostałego sprzątania',async()=>{
 const f=fixture();f.deps.observeResize=()=>()=>{f.calls.push('disconnect');throw new Error('cleanup');};
 const session=createVenueSession(f.deps);await session.initialized;session.dispose();
 assert.deepEqual(f.calls.slice(-3),['disconnect','unwatch','dispose']);assert.equal(f.cleanupErrors.length,1);
});
test('programowe mount i replay nie dispatchują synchronicznych ech native',async()=>{
 const f=fixture();f.setState(selectionReducer(initialSelection,{type:'seat',seat:getSeat('102',6,10)}));
 f.deps.load=async()=>handlers=>{handlers.onSectionFocusChange(null);handlers.onSeatPick(venueSeatId(getSeat('101',1,1)));return f.venue;};
 const session=createVenueSession(f.deps);await session.initialized;assert.ok(!f.calls.some(c=>c.startsWith('host:')));session.dispose();
});
