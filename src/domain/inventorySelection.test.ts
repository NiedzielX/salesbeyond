import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveSeat,sectorSeats,type Seat} from '../data/stadium.ts';
import {basketReducer,adjacentSeats,reconcileBasket} from './basket.ts';
import {summarizeSeats} from './seatSearch.ts';
test('live resolver permits newly released catalog seats and rejects newly held seats atomically',()=>{
 const seats=sectorSeats('101'),free=seats.find(s=>s.available)!,blocked=seats.find(s=>!s.available)!;
 const live=new Map([[free.id,{...free,available:false}],[blocked.id,{...blocked,available:true,price:77.25}]]);
 const resolve=(id:string)=>live.get(id)??resolveSeat(id);
 assert.deepEqual(basketReducer([],{type:'add',ids:[free.id,blocked.id]},resolve),[]);
 const selected=basketReducer([],{type:'add',ids:[blocked.id]},resolve);assert.equal(selected.length,1);assert.equal(selected[0].price,77.25);
 const checked=reconcileBasket([free],resolve);assert.equal(checked.discarded,1);
 const repriced=reconcileBasket([{...blocked,available:true,price:65}],resolve);assert.equal(repriced.repriced,1);assert.equal(repriced.seats[0].price,77.25);
});
test('group budget, availability and summary use the same overlay without changing canonical geometry',()=>{
 const seats=sectorSeats('102'),row=seats.filter(s=>s.row===6).slice(0,3),allowed=new Set(row.map(s=>s.id));
 const resolve=(id:string):Seat|null=>{const s=resolveSeat(id);return s?{...s,available:allowed.has(id),price:22}:null;};
 const group=adjacentSeats(['102'],2,[],25,undefined,resolve);assert.equal(group.length,2);assert.ok(group.every(s=>allowed.has(s.id)&&s.price===22));
 allowed.delete(group[0].id);
 const changed=adjacentSeats(['102'],2,[],25,undefined,resolve);assert.ok(changed.every(s=>s.id!==group[0].id));
 const summary=summarizeSeats(['102'],{maxPrice:25,availableOnly:true},true,id=>sectorSeats(id).map(s=>resolve(s.id)!));
 assert.equal(summary[0].matching,allowed.size);assert.equal(summary[0].minPrice,22);assert.equal(seats.find(s=>s.id===row[0].id)!.price,85);
});
