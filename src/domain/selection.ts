import {getSeat,rows,type Seat,type SectorId} from '../data/stadium.ts';
export type View = 'overview'|'sector'|'seat';
export type Selection = {sector:SectorId|null;seat:Seat|null;row:number;view:View};
export const initialSelection:Selection={sector:null,seat:null,row:6,view:'overview'};
export type Action={type:'sector';id:SectorId}|{type:'seat';seat:Seat}|{type:'row';row:number}|{type:'back'}|{type:'reset'};
export function selectionReducer(state:Selection,action:Action):Selection{
 switch(action.type){
 case 'sector':return {...state,sector:action.id,seat:null,view:'sector'};
 case 'seat': {const s=getSeat(action.seat.sectorId,action.seat.row,action.seat.number);return s.available?{sector:s.sectorId,seat:s,row:s.row,view:'seat'}:state;}
 case 'row':return Number.isInteger(action.row)&&action.row>=1&&action.row<=rows?{...state,row:action.row,seat:null}:state;
 case 'back':return {...state,view:state.sector?'sector':'overview'};
 case 'reset':return {...initialSelection};
 }
}
