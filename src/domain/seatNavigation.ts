import type {Seat} from '../data/stadium.ts';
import {physicalRowRuns} from './seatRules.ts';

export type SeatNavigationNeighbors=Readonly<{previous:Seat|null;next:Seat|null}>;

/** Build a stable neighbor lookup from the canonical inventory snapshot. */
export function createSeatNavigationIndex(inventory:readonly Seat[]){
 const neighborsById=new Map<string,SeatNavigationNeighbors>();
 for(const run of physicalRowRuns(inventory)){
  run.forEach((seat,index)=>neighborsById.set(seat.id,{
   previous:index>0?run[index-1]:null,
   next:index<run.length-1?run[index+1]:null,
  }));
 }
 const noNeighbors:SeatNavigationNeighbors=Object.freeze({previous:null,next:null});
 return {
  /** Availability and other live UI state do not affect physical adjacency. */
  neighborsOf(seatId:string):SeatNavigationNeighbors{return neighborsById.get(seatId)??noNeighbors;},
 };
}
