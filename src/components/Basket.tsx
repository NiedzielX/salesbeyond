import {Eye,X,Ticket,ArrowRight} from 'lucide-react';
import type {Seat} from '../data/stadium';
import {resolveTicketType,ticketPriceMinor,type DemoEvent} from '../data/event';
import type {TicketTypeBySeat} from '../domain/ticketTypes';
const money=new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN'});
type Props={event:DemoEvent;seats:Seat[];ticketTypeBySeat:TicketTypeBySeat;message:string;onTicketType:(seatId:string,ticketTypeId:string)=>void;onRemove:(id:string)=>void;onClear:()=>void;onPreview:(seat:Seat)=>void;onReview:()=>void;locked?:boolean;live?:boolean};
export default function Basket({event,seats,ticketTypeBySeat,message,onTicketType,onRemove,onClear,onPreview,onReview,locked=false,live=false}:Props){
 const totalMinor=seats.reduce((sum,seat)=>sum+ticketPriceMinor(event,seat,ticketTypeBySeat[seat.id]),0);
 return <section className="basket" aria-label="Koszyk demonstracyjny">
 <div className="basket-heading"><Ticket size={20}/><div><h2>Twój wybór <small>{seats.length} / {event.selectionPolicy.maxSeats}</small></h2><p>{live?'Wybierz rodzaj biletu, sprawdź cenę i potwierdź blokadę poniżej.':'Wybór demonstracyjny — miejsca nie są rezerwowane.'}</p></div>{seats.length>0&&<button className="basket-clear" disabled={locked} onClick={onClear}>Wyczyść</button>}</div>
 <div className="basket-live" role="status">{message}</div>
 {seats.length?<ul className="basket-seats">{seats.map(seat=>{const ticketType=resolveTicketType(event,ticketTypeBySeat[seat.id]);return <li key={seat.id}><div><strong>{seat.standId} · {seat.sectorId}</strong><span>Rząd {seat.row} · Miejsce {seat.number}</span><label>Rodzaj biletu<select aria-label={`Rodzaj biletu dla miejsca ${seat.number}`} disabled={locked} value={ticketType.id} onChange={e=>onTicketType(seat.id,e.target.value)}>{event.ticketTypes.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}</select></label></div><b>{money.format(ticketPriceMinor(event,seat,ticketType.id)/100)}</b><button onClick={()=>onPreview(seat)} aria-label={`Zobacz miejsce ${seat.number} w sektorze ${seat.sectorId}`}><Eye size={15}/></button><button disabled={locked} onClick={()=>onRemove(seat.id)} aria-label={`Usuń miejsce ${seat.number} z sektora ${seat.sectorId}`}><X size={15}/></button></li>})}</ul>:<p className="basket-empty">Obejrzyj perspektywę fotela, a następnie dodaj go do wyboru. Możesz wybrać kilka miejsc.</p>}
 <div className="basket-bottom"><span>Razem demo <strong>{money.format(totalMinor/100)}</strong></span><button disabled={!seats.length} onClick={onReview}>Podsumowanie wyboru <ArrowRight size={15}/></button></div>
 </section>}
