import {useEffect,useId,useRef,useState} from 'react';
import {Clock3,ShieldCheck,RefreshCw} from 'lucide-react';
import type {Seat} from '../data/stadium';
import type {useLiveHold} from './useLiveHold';
type Props={service:ReturnType<typeof useLiveHold>;seats:readonly Seat[];avoidSingle:boolean;onPreview:(seat:Seat)=>void;resolve:(id:string)=>Seat|null};
const money=(minor:number,currency='PLN')=>new Intl.NumberFormat('pl-PL',{style:'currency',currency}).format(minor/100);
const messages:Record<string,string>={held:'Ktoś właśnie zablokował część miejsc. Zmień wybór i sprawdź go ponownie.',unavailable:'Część miejsc jest już niedostępna. Sprawdź inny wybór.',catalog_changed:'Zmieniono katalog. Sprawdź aktualną cenę i dostępność.',event_closed:'Wybór na to wydarzenie jest zamknięty.',single_seat_gap:'Ten wybór pozostawi pojedyncze wolne miejsce. Zmień grupę lub preferencję.',seat_limit:'Przekroczono limit miejsc.',rate_limited:'Za dużo prób. Odczekaj minutę przed ponowieniem.',not_found:'Nie znaleziono aktywnej blokady w tej sesji.',active_hold_exists:'W tej sesji jest już inna blokada. Odśwież jej stan.'};
export default function LiveHoldPanel({service,seats,avoidSingle,onPreview,resolve}:Props){
 const titleId=useId(),{mode,state}=service;
 const [now,setNow]=useState(Date.now);
 const refresh=useRef(service.refresh);refresh.current=service.refresh;
 const expires=state?.phase==='active'?state.hold.expiresAt:null;
 useEffect(()=>{if(!expires)return;let checked=false;const tick=()=>{const time=Date.now();setNow(time);if(!checked&&Date.parse(expires)<=time){checked=true;void refresh.current();}};tick();const timer=window.setInterval(tick,1000);return()=>clearInterval(timer);},[expires]);
 if(mode==='demo')return null;
 if(mode!=='service')return <section className="hold-panel hold-neutral" aria-label="Dostępność wspólna"><p role="status">{mode==='loading'?'Sprawdzam usługę miejsc…':'Usługa miejsc jest chwilowo niedostępna. Możesz nadal oglądać stadion. Żadne nowe miejsca nie zostały zablokowane.'}</p></section>;
 if(!state)return null;
 const hold='hold' in state?state.hold:null;
 const quote='quote' in state?state.quote:null;
 const error='error' in state?state.error:null;
 const ids=seats.map(s=>s.id).sort().join('|');
 const currentQuote=quote&&quote.items.map(s=>s.seatId).sort().join('|')===ids&&!!quote.avoidSingle===avoidSingle;
 const remaining=hold?Math.max(0,Math.ceil((Date.parse(hold.expiresAt)-now)/1000)):0;
 const active=state.phase==='active'&&remaining>0;
 const pending=['quoting','creating','restoring'].includes(state.phase)||state.phase==='active'&&!!state.operation;
 const ambiguous=state.phase==='create-unknown'||state.phase==='restore-unknown';
 const rows=hold?.items??(currentQuote?quote?.items:null);
 const currency=hold?.currency??quote?.currency??'PLN';
 return <section className={`hold-panel ${active?'hold-active':''}`} aria-labelledby={titleId}>
  <div className="hold-heading"><ShieldCheck size={22}/><div><span className="small-label">WYDARZENIE DEMO · WSPÓLNA DOSTĘPNOŚĆ</span><h2 id={titleId}>{active?(state.phase==='active'&&state.source==='recovered'?'Przywrócono Twoją blokadę':'Miejsca są czasowo zablokowane'):state.phase==='terminal'?'Blokada zakończona':'Potwierdź swój wybór'}</h2></div></div>
  <p>{active?'Blokada dotyczy wskazanych miejsc w tym wydarzeniu demo. Możesz obejrzeć ich perspektywę lub zwolnić całą grupę.':'Plan stadionu i ceny na nim są poglądowe. Tutaj sprawdzisz bieżącą dostępność i cenę na serwerze przed czasową blokadą.'}</p>
  {hold&&<div className="hold-clock" aria-live="off"><Clock3 size={18}/>{active?<>Pozostało <strong>{Math.floor(remaining/60)}:{String(remaining%60).padStart(2,'0')}</strong></>:hold.status==='released'?'Miejsca zostały zwolnione.':'Termin blokady minął. Sprawdź dostępność ponownie.'}</div>}
  {rows&&<ul className="hold-items">{rows.map(item=>{const seat=resolve(item.seatId);return <li key={item.seatId}><span>{seat?`${seat.sectorId} · rząd ${seat.row} · miejsce ${seat.number}`:item.seatId}</span><b>{money(item.priceMinor,currency)}</b>{seat&&<button aria-label={`Zobacz perspektywę: sektor ${seat.sectorId}, rząd ${seat.row}, miejsce ${seat.number}`} onClick={()=>onPreview(seat)}>Zobacz</button>}</li>;})}</ul>}
  {(hold||currentQuote)&&<div className="hold-total">Cena potwierdzona przez serwer <strong>{money(hold?.subtotalMinor??quote!.subtotalMinor,currency)}</strong></div>}
  <div className="hold-status" role="status" aria-live="polite">{pending?(state.phase==='quoting'?'Sprawdzam dostępność i cenę…':state.phase==='creating'?'Potwierdzam blokadę całej grupy…':state.phase==='active'&&state.operation==='releasing'?'Zwalniam grupę miejsc…':'Sprawdzam aktualny stan blokady…'):ambiguous?'Nie otrzymano pewnego potwierdzenia. Ponów tę samą operację — nie tworzymy nowego żądania.':error?messages[error.code]??'Nie udało się potwierdzić operacji. Sprawdź połączenie i spróbuj ponownie.':state.phase==='quoted'&&currentQuote?'Dostępność jest aktualna w chwili sprawdzenia. Dopiero potwierdzenie blokady zabezpiecza miejsca.':''}</div>
  <div className="hold-actions">
   {ambiguous?<button className="primary-button" onClick={()=>void service.retry()}><RefreshCw size={16}/> Sprawdź ponownie tę operację</button>:state.phase==='active'?<><button disabled={!!state.operation} onClick={()=>void service.refresh()}>Odśwież stan</button><button disabled={!!state.operation} onClick={()=>void service.release()}>Zwolnij całą grupę</button></>:<><button disabled={pending||!seats.length} onClick={()=>void service.quote(seats.map(s=>s.id),avoidSingle)}>{currentQuote?'Sprawdź ponownie':'Sprawdź dostępność i cenę'}</button>{state.phase==='quoted'&&currentQuote&&<button className="primary-button" onClick={()=>void service.create()}>Potwierdź blokadę miejsc</button>}</>}
  </div>
  <small className="hold-disclaimer">Blokada testowa nie jest biletem ani zakupem. Płatności nie są podłączone.</small>
 </section>;
}
