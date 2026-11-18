import {resolveSeat,sectorRows,rows,type Seat,type SectorId} from '../data/stadium.ts';
export type View = 'overview'|'sector'|'seat';
export type Selection = {sector:SectorId|null;seat:Seat|null;row:number;view:View};
export const initialSelection:Selection={sector:null,seat:null,row:6,view:'overview'};
export type Action={type:'sector';id:SectorId}|{type:'seat';seat:Seat}|{type:'row';row:number}|{type:'back'}|{type:'reset'};
export function selectionReducer(state:Selection,action:Action):Selection{
 switch(action.type){
 case 'sector':{const available=sectorRows(action.id);if(!available.length)return state;return {...state,sector:action.id,row:available.includes(state.row)?state.row:available[0],seat:null,view:'sector'};}
 case 'seat': {const s=resolveSeat(action.seat.id);return s?{sector:s.sectorId,seat:s,row:s.row,view:'seat'}:state;}
 case 'row':return Number.isInteger(action.row)&&(state.sector?sectorRows(state.sector).includes(action.row):action.row>=1&&action.row<=rows)?{...state,row:action.row,seat:null}:state;
 case 'back':return {...state,view:state.sector?'sector':'overview'};
 case 'reset':return {...initialSelection};
 }
}
