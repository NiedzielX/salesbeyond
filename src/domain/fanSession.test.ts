import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshFanState,decodeFanSession,encodeFanSession,fanSessionKey,readFanSession,saveFanSession,applySeatLink,seatLink,selectionUrl,type FanStorage} from './fanSession.ts';
import {canonicalBasket,reconcileBasket,basketReducer} from './basket.ts';
import {stadiumSeats,sectorSeats,resolveSeat} from '../data/stadium.ts';
import {selectionReducer,initialSelection} from './selection.ts';
const all=stadiumSeats(),free=all.filter(s=>s.available),taken=all.find(s=>!s.available)!;
function memoryStorage(){const data=new Map<string,string>();return {getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value);}} satisfies FanStorage;}

test('powrót odtwarza kanoniczny koszyk, filtry i podgląd, zapis zawiera wyłącznie ID/preferencje',()=>{
 const state=freshFanState();state.basket=free.slice(0,10);state.selection=selectionReducer(initialSelection,{type:'seat',seat:taken});state.filters={maxPrice:75,availableOnly:false};state.stand=2;state.surface='map';
 const raw=encodeFanSession(state),doc=JSON.parse(raw),restored=decodeFanSession(raw);
 assert.deepEqual(restored.state,state);assert.equal(restored.restored,true);assert.equal(restored.discarded,0);
 assert.deepEqual(doc.cart,state.basket.map(s=>s.id));assert.ok(!raw.includes('position'));assert.ok(!raw.includes('available"'));assert.ok(!raw.includes('price"'));assert.ok(!raw.includes('image'));
 assert.equal(restored.state.selection.seat?.available,false,'zajęty fotel nadal można obejrzeć');
 const changedPrice=state.basket.map(s=>({...s,price:1,position:[999,999,999] as [number,number,number]}));
 assert.deepEqual(decodeFanSession(encodeFanSession({...state,basket:changedPrice})).state.basket,state.basket);
});
test('nieznane/zajęte ID, duplikaty i nadmiar są odrzucane, obce warianty nie mieszają katalogów',()=>{
 const doc=JSON.parse(encodeFanSession(freshFanState()));doc.cart=[free[0].id,free[0].id,'unknown',taken.id,{},...free.slice(1,13).map(s=>s.id)];
 const result=decodeFanSession(JSON.stringify(doc));assert.equal(result.state.basket.length,10);assert.equal(new Set(result.state.basket.map(s=>s.id)).size,10);assert.equal(result.discarded,doc.cart.length-result.state.basket.length);
 assert.equal(decodeFanSession(JSON.stringify(doc),true).invalid,true);
 const legacy=freshFanState();legacy.basket=[free[0],all.find(s=>s.sectorId==='III-2'&&s.available)!];
 const parsed=decodeFanSession(encodeFanSession(legacy,true),true);assert.equal(parsed.state.basket.length,1);assert.equal(parsed.discarded,1);
 assert.notEqual(fanSessionKey(),fanSessionKey(true));
});
test('uszkodzony zapis, nieznana wersja i błędne preferencje mają bezpieczne wartości domyślne',()=>{
 for(const raw of ['{','null','[]','"x"','x'.repeat(16001),JSON.stringify({version:2,scope:'full',cart:[]}),JSON.stringify({version:1,scope:'full',cart:'x'})])assert.equal(decodeFanSession(raw).invalid,true);
 const doc={version:1,scope:'full',cart:[],sector:'missing',row:999,seatId:'nope',view:'seat',filters:{maxPrice:-1,availableOnly:'true'},stand:99,surface:'other'};
 assert.deepEqual(decodeFanSession(JSON.stringify(doc)).state,freshFanState());
 assert.equal(decodeFanSession(null).restored,false);
 const one={...doc,sector:'101',row:999,view:'sector'};assert.equal(decodeFanSession(JSON.stringify(one)).state.selection.row,1);
 assert.deepEqual(decodeFanSession(JSON.stringify({...doc,sector:'101',row:12,view:'unknown'})).state.selection,initialSelection);
 const valid={...doc,sector:'101',row:12,view:'sector'};assert.equal(decodeFanSession(JSON.stringify(valid)).state.selection.row,12);
});
test('usunięcie i wyczyszczenie pozostają po reload, a awaria storage nie przerywa działania',()=>{
 const store=memoryStorage(),state={...freshFanState(),basket:free.slice(0,3)};
 assert.equal(saveFanSession(store,state),true);assert.equal(readFanSession(store).state.basket.length,3);
 state.basket=basketReducer(state.basket,{type:'remove',id:free[0].id});saveFanSession(store,state);assert.equal(readFanSession(store).state.basket.length,2);
 state.basket=basketReducer(state.basket,{type:'clear'});saveFanSession(store,state);assert.deepEqual(readFanSession(store).state.basket,[]);
 const blocked={getItem(){throw new Error('denied')},setItem(){throw new Error('quota')}};
 assert.equal(readFanSession(blocked).unavailable,true);assert.equal(saveFanSession(blocked,state),false);assert.equal(saveFanSession(null,state),false);assert.equal(readFanSession(null).unavailable,true);
 const legacy={...freshFanState(),basket:sectorSeats('101').filter(s=>s.available).slice(0,2)};saveFanSession(store,legacy,true);assert.equal(readFanSession(store,true).state.basket.length,2);assert.equal(readFanSession(store).state.basket.length,0);
});
test('kontrola podsumowania odrzuca zmienioną dostępność i sygnalizuje zmianę ceny z katalogu',()=>{
 const previous=free.slice(0,3);
 const resolve=(id:string)=>{const s=resolveSeat(id);return s?{...s,available:id!==previous[0].id,price:id===previous[1].id?s.price+20:s.price}:null};
 const result=reconcileBasket(previous,resolve);assert.equal(result.discarded,1);assert.equal(result.repriced,1);assert.equal(result.changed,true);assert.equal(result.seats.length,2);assert.equal(result.seats[0].price,previous[1].price+20);
 assert.equal(reconcileBasket(previous).changed,false);assert.equal(canonicalBasket(['missing',taken.id]).seats.length,0);
});
test('bezpośredni link otwiera właściwy fotel, zachowuje własny koszyk i nie przenosi obcych danych',()=>{
 const state={...freshFanState(),basket:free.slice(0,2)};
 const result=applySeatLink(state,`?seat=${encodeURIComponent(taken.id)}`);assert.equal(result.state.selection.seat?.id,taken.id);assert.deepEqual(result.state.basket,state.basket);
 assert.equal(applySeatLink(state,'?seat=unknown').invalidLink,true);assert.equal(applySeatLink(state,'?seat=III-2-1-1',true).invalidLink,true);
 const link=seatLink('https://salesbeyond.vercel.app/?tracking=old#private',taken.id)!;const url=new URL(link);assert.equal(url.searchParams.get('seat'),taken.id);assert.equal(url.searchParams.has('tracking'),false);assert.equal(url.hash,'');
 assert.equal(applySeatLink(state,url.search).state.selection.seat?.id,taken.id);
 assert.equal(new URL(seatLink('https://salesbeyond.vercel.app',free[0].id,true)!).searchParams.get('renderer'),'local');
 assert.equal(seatLink('bad-url',taken.id),null);assert.equal(seatLink('file:///tmp/index.html',taken.id),null);assert.equal(seatLink('https://salesbeyond.vercel.app','unknown'),null);
 assert.equal(new URL(seatLink('https://name:pass@salesbeyond.vercel.app',taken.id)!).username,'');
});


