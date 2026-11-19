import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {ISeatmapRenderer,RendererOptions} from '@seatlayer/core';
import {createFullChart} from '../data/fullChart.ts';
import {mountNativeMap} from './nativeMap.ts';
import {getSeat} from '../data/stadium.ts';
test('natywna mapa blokuje echa poleceń, pozwala obejrzeć zajęty fotel i sprząta raz',()=>{
 const chart=createFullChart(true),calls:string[]=[],picks:string[]=[];let options:RendererOptions={};
 const free=[...chart.domainByNative].find(([,s])=>s.available)!,occupied=[...chart.domainByNative].find(([,s])=>!s.available)!;
 const emit=(id:string)=>options.onSelect?.({id} as Parameters<NonNullable<RendererOptions['onSelect']>>[0]);
 const mock={setChart(){emit(free[0]);},setStatus(ids:string[],status:string){assert.equal(status,'booked');assert.ok(ids.includes(occupied[0]));},clearSelection(){options.onDeselect?.({id:free[0]} as Parameters<NonNullable<RendererOptions['onDeselect']>>[0]);},select(){emit(free[0]);return [];},setSelectionFocus(){},focusSection(id:string){calls.push(id);options.onSectionTap?.(id);},focusSeats(ids:string[]){calls.push(`row:${ids.length}`);return true;},overview(){calls.push('overview');},zoomIn(){},zoomOut(){},zoomToFit(){},destroy(){calls.push('destroy');}} as unknown as ISeatmapRenderer;
 const map=mountNativeMap({} as HTMLDivElement,chart,{onSeat:s=>picks.push(s.id),onSector:id=>calls.push(`pick:${id}`),onOverview:()=>calls.push('pick:overview')},(_host,opts)=>{options=opts;emit(free[0]);return mock;});
 assert.deepEqual(picks,[]);assert.deepEqual(options.selectableStatuses,['free','booked']);
 map.update({sector:'101',row:6,seat:getSeat('101',6,1)});assert.deepEqual(calls,['101']);assert.deepEqual(picks,[]);
 options.onSeatsRevealed?.();assert.deepEqual(picks,[]);
 emit(occupied[0]);assert.deepEqual(picks,[occupied[1].id]);assert.equal(occupied[1].available,false);
 map.update({sector:'101',row:7,seat:null});assert.ok(calls.includes('row:18'));
 map.dispose();map.dispose();emit(free[0]);assert.equal(calls.filter(c=>c==='destroy').length,1);assert.equal(picks.length,1);
});
test('błąd ustawienia chartu niszczy utworzony renderer przed przekazaniem błędu',()=>{
 let disposed=0;
 assert.throws(()=>mountNativeMap({} as HTMLDivElement,createFullChart(true),{onSeat(){},onSector(){},onOverview(){}},()=>({setChart(){throw new Error('chart failed')},destroy(){disposed++;}} as unknown as ISeatmapRenderer)),/chart failed/);
 assert.equal(disposed,1);
});
test('wyjątek destroy nie zastępuje błędu chartu i nie blokuje fallbacku',()=>{
 assert.throws(()=>mountNativeMap({} as HTMLDivElement,createFullChart(true),{onSeat(){},onSector(){},onOverview(){}},()=>({setChart(){throw new Error('original chart failure')},destroy(){throw new Error('destroy failure')}} as unknown as ISeatmapRenderer)),/original chart failure/);
});
test('pełny koszyk i osobny podgląd są odtwarzane razem bez ech ani utraty zaznaczeń',()=>{
 const chart=createFullChart(true),free=[...chart.domainByNative].filter(([,s])=>s.available),taken=[...chart.domainByNative].find(([,s])=>!s.available)!;
 let options:RendererOptions={},selected:string[]=[];let callbacks=0;
 const mock={setChart(){},setStatus(){},clearSelection(){selected=[];options.onDeselect?.({id:free[0][0]} as Parameters<NonNullable<RendererOptions['onDeselect']>>[0]);},select(ids:string[]){selected=[...ids];for(const id of ids)options.onSelect?.({id} as Parameters<NonNullable<RendererOptions['onSelect']>>[0]);return [];},setSelectionFocus(){},focusSection(){},overview(){},destroy(){}} as unknown as ISeatmapRenderer;
 const map=mountNativeMap({} as HTMLDivElement,chart,{onSeat(){callbacks++},onSector(){callbacks++},onOverview(){callbacks++}},(_el,opts)=>{options=opts;return mock});
 const chosenIds=free.slice(0,10).map(([,s])=>s.id);
 map.update({sector:'101',row:6,seat:taken[1],chosenIds:[...chosenIds,'unknown',taken[1].id,chosenIds[0]]});
 assert.equal(options.maxSelection,12);assert.equal(selected.length,11);assert.ok(selected.includes(taken[0]));
 for(const id of chosenIds)assert.ok(selected.includes(chart.nativeByDomain.get(id)!));
 assert.equal(callbacks,0);
 selected=[];options.onSeatsRevealed?.();assert.equal(selected.length,11);assert.equal(callbacks,0);
 map.update({sector:'102',row:2,seat:free[12][1],chosenIds});assert.equal(selected.length,11);assert.equal(callbacks,0);
 map.update({sector:null,row:6,seat:null,chosenIds:chosenIds.slice(1)});assert.equal(selected.length,9);assert.equal(callbacks,0);
 map.dispose();
});
