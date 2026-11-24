import {useState} from 'react';
import {Link,Check} from 'lucide-react';
import {seatLink,type SeatResolver} from '../domain/fanSession';
type Props={id:string;legacyOnly:boolean;eventId?:string;resolve?:SeatResolver};
export default function SeatShare({id,legacyOnly,eventId='enea-demo',resolve}:Props){
 const [result,setResult]=useState<{id:string;url:string;copied:boolean}|null>(null);
 async function share(){
 const url=seatLink(window.location.href,id,legacyOnly,eventId,resolve);if(!url)return;
 let copied=false;try{if(navigator.clipboard){await navigator.clipboard.writeText(url);copied=true;}}catch{/* The visible input below remains available for manual copying. */}
 setResult({id,url,copied});
 }
 const current=result?.id===id?result:null;
 return <div className="seat-share"><button onClick={()=>void share()}>{current?.copied?<Check size={14}/>:<Link size={14}/>}Skopiuj link do miejsca</button>{current&&<div role="status">{current.copied?'Link skopiowany. Odbiorca zobaczy ten fotel.':<label>Skopiuj link ręcznie<input readOnly value={current.url} onFocus={e=>e.currentTarget.select()}/></label>}</div>}</div>;
}
