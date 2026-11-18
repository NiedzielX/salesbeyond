import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createVenueNavigator,type VenueHandle} from './localVenue.ts';
import {initialSelection,selectionReducer} from '../domain/selection.ts';
import {getSeat} from '../data/stadium.ts';
function fixture(){
 const calls:string[]=[],pending:Array<()=>void>=[];let disposed=0;
 const handle:VenueHandle={focusOverview:()=>{calls.push('overview')},focusSection:id=>{calls.push(id);return true},focusRow:id=>{calls.push(id);return true},
 flyToSeat:id=>{calls.push(id);return new Promise<void>(resolve=>pending.push(resolve))},setSelection:ids=>{calls.push(ids.join(','))},
 captureImage:()=>`image-${calls.at(-1)}`,seatViewStop:()=>'seat',dispose:()=>{disposed++}};
 return {handle,calls,pending,disposed:()=>disposed};
}
test('panel steruje panoramą, sektorem, rzędem i fotelem przez stabilne ID',async()=>{
 const f=fixture();let ready=0;const previews:Array<string|null>=[];
 const nav=createVenueNavigator(f.handle,()=>ready++,url=>previews.push(url),()=>assert.fail('unexpected failure'));
 await nav.navigate(initialSelection);
 const sector=selectionReducer(initialSelection,{type:'sector',id:'102'});
 await nav.navigate(sector);assert.ok(f.calls.includes('102'));
 await nav.navigate(selectionReducer(sector,{type:'row',row:7}));assert.ok(f.calls.includes('north-102-row-7'));
 const flight=nav.navigate(selectionReducer(sector,{type:'seat',seat:getSeat('102',6,10)}));
 assert.equal(ready,3);f.pending[0]();await flight;assert.equal(ready,4);
 assert.equal(previews.at(-1),'image-north-102-row-6:9');
});
test('reset i disposal unieważniają obraz oraz completion starego lotu',async()=>{
 const f=fixture();let ready=0;const previews:Array<string|null>=[];
 const nav=createVenueNavigator(f.handle,()=>ready++,url=>previews.push(url),()=>assert.fail('unexpected failure'));
 const state=selectionReducer(initialSelection,{type:'seat',seat:getSeat('102',6,10)});
 const old=nav.navigate(state);await nav.navigate(initialSelection);f.pending[0]();await old;
 assert.equal(ready,1);assert.equal(previews.at(-1),null);
 const active=nav.navigate(state);nav.dispose();nav.dispose();f.pending[1]();await active;
 assert.equal(ready,1);assert.equal(f.disposed(),1);assert.equal(previews.at(-1),null);
 await nav.navigate(initialSelection);assert.equal(ready,1);
});
test('awaria renderera jest raportowana, nigdy jako gotowy widok',async()=>{
 const f=fixture();let failed=0;f.handle.flyToSeat=()=>Promise.reject(new Error('lost context'));
 const nav=createVenueNavigator(f.handle,()=>assert.fail('not ready'),()=>{},()=>failed++);
 await nav.navigate(selectionReducer(initialSelection,{type:'seat',seat:getSeat('102',6,10)}));assert.equal(failed,1);
});
test('przerwany gestem lot nie jest raportowany jako widok z fotela',async()=>{
 const f=fixture();f.handle.seatViewStop=()=>null;
 const arrivals:Array<boolean>=[];const images:Array<string|null>=[];
 const nav=createVenueNavigator(f.handle,arrived=>arrivals.push(arrived),url=>images.push(url),()=>assert.fail('unexpected failure'));
 const flight=nav.navigate(selectionReducer(initialSelection,{type:'seat',seat:getSeat('102',6,10)}));
 f.pending[0]();await flight;assert.deepEqual(arrivals,[false]);assert.equal(images.at(-1),null);
});
