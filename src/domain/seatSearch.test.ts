import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaultSeatFilters,matchesSeat,searchSectors,summarizeSeats,groupSearchScope} from './seatSearch.ts';
import {adjacentSeats,basketReducer,basketTotal} from './basket.ts';
import {allSectors,sectorSeats,sectorRows,seatsInRow,stadiumSeats,layout} from '../data/stadium.ts';

test('filtry zliczają cały stadion lub wskazaną trybunę i rzeczywiste ceny foteli, bez utraty katalogu',()=>{
 const all=stadiumSeats(),blocks=searchSectors(-1);
 assert.equal(blocks.length,allSectors.length);
 const totals=summarizeSeats(blocks.map(s=>s.id),defaultSeatFilters);
 assert.equal(totals.reduce((n,s)=>n+s.total,0),all.length);
 assert.equal(totals.reduce((n,s)=>n+s.matching,0),all.filter(s=>s.available).length);
 for(const stand of [0,1,2,3])assert.ok(searchSectors(stand).every(s=>s.side===stand));
 assert.equal(searchSectors(-1,true).length,3);assert.deepEqual(searchSectors(25),[]);
 for(const price of [65,75,85,95])for(const availableOnly of [true,false]){
 const filters={maxPrice:price,availableOnly},results=summarizeSeats(blocks.map(s=>s.id),filters);
 assert.equal(results.reduce((n,s)=>n+s.matching,0),all.filter(s=>s.price<=price&&(!availableOnly||s.available)).length);
 for(const block of results){const expected=all.filter(s=>s.sectorId===block.id&&s.price<=price&&(!availableOnly||s.available));assert.equal(block.minPrice,expected.length?Math.min(...expected.map(s=>s.price)):null);}
 }
 const taken=all.find(s=>!s.available)!;assert.equal(matchesSeat(taken,{maxPrice:0,availableOnly:false}),true);
 assert.ok(sectorSeats(taken.sectorId).some(s=>s.id===taken.id),'poza filtrem fotel pozostaje w pełnym katalogu');
});
test('brak wyników i nieprawidłowy budżet nie otwierają nieograniczonego wyszukiwania',()=>{
 for(const maxPrice of [1,-1,NaN,Infinity]){
 const results=summarizeSeats(['101','101','missing'],{maxPrice,availableOnly:true});
 assert.equal(results.length,2);assert.ok(results.every(s=>s.matching===0&&s.minPrice===null));
 }
 assert.deepEqual(adjacentSeats(['101'],2,[],NaN),[]);
 assert.deepEqual(adjacentSeats(['101'],2,[],-1),[]);
});
test('wybrany blok zawęża grupę, a propozycja i podgląd nie dodają miejsc do koszyka',()=>{
 const visible=searchSectors(-1),scope=groupSearchScope('III-2',visible);
 assert.deepEqual(scope,['III-2']);assert.equal(groupSearchScope(null,visible).length,allSectors.length);
 const basket=adjacentSeats(['101'],2),snapshot=basket.map(s=>s.id);
 const proposal=adjacentSeats(scope,4,snapshot,95);
 assert.equal(proposal.length,4);assert.ok(proposal.every(s=>s.sectorId==='III-2'));
 assert.deepEqual(basket.map(s=>s.id),snapshot);
 const added=basketReducer(basket,{type:'add',ids:proposal.map(s=>s.id)});
 assert.equal(added.length,6);assert.equal(basketTotal(added),basketTotal(basket)+basketTotal(proposal));
});
test('grupy w łukach zachowują fizyczne sąsiedztwo i nie przeskakują alejki mimo kolejnych numerów',()=>{
 for(const block of ['C1','C2','C3','C4','I-1','III-2']){
 for(const quantity of [2,3,4,5,6]){
 const group=adjacentSeats([block],quantity);
 assert.equal(group.length,quantity);assert.equal(new Set(group.map(s=>s.row)).size,1);
 for(let i=1;i<group.length;i++)assert.ok(Math.hypot(group[i].position[0]-group[i-1].position[0],group[i].position[2]-group[i-1].position[2])<=layout.seatSpacing*1.45);
 }
 const all=sectorSeats(block);let gapPair:string[]=[];
 for(const row of sectorRows(block)){
 const seats=seatsInRow(block,row);for(let i=1;i<seats.length;i++)if(seats[i].available&&seats[i-1].available&&seats[i].number===seats[i-1].number+1&&Math.hypot(seats[i].position[0]-seats[i-1].position[0],seats[i].position[2]-seats[i-1].position[2])>layout.seatSpacing*1.45){gapPair=[seats[i-1].id,seats[i].id];break;}
 if(gapPair.length)break;
 }
 assert.equal(gapPair.length,2,`${block}: próbka fizycznej alejki`);
 assert.deepEqual(adjacentSeats([block],2,all.filter(s=>!gapPair.includes(s.id)).map(s=>s.id)),[]);
 }
});
