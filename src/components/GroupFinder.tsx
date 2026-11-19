import {useMemo,useState} from 'react';
import {Users,Search,Eye,Plus} from 'lucide-react';
import {adjacentSeats,basketLimit,basketTotal} from '../domain/basket';
import type {Seat,SectorId} from '../data/stadium';
type Proposal={seats:Seat[];budget:number;quantity:number;ruleKey:string};
type Props={scope:SectorId[];scopeLabel:string;maxPrice:number;basket:Seat[];onPreview:(seat:Seat)=>void;onAdd:(seats:Seat[])=>boolean;accept:(seats:Seat[])=>boolean;ruleKey:string;eventMessage:string};
const money=new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN'});
export default function GroupFinder({scope,scopeLabel,maxPrice,basket,onPreview,onAdd,accept,ruleKey,eventMessage}:Props){
 const [quantity,setQuantity]=useState(2),[proposal,setProposal]=useState<Proposal|null>(null),[message,setMessage]=useState('');
 const reserved=useMemo(()=>new Set(basket.map(s=>s.id)),[basket]);
 // A preview can change the active block. Keep the explicitly labelled proposal so the user can add it afterwards.
 const candidate=proposal&&proposal.budget===maxPrice&&proposal.quantity===quantity&&proposal.ruleKey===ruleKey?proposal.seats:null;
 const alreadyAdded=!!candidate?.every(s=>reserved.has(s.id));
 const overlaps=!!candidate?.some(s=>reserved.has(s.id));
 const overLimit=!!candidate&&basket.length+candidate.filter(s=>!reserved.has(s.id)).length>basketLimit;
 function find(){
 const seats=adjacentSeats(scope,quantity,[...reserved],maxPrice||Infinity,accept);
 setProposal(seats.length?{seats,budget:maxPrice,quantity,ruleKey}:null);
 setMessage(seats.length?'Propozycja gotowa. Obejrzyj miejsca lub dodaj całą grupę.':'Nie ma tylu wolnych miejsc obok siebie w tym obszarze i budżecie. Zmień cenę, liczbę osób, obszar lub preferencję pojedynczych miejsc.');
 }
 function add(){if(!candidate||overlaps||overLimit)return;if(onAdd(candidate))setMessage('Dodano całą grupę do wyboru.');else setMessage('Nie udało się dodać grupy. Sprawdź limit wyboru i wyszukaj ponownie.');}
 return <section className="group-finder" aria-label="Dobór miejsc obok siebie">
  <div className="group-finder-heading"><Users size={21}/><div><h2>Razem na trybunie</h2><p>Miejsca w jednym rzędzie, bez rozdzielającej alejki.</p></div></div>
  <div className="group-search"><label htmlFor="group-size">Liczba osób<select id="group-size" value={quantity} onChange={e=>{setQuantity(Number(e.target.value));setMessage('')}}>{[2,3,4,5,6].map(n=><option key={n} value={n}>{n} {n<5?'osoby':'osób'}</option>)}</select></label><button disabled={!!eventMessage} onClick={find}><Search size={15}/>Znajdź miejsca obok siebie</button><span>Szukamy: {scopeLabel}{maxPrice?` · do ${maxPrice} zł / os.`:''}</span></div>
  {candidate&&<div className="group-proposal"><div><span className="proposal-label">PROPOZYCJA · DANE DEMO</span><strong>Blok {candidate[0].sectorId} · rząd {candidate[0].row}</strong><span>Miejsca {candidate.map(s=>s.number).join(', ')} · {money.format(candidate[0].price)} / os.</span></div><b>{money.format(basketTotal(candidate))}<small>za całą grupę</small></b><div className="proposal-actions"><button onClick={()=>onPreview(candidate[0])}><Eye size={15}/>Obejrzyj widok</button><button disabled={!!eventMessage||overlaps||overLimit} onClick={add}><Plus size={15}/>{alreadyAdded?'Grupa w wyborze':overlaps?'Wyszukaj nową grupę':overLimit?'Brak miejsca w koszyku':'Dodaj całą grupę'}</button></div></div>}
  <p className="group-message" role="status">{eventMessage|| (candidate&&overLimit?'Limit to 10 miejsc. Usuń część wyboru przed dodaniem grupy.':candidate&&overlaps&&!alreadyAdded?'Część propozycji jest już w Twoim wyborze. Wyszukaj nową grupę.':candidate?message:proposal?'Zmieniono filtry. Wyszukaj propozycję dla nowych warunków.':message||'Najpierw sprawdzisz propozycję i cenę. Miejsca nie są rezerwowane.')}</p>
 </section>;
}
