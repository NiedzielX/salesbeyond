import {useState,useCallback} from 'react';
import {readFanSession,applySeatLink,saveFanSession,type FanStorage,type FanState} from '../domain/fanSession';
export function useFanSession(legacyOnly:boolean){
 const [bootstrap]=useState(()=>{
 let storage:FanStorage|null=null;try{storage=window.localStorage;}catch{/* Storage may be denied by browser settings. */}
 const result=readFanSession(storage,legacyOnly),linked=applySeatLink(result.state,window.location.search,legacyOnly);
 const notice=linked.invalidLink?'Link wskazuje nieznane miejsce. Możesz wybrać dowolny fotel na stadionie.':result.unavailable?'Zapis wyboru jest niedostępny. Możesz dalej wybierać miejsca, ale odświeżenie ich nie zachowa.':result.invalid?'Poprzedni zapis był nieprawidłowy. Rozpoczynasz nowy wybór.':result.discarded?`Odtworzono poprzedni wybór. Pominięto ${result.discarded} nieaktualnych lub nieprawidłowych pozycji.`:result.restored&&result.state.basket.length?'Odtworzono Twój wybór. Miejsca nadal nie są rezerwowane.':'';
 return {state:linked.state,storage:result.unavailable?null:storage,notice};
 });
 const [notice,setNotice]=useState(bootstrap.notice);
 const save=useCallback((state:FanState)=>{if(!saveFanSession(bootstrap.storage,state,legacyOnly))setNotice('Zapis wyboru jest niedostępny. Możesz dalej wybierać miejsca, ale odświeżenie ich nie zachowa.');},[bootstrap,legacyOnly]);
 return {initial:bootstrap.state,notice,dismiss:()=>setNotice(''),save};
}
