import {test} from 'node:test';
import assert from 'node:assert/strict';
import {adjacentSeats,basketReducer,basketTotal,basketLimit,refreshGroupProposal} from './basket.ts';
import {allSectors,sectorSeats} from '../data/stadium.ts';
const all=allSectors.flatMap(s=>sectorSeats(s.id));
test('koszyk kanonizuje ceny, deduplikuje i atomowo odrzuca zajęte/błędne miejsca i nadmiar',()=>{
 const free=all.filter(s=>s.available),taken=all.find(s=>!s.available)!;
 const first=basketReducer([],{type:'add',ids:[free[0].id,free[0].id]});
 assert.deepEqual(first,[free[0]]);
 assert.equal(basketReducer(first,{type:'add',ids:[free[1].id,taken.id]}),first);
 assert.equal(basketReducer(first,{type:'add',ids:['unknown']}),first);
 assert.equal(basketReducer(first,{type:'add',ids:free.slice(1,basketLimit+1).map(s=>s.id)}),first);
 const full=basketReducer([],{type:'add',ids:free.slice(0,basketLimit).map(s=>s.id)});assert.equal(full.length,basketLimit);
 assert.equal(basketTotal(first),free[0].price);
 assert.equal(basketReducer(first,{type:'remove',id:free[0].id}).length,0);
 assert.deepEqual(basketReducer(first,{type:'clear'}),[]);
});
test('grupa jest wolna, w jednym rzędzie/sektorze, obok siebie fizycznie i w budżecie',()=>{
 for(const quantity of [2,3,4]){
 const group=adjacentSeats(allSectors.map(s=>s.id),quantity,[],75);
 assert.equal(group.length,quantity);assert.equal(new Set(group.map(s=>s.sectorId+':'+s.row)).size,1);
 assert.ok(group.every(s=>s.available&&s.price<=75));
 for(let i=1;i<group.length;i++){assert.equal(group[i].number,group[i-1].number+1);assert.ok(Math.hypot(group[i].position[0]-group[i-1].position[0],group[i].position[2]-group[i-1].position[2])<=2.2);}
 assert.ok(adjacentSeats(allSectors.map(s=>s.id),quantity,group.map(s=>s.id)).every(s=>!group.some(chosen=>chosen.id===s.id)));
 }
 assert.deepEqual(adjacentSeats(['101'],4,[],1),[]);
 assert.deepEqual(adjacentSeats(['101'],11),[]);
});
test('odświeżenie danych zachowuje całą propozycję i odczytuje jej bieżące ceny',()=>{
 const group=adjacentSeats(['101'],3),unrelated=all.find(s=>!group.some(g=>g.id===s.id))!;
 const current=new Map(all.map(s=>[s.id,{...s}]));
 current.set(unrelated.id,{...unrelated,available:!unrelated.available});
 const unchanged=refreshGroupProposal(group,id=>current.get(id)??null);
 assert.equal(unchanged.issue,null);assert.deepEqual(unchanged.seats.map(s=>s.id),group.map(s=>s.id));
 current.set(group[1].id,{...group[1],price:group[1].price+5});
 const repriced=refreshGroupProposal(group,id=>current.get(id)??null);
 assert.equal(repriced.issue,null);assert.equal(basketTotal(repriced.seats),basketTotal(group)+5);
 assert.equal(group[1].price+5,repriced.seats[1].price);assert.notEqual(group[1].price,repriced.seats[1].price);
});
test('zajęcie lub zniknięcie jednego fotela unieważnia dodanie całej grupy bez jej skracania',()=>{
 const group=adjacentSeats(['101'],3),current=new Map(group.map(s=>[s.id,s]));
 current.set(group[1].id,{...group[1],available:false});
 const occupied=refreshGroupProposal(group,id=>current.get(id)??null);
 assert.equal(occupied.issue,'unavailable');assert.equal(occupied.seats.length,3);assert.equal(occupied.seats[1].available,false);
 current.delete(group[1].id);
 const missing=refreshGroupProposal(group,id=>current.get(id)??null);
 assert.equal(missing.issue,'missing');assert.deepEqual(missing.seats.map(s=>s.id),group.map(s=>s.id));
});
test('propozycja reaguje na przekroczenie budżetu i zwolnienie poprzednio zajętego fotela',()=>{
 const group=adjacentSeats(['101'],2),stored=group.map(s=>({...s,available:false}));
 const current=new Map(group.map(s=>[s.id,s]));
 const released=refreshGroupProposal(stored,id=>current.get(id)??null);
 assert.equal(released.issue,null);assert.ok(released.seats.every(s=>s.available));
 assert.equal(basketReducer([],{type:'add',ids:released.seats.map(s=>s.id)},id=>current.get(id)??null).length,2);
 current.set(group[0].id,{...group[0],price:100});
 assert.equal(refreshGroupProposal(group,id=>current.get(id)??null,90).issue,'price');
});
test('wyjście z bloku nie przywraca ceny demo ani dostępności wcześniej sprawdzonej grupy',()=>{
 const group=adjacentSeats(['101'],2);
 const observed=group.map(s=>({...s,price:120,available:false,inventoryStatus:'held'}));
 const canonical=new Map(group.map(s=>[s.id,s]));
 const unloaded=refreshGroupProposal(observed,id=>canonical.get(id)??null);
 assert.equal(unloaded.issue,'stale');assert.ok(unloaded.seats.every(s=>s.price===120&&!s.available));
 const rechecked=new Map(group.map(s=>[s.id,{...s,price:95,available:true,inventoryStatus:'available'}]));
 const resumed=refreshGroupProposal(unloaded.seats,id=>rechecked.get(id)??null);
 assert.equal(resumed.issue,null);assert.ok(resumed.seats.every(s=>s.price===95&&s.available));
});
