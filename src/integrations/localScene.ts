import {expandChart} from '@seatlayer/core/core/layout';
import {buildSceneModel,type PreparedVenue3D} from '@seatlayer/core/view3d';
import {createVenueChart,domainSeat} from '../data/venueChart.ts';
import {createVenueShell} from '../data/venueShell.ts';

/** Frame our complete architecture; the default bounds fit only the selectable north rows. */
export function prepareLocalScene(roof:boolean){
 const started=performance.now();
 const doc=createVenueChart(),seats=expandChart(doc);
 const model=buildSceneModel({doc,seats,registeredShellGlb:createVenueShell(roof),
 initialState:seat=>domainSeat(seat.id)?.available?'available':'sold'});
 const min:[number,number,number]=[-92,0,-74],max:[number,number,number]=[92,24,74];
 const center:[number,number,number]=[0,12,0];
 const fitPoints=new Float32Array([-92,92].flatMap(x=>[0,24].flatMap(y=>[-74,74].flatMap(z=>[x,y,z]))));
 model.bounds={...model.bounds,center,box:{min,max},radius:Math.hypot(92,74),fitPoints};
 model.outdoor=true;
 for(const floor of model.floors){floor.box={min:[...min],max:[...max]};floor.center=[...center];floor.radius=model.bounds.radius;}
 const prepared:PreparedVenue3D={model,buildMs:performance.now()-started,source:'main'};
 return {doc,seats,prepared};
}
