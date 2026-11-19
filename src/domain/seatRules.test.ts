import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluateSeatAddition,filterSeatRecommendations,physicalRowRuns} from './seatRules.ts';
import type {Seat} from '../data/stadium.ts';
const policy={preventSingleSeats:true,eventStatus:'open' as const,limit:10};
function row(ids:string[], available=ids.map(()=>true),sectorId='A',row=1,start=0):Seat[]{return ids.map((id,i):Seat=>({id,sectorId,standId:'demo',row,number:start+i+1,price:50,available:available[i],position:[i*.58,1,0]}));}
test('rejects atomic addition that strands a singleton while preserving existing singles',()=>{
 const seats=[...row(['a','b','c','d']),...row(['x','y','z'],[true,false,true],'B',1)];
 const rejected=evaluateSeatAddition(seats,[],['b','c'],policy);
 assert.deepEqual(rejected,{ok:false,reason:'orphan-seat',ids:['b','c'],newlyOrphanedIds:['a','d']});
 const accepted=evaluateSeatAddition(seats,[],['a'],policy);
 assert.equal(accepted.ok,true);assert.deepEqual(accepted.newlyOrphanedIds,[]);
});
test('de-duplicates requests, rejects invalid inventory/event/limit atomically',()=>{
 const seats=row(['a','b','c']);
 assert.deepEqual(evaluateSeatAddition(seats,[],['a','a'],policy).ids,['a']);
 assert.equal(evaluateSeatAddition(seats,[],['a','missing'],policy).reason,'unknown-seat');
 assert.equal(evaluateSeatAddition(row(['a','b'],[true,false]),[],['b'],policy).reason,'unavailable');
 assert.equal(evaluateSeatAddition(seats,[],['a'],{...policy,eventStatus:'closed'}).reason,'closed');
 assert.equal(evaluateSeatAddition(seats,[],['a'],{...policy,eventStatus:'sold-out'}).reason,'sold-out');
 assert.equal(evaluateSeatAddition(seats,[],['a','b'],{...policy,limit:1}).reason,'limit');
});
test('physical runs break at aisles and sector/row boundaries',()=>{
 const seats=[...row(['a','b']),{...row(['c'])[0],number:3,position:[5,1,0]},...row(['d'],undefined,'B',1),...row(['e'],undefined,'A',2)];
 const runs=physicalRowRuns(seats);assert.deepEqual(runs.map(r=>r.map(s=>s.id)),[['a','b'],['c'],['d'],['e']]);
});
test('a proposal across a physical gap is rejected by orphan protection; disabling policy allows it',()=>{
 const seats=[...row(['a','b']),{...row(['c'])[0],number:3,position:[5,1,0]},{...row(['d'])[0],number:4,position:[5.58,1,0]}];
 assert.equal(evaluateSeatAddition(seats,[],['b','c'],policy).reason,'orphan-seat');
 assert.equal(evaluateSeatAddition(seats,[],['b','c'],{...policy,preventSingleSeats:false}).ok,true);
});
test('recommendation helper retains only atomically valid proposals',()=>{
 const seats=row(['a','b','c','d']);
 assert.deepEqual(filterSeatRecommendations(seats,[],[['b','c'],['a','b']],policy),[['a','b']]);
});

test('rzeczywiste narożniki i alejki są zgodne z doborem grup i tą samą polityką koszyka',async()=>{
 const {allSectors,stadiumSeats,sectorSeats}=await import('../data/stadium.ts');
 const {adjacentSeats}=await import('./basket.ts');
 const inventory=stadiumSeats(),evaluate=(await import('./seatRules.ts')).createSeatRuleEvaluator(inventory,[],policy);
 for(const id of ['C1','C2','C3','C4','I-1','III-2']){
 const runs=physicalRowRuns(sectorSeats(id));assert.ok(runs.length>1);
 const candidate=adjacentSeats([id],4,[],95,seats=>evaluate(seats.map(s=>s.id)).ok);
 assert.equal(candidate.length,4);assert.equal(evaluate(candidate.map(s=>s.id)).ok,true);
 const containing=runs.find(run=>candidate.every(seat=>run.some(s=>s.id===seat.id)));assert.ok(containing,id);
 }
 assert.ok(allSectors.length>10);
});
test('nowy snapshot dostępności i stan wydarzenia odrzucają całą dawną propozycję',()=>{
 const original=row(['a','b','c','d']),proposal=['a','b'];
 assert.equal(evaluateSeatAddition(original,[],proposal,policy).ok,true);
 const refreshed=original.map(s=>s.id==='b'?{...s,available:false}:s);
 const rejected=evaluateSeatAddition(refreshed,[],proposal,policy);assert.equal(rejected.ok,false);assert.equal(rejected.reason,'unavailable');assert.deepEqual(rejected.ids,[]);
 for(const eventStatus of ['closed','sold-out'] as const)assert.equal(evaluateSeatAddition(original,[],proposal,{...policy,eventStatus}).ok,false);
 assert.deepEqual(original.map(s=>s.available),[true,true,true,true]);
});
test('preferencja ma ten sam roundtrip co lokalny wybór i nie staje się rezerwacją',async()=>{
 const {freshFanState,encodeFanSession,decodeFanSession}=await import('./fanSession.ts');
 const state={...freshFanState(),avoidSingles:true};assert.equal(decodeFanSession(encodeFanSession(state)).state.avoidSingles,true);
});
test('indeks katalogu jest współdzielony między kolejnymi koszykami bez zachowania poprzedniego wyboru',async()=>{
 const {createSeatRuleCatalog}=await import('./seatRules.ts');
 const seats=row(['a','b','c','d']),catalog=createSeatRuleCatalog(seats);
 assert.equal(catalog.forBasket([],policy)(['a','b']).ok,true);
 assert.equal(catalog.forBasket(['a'],policy)(['b','c']).reason,'orphan-seat');
 assert.equal(catalog.forBasket([],policy)(['a','b']).ok,true);
 assert.deepEqual(seats.map(s=>s.id),['a','b','c','d']);
});
