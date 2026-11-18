import {test} from 'node:test';
import assert from 'node:assert/strict';
import {adjacentSeats,basketReducer,basketTotal,basketLimit} from './basket.ts';
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
