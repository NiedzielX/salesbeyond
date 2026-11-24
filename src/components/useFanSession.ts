import {useState,useCallback} from 'react';
import {readFanSession,launchFanState,saveFanSession,type FanStorage,type FanState,type SeatResolver} from '../domain/fanSession';
export function useFanSession(eventId:string,legacyOnly:boolean,resolve:SeatResolver){
 const [bootstrap]=useState(()=>{
 let storage:FanStorage|null=null;try{storage=window.localStorage;}catch{/* Storage may be denied by browser settings. */}
 const result=readFanSession(storage,legacyOnly,eventId,resolve),linked=launchFanState(result.state,window.location.search,legacyOnly,resolve);
 const notice=linked.invalidLink?'Link wskazuje nieznane miejsce. Możesz wybrać dowolny fotel na stadionie.':result.unavailable?'Zapis wyboru jest niedostępny. Możesz dalej wybierać miejsca, ale odświeżenie ich nie zachowa.':result.invalid?'Poprzedni zapis był nieprawidłowy. Rozpoczynasz nowy wybór.':result.discarded?`Odtworzono poprzedni wybór. Pominięto ${result.discarded} nieaktualnych lub nieprawidłowych pozycji.`:result.restored&&result.state.basket.length?'Odtworzono Twój wybór. Stan blokad sprawdzamy osobno.':'';
 return {state:linked.state,storage:result.unavailable?null:storage,notice};
 });
 const [notice,setNotice]=useState(bootstrap.notice);
 const save=useCallback((state:FanState)=>{if(!saveFanSession(bootstrap.storage,state,legacyOnly,eventId))setNotice('Zapis wyboru jest niedostępny. Możesz dalej wybierać miejsca, ale odświeżenie ich nie zachowa.');},[bootstrap,legacyOnly,eventId]);
 return {initial:bootstrap.state,notice,dismiss:()=>setNotice(''),save};
}
