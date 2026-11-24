import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {Seat} from '../data/stadium.ts';
import {createSeatNavigationIndex} from './seatNavigation.ts';

function row(ids:string[],options:{sectorId?:string;row?:number;start?:number;positions?:Seat['position'][];available?:boolean[]}={}):Seat[]{
 const {sectorId='A',row=1,start=0,positions,available}=options;
 return ids.map((id,index):Seat=>({id,sectorId,standId:'demo',row,number:start+index+1,price:50,available:available?.[index]??true,position:positions?.[index]??[index*.58,1,0]}));
}

test('nawiguje po rosnących numerach w fizycznym odcinku niezależnie od kolejności katalogu',()=>{
 const seats=row(['one','two','three']);
 const index=createSeatNavigationIndex([seats[2],seats[0],seats[1]]);
 assert.deepEqual(index.neighborsOf('two'),{previous:seats[0],next:seats[2]});
 assert.deepEqual(index.neighborsOf('one'),{previous:null,next:seats[1]});
 assert.deepEqual(index.neighborsOf('three'),{previous:seats[1],next:null});
});

test('nie zawija na końcu ani nie zwraca celu dla nieznanego lub jednofotelowego odcinka',()=>{
 const index=createSeatNavigationIndex(row(['only']));
 assert.deepEqual(index.neighborsOf('only'),{previous:null,next:null});
 assert.deepEqual(index.neighborsOf('missing'),{previous:null,next:null});
});

test('nie przekracza alejek, luk geometrycznych, skoku wysokości ani nieciągłej numeracji',()=>{
 const aisle=[...row(['a','b'],{sectorId:'A'}),...row(['c','d'],{sectorId:'A',start:2,positions:[[5,1,0],[5.58,1,0]]})];
 const gap=[...row(['e','f'],{sectorId:'B'}),...row(['g','h'],{sectorId:'B',start:2,positions:[[.58+2,1,0],[.58+2.58,1,0]]})];
 const height=[...row(['i','j'],{sectorId:'C'}),...row(['k','l'],{sectorId:'C',start:2,positions:[[.58,4,0],[1.16,4,0]]})];
 const numbering=[row(['m','n'],{sectorId:'D'})[0],{...row(['o'],{sectorId:'D'})[0],number:4,position:[1.16,1,0]}];
 const index=createSeatNavigationIndex([...aisle,...gap,...height,...numbering]);
 assert.deepEqual(index.neighborsOf('b'),{previous:aisle[0],next:null});
 assert.deepEqual(index.neighborsOf('c'),{previous:null,next:aisle[3]});
 assert.equal(index.neighborsOf('f').next,null);
 assert.equal(index.neighborsOf('g').previous,null);
 assert.equal(index.neighborsOf('j').next,null);
 assert.equal(index.neighborsOf('k').previous,null);
 assert.equal(index.neighborsOf('m').next,null);
 assert.equal(index.neighborsOf('o').previous,null);
});

test('nie przekracza granicy sektora ani rzędu',()=>{
 const seats=[...row(['a','b']),...row(['c','d'],{sectorId:'B'}),...row(['e','f'],{row:2})];
 const index=createSeatNavigationIndex(seats);
 assert.equal(index.neighborsOf('b').next,null);
 assert.equal(index.neighborsOf('c').previous,null);
 assert.equal(index.neighborsOf('d').next,null);
 assert.equal(index.neighborsOf('e').previous,null);
});

test('zajęte miejsce pozostaje sąsiadem, a budowa indeksu nie zmienia katalogu ani dostępności',()=>{
 const seats=row(['a','held','c'],{available:[true,false,true]});
 const original=seats.map(seat=>({...seat,position:[...seat.position] as Seat['position']}));
 const index=createSeatNavigationIndex(seats);
 assert.equal(index.neighborsOf('a').next,seats[1]);
 assert.equal(index.neighborsOf('held').previous,seats[0]);
 assert.equal(index.neighborsOf('held').next,seats[2]);
 assert.deepEqual(seats,original);
});