test('nawigacja aktualizuje link po zmianie fotela i usuwa go po powrocie do stadionu',()=>{
 const selected=selectionReducer(initialSelection,{type:'seat',seat:free[0]});
 const original='https://salesbeyond.vercel.app/?renderer=local&seat=old#section';
 const current=new URL(selectionUrl(original,selected)!);assert.equal(current.searchParams.get('seat'),free[0].id);assert.equal(current.searchParams.get('renderer'),'local');assert.equal(current.hash,'#section');
 const reset=new URL(selectionUrl(current.toString(),initialSelection)!);assert.equal(reset.searchParams.has('seat'),false);assert.equal(reset.searchParams.get('renderer'),'local');
 assert.equal(selectionUrl('invalid',selected),null);
});

test('otwarcie zwykłego adresu zaczyna panoramą mimo zapisanego sektora i rzędu',async()=>{
 const {launchFanState}=await import('./fanSession.ts');
 const saved={...freshFanState(),basket:free.slice(0,2),selection:selectionReducer(initialSelection,{type:'seat',seat:free[0]}),stand:2};
 const start=launchFanState(saved,'');assert.equal(start.state.selection.view,'overview');assert.equal(start.state.selection.sector,null);assert.equal(start.state.stand,-1);assert.deepEqual(start.state.basket,saved.basket);
 const explicit=launchFanState(saved,`?seat=${encodeURIComponent(taken.id)}`);assert.equal(explicit.state.selection.seat?.id,taken.id);
});
test('wejście do bloku nie narzuca rzędu 6; kliknięty fotel i ręczny rząd zachowują numer',()=>{
 const prior=selectionReducer(initialSelection,{type:'row',row:6});
 const block=selectionReducer(prior,{type:'sector',id:'II-3'});assert.equal(block.row,1);assert.equal(block.rowFocused,false);
 const focusedFirst=selectionReducer(block,{type:'row',row:block.row});assert.equal(focusedFirst.row,1);assert.equal(focusedFirst.rowFocused,true);
 const clicked=selectionReducer(prior,{type:'sector',id:'II-3',row:28});assert.equal(clicked.row,28);assert.equal(clicked.rowFocused,true);
 const moved=selectionReducer(block,{type:'row',row:39});assert.equal(moved.row,39);assert.equal(moved.rowFocused,true);
});
