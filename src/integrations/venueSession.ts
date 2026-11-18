import type {Venue3DHandle} from '@seatlayer/core/view3d';
import type {Selection} from '../domain/selection.ts';
import {createVenueNavigator,type VenueHandle} from './localVenue.ts';
import {createVenueEvents} from './venueEvents.ts';
type Cleanup=()=>void;
type Events=ReturnType<typeof createVenueEvents>;
export type ManagedVenue=VenueHandle&Pick<Venue3DHandle,'resize'>;
type Dependencies={
 host:Parameters<typeof createVenueEvents>[0];
 revision:number;
 load:()=>Promise<(handlers:Events['handlers'])=>ManagedVenue>;
 watchContext:(venue:ManagedVenue,lost:()=>void)=>Cleanup;
 observeResize:(venue:ManagedVenue)=>Cleanup;
 onReady:(arrived:boolean)=>void;
 onPreview:(url:string|null)=>void;
 onUnavailable:(reason:unknown)=>void;
 onCleanupError?:(reason:unknown)=>void;
};
const keyOf=(state:Selection,revision:number)=>`${state.view}:${state.sector}:${state.row}:${state.seat?.id}:${revision}`;

/** Resource ownership, separate from React and GPU. `initialized` is setup completion, never a rendered-frame claim. */
export function createVenueSession(deps:Dependencies){
 let closed=false,events:Events|null=null,venue:ManagedVenue|null=null;
 let navigator:ReturnType<typeof createVenueNavigator>|null=null;
 let wanted={state:deps.host.selection(),revision:deps.revision};
 let applied:string|null=null;
 const cleanups:Cleanup[]=[];
 const release=(cleanup:Cleanup)=>{
  try{cleanup();}catch(reason){try{deps.onCleanupError?.(reason);}catch{/* Diagnostics must not prevent other resources being released. */}}
 };
 const own=(cleanup:Cleanup)=>{if(closed)release(cleanup);else cleanups.push(cleanup);};
 const dispose=()=>{
  if(closed)return;closed=true;
  events?.dispose();events=null;
  while(cleanups.length)release(cleanups.pop()!);
  const currentNavigator=navigator,currentVenue=venue;navigator=null;venue=null;
  if(currentNavigator)release(()=>currentNavigator.dispose());
  else if(currentVenue)release(()=>currentVenue.dispose());
 };
 const fail=(reason:unknown)=>{if(closed)return;dispose();deps.onUnavailable(reason);};
 const replay=()=>{
  if(closed||!navigator||!events)return;
  const key=keyOf(wanted.state,wanted.revision);if(key===applied)return;
  applied=key;
  const current=navigator,state=wanted.state;
  void events.command(()=>current.navigate(state)).catch(fail);
 };
 const initialized=Promise.resolve().then(async()=>{
  if(closed)return;
  const mount=await deps.load();if(closed)return;
  events=createVenueEvents(deps.host);
  const mounted=events.command(()=>mount(events!.handlers));
  // A host can dispose reentrantly during setup; never retain the returned handle then.
  if(closed){release(()=>mounted.dispose());return;}
  venue=mounted;
  navigator=createVenueNavigator(mounted,deps.onReady,deps.onPreview,()=>fail(new Error('Venue navigation failed')));
  own(deps.watchContext(mounted,()=>fail(new Error('WebGL context lost'))));if(closed)return;
  own(deps.observeResize(mounted));if(closed)return;
  replay();
 }).catch(fail);
 return {
  initialized,
  update(state:Selection,revision:number){if(closed)return;wanted={state,revision};replay();},
  dispose,
 };
}
