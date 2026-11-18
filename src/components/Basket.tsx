import {Eye,X,Ticket,ArrowRight} from 'lucide-react';
import {basketLimit,basketTotal} from '../domain/basket';
import type {Seat} from '../data/stadium';
const money=new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN'});
type Props={seats:Seat[];message:string;onRemove:(id:string)=>void;onClear:()=>void;onPreview:(seat:Seat)=>void;onReview:()=>void};
export default function Basket({seats,message,onRemove,onClear,onPreview,onReview}:Props){return <section className="basket" aria-label="Koszyk demonstracyjny">
 <div className="basket-heading"><Ticket size={20}/><div><h2>Twój wybór <small>{seats.length} / {basketLimit}</small></h2><p>Wybór demonstracyjny — miejsca nie są rezerwowane.</p></div>{seats.length>0&&<button className="basket-clear" onClick={onClear}>Wyczyść</button>}</div>
 <div className="basket-live" role="status">{message}</div>
 {seats.length?<ul className="basket-seats">{seats.map(seat=><li key={seat.id}><div><strong>{seat.standId} · {seat.sectorId}</strong><span>Rząd {seat.row} · Miejsce {seat.number}</span></div><b>{money.format(seat.price)}</b><button onClick={()=>onPreview(seat)} aria-label={`Zobacz miejsce ${seat.number} w sektorze ${seat.sectorId}`}><Eye size={15}/></button><button onClick={()=>onRemove(seat.id)} aria-label={`Usuń miejsce ${seat.number} z sektora ${seat.sectorId}`}><X size={15}/></button></li>)}</ul>:<p className="basket-empty">Obejrzyj perspektywę fotela, a następnie dodaj go do wyboru. Możesz wybrać kilka miejsc.</p>}
 <div className="basket-bottom"><span>Razem <strong>{money.format(basketTotal(seats))}</strong></span><button disabled={!seats.length} onClick={onReview}>Podsumowanie wyboru <ArrowRight size={15}/></button></div>
 </section>}
