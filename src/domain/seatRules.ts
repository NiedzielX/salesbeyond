import type {Seat} from '../data/stadium.ts';
import {layout} from '../data/stadium.ts';

export type EventStatus='open'|'closed'|'sold-out';
export type SeatRulePolicy={preventSingleSeats:boolean;eventStatus:EventStatus;limit:number};
export type SeatRuleResult={ok:boolean;reason:'closed'|'sold-out'|'invalid-limit'|'unavailable'|'unknown-seat'|'limit'|'orphan-seat'|null;ids:string[];newlyOrphanedIds:string[]};
const adjacencyDistance=layout.seatSpacing*1.45;

/** Build physical row runs, breaking at sector boundaries and visible aisle/gap distances. */
export function physicalRowRuns(seats:readonly Seat[]):Seat[][]{
 const rows=new Map<string,Seat[]>();
 for(const seat of seats){const key=`${seat.sectorId}\u0000${seat.row}`;const run=rows.get(key)??[];run.push(seat);rows.set(key,run);}
 const result:Seat[][]=[];
 for(const row of rows.values()){
  row.sort((a,b)=>a.number-b.number||a.id.localeCompare(b.id));let run:Seat[]=[];
  for(const seat of row){const previous=run.at(-1);if(previous&&(seat.number!==previous.number+1||Math.hypot(seat.position[0]-previous.position[0],seat.position[2]-previous.position[2])>adjacencyDistance||Math.abs(seat.position[1]-previous.position[1])>adjacencyDistance)){if(run.length)result.push(run);run=[];}run.push(seat);}
  if(run.length)result.push(run);
 }
 return result;
}
function singletonIds(runs:readonly Seat[][],selected:ReadonlySet<string>):Set<string>{
 const singles=new Set<string>();
 for(const run of runs){let available:Seat[]=[];const flush=()=>{if(available.length===1)singles.add(available[0].id);available=[];};
  for(const seat of run){if(seat.available&&!selected.has(seat.id))available.push(seat);else flush();}flush();
 }
 return singles;
}

/** Build a reusable evaluator for many proposals against one basket/catalogue snapshot. */
export function createSeatRuleCatalog(inventory:readonly Seat[]){
 const byId=new Map(inventory.map(s=>[s.id,s]));
 const runs=physicalRowRuns(inventory),runBySeat=new Map<string,number>();
 runs.forEach((run,index)=>run.forEach(seat=>runBySeat.set(seat.id,index)));
 return {forBasket(beforeIds:readonly string[],policy:SeatRulePolicy){
 const before=[...new Set(beforeIds)],beforeSelected=new Set(before),beforeSingletons=policy.preventSingleSeats?singletonIds(runs,beforeSelected):new Set<string>();
 const fail=(reason:SeatRuleResult['reason'],ids:string[]=[],orphans:string[]=[]):SeatRuleResult=>({ok:false,reason,ids,newlyOrphanedIds:orphans});
 const validBefore=!Number.isInteger(policy.limit)||policy.limit<0?'invalid-limit':before.some(id=>!byId.has(id))?'unknown-seat':before.some(id=>!byId.get(id)!.available)?'unavailable':before.length>policy.limit?'limit':null;
 return (addIds:readonly string[]):SeatRuleResult=>{
  if(validBefore)return fail(validBefore);
  if(policy.eventStatus==='closed')return fail('closed');if(policy.eventStatus==='sold-out')return fail('sold-out');
  const additions=[...new Set(addIds)].filter(id=>!beforeSelected.has(id));
  for(const id of additions){const seat=byId.get(id);if(!seat)return fail('unknown-seat');if(!seat.available)return fail('unavailable');}
  const ids=[...before,...additions];if(ids.length>policy.limit)return fail('limit');
  if(!policy.preventSingleSeats||!additions.length)return {ok:true,reason:null,ids,newlyOrphanedIds:[]};
  const selected=new Set(ids),affected=new Set(additions.map(id=>runBySeat.get(id)).filter((index):index is number=>index!==undefined));
  const newlyOrphanedIds:string[]=[];
  for(const index of affected){
   const run=runs[index];let remaining:Seat[]=[];
   const flush=()=>{if(remaining.length===1&&!beforeSingletons.has(remaining[0].id))newlyOrphanedIds.push(remaining[0].id);remaining=[];};
   for(const seat of run){if(seat.available&&!selected.has(seat.id))remaining.push(seat);else flush();}flush();
  }
  newlyOrphanedIds.sort();if(newlyOrphanedIds.length)return fail('orphan-seat',ids,newlyOrphanedIds);
  return {ok:true,reason:null,ids,newlyOrphanedIds:[]};
 };
 }};
}

export function createSeatRuleEvaluator(inventory:readonly Seat[],beforeIds:readonly string[],policy:SeatRulePolicy){return createSeatRuleCatalog(inventory).forBasket(beforeIds,policy);}

/** Apply a proposed addition atomically against this catalogue snapshot. */
export function evaluateSeatAddition(inventory:readonly Seat[],beforeIds:readonly string[],addIds:readonly string[],policy:SeatRulePolicy):SeatRuleResult{return createSeatRuleEvaluator(inventory,beforeIds,policy)(addIds);}

/** Recommendation filter: keep only proposals whose full addition passes the same rules. */
export function filterSeatRecommendations<T extends readonly string[]>(inventory:readonly Seat[],beforeIds:readonly string[],proposals:readonly T[],policy:SeatRulePolicy):T[]{
 const evaluate=createSeatRuleEvaluator(inventory,beforeIds,policy);return proposals.filter(ids=>evaluate(ids).ok);
}
