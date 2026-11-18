import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createVenueEvents} from './venueEvents.ts';
import {initialSelection,selectionReducer,type Selection} from '../domain/selection.ts';
import {getSeat} from '../data/stadium.ts';
import {venueSeatId} from '../data/venueChart.ts';
function fixture(initial:Selection=initialSelection){
 let state=initial;const actions:string[]=[];
 const events=createVenueEvents({selection:()=>state,onSeat:seat=>actions.push(`seat:${seat.id}`),onSector:id=>actions.push(`sector:${id}`),onOverview:()=>actions.push('overview')});
 return {events,actions,commit:(next:Selection)=>{state=next;}};
}
test('synchroniczne echo poleceń kamery nie zmienia wyboru; klik kibica działa',()=>{
 const f=fixture(),id=venueSeatId(getSeat('102',6,10));
 f.events.command(()=>{f.events.handlers.onSeatPick(id);f.events.handlers.onSectionFocusChange('102');});
 assert.deepEqual(f.actions,[]);
 f.events.handlers.onSectionFocusChange('102');assert.deepEqual(f.actions,['sector:102']);
 f.commit(selectionReducer(initialSelection,{type:'sector',id:'102'}));
 f.events.handlers.onSeatPick(id);assert.deepEqual(f.actions,['sector:102','seat:102-6-10']);
});
test('dwa callbacki w tej samej klatce nie dispatchują dwa razy przed commitem React',()=>{
 const f=fixture(),id=venueSeatId(getSeat('102',6,10));
 f.events.handlers.onSeatPick(id);f.events.handlers.onSeatPick(id);assert.equal(f.actions.length,1);
 f.commit(selectionReducer(initialSelection,{type:'seat',seat:getSeat('102',6,10)}));
 f.events.handlers.onSeatPick(id);assert.equal(f.actions.length,1);
 f.commit(initialSelection);f.events.handlers.onSeatPick(id);assert.equal(f.actions.length,2);
});
test('callback zatrzymanej instancji nie może zmienić stanu nowej sceny',async()=>{
 const f=fixture(selectionReducer(initialSelection,{type:'sector',id:'102'}));
 const queued=Promise.resolve().then(()=>{f.events.handlers.onSeatPick(venueSeatId(getSeat('102',6,10)));f.events.handlers.onSectionFocusChange(null);});
 f.events.dispose();f.events.dispose();await queued;assert.deepEqual(f.actions,[]);
});
test('błędny i zajęty fotel są odrzucane, zagnieżdżone polecenia zwalniają guard po błędzie',()=>{
 const f=fixture();f.events.handlers.onSeatPick('unknown');f.events.handlers.onSeatPick(venueSeatId(getSeat('102',6,4)));
 assert.deepEqual(f.actions,[]);
 assert.throws(()=>f.events.command(()=>f.events.command(()=>{throw new Error('command failed')})));
 f.events.handlers.onSectionFocusChange('101');assert.deepEqual(f.actions,['sector:101']);
});
