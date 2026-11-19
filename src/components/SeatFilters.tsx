import {SlidersHorizontal,RotateCcw} from 'lucide-react';
import {defaultSeatFilters,type SeatFilters as Filters} from '../domain/seatSearch';
type Props={filters:Filters;matching:number;total:number;scope:string;onChange:(filters:Filters)=>void;avoidSingles:boolean;onAvoidSingles:(value:boolean)=>void};
const count=new Intl.NumberFormat('pl-PL');
export default function SeatFilters({filters,matching,total,scope,onChange,avoidSingles,onAvoidSingles}:Props){
 return <section className="seat-filters" aria-label="Filtry wyszukiwania miejsc">
  <div className="filter-heading"><SlidersHorizontal size={18}/><div><strong>Znajdź swoje miejsce</strong><span>{scope} · ceny i dostępność demo</span></div></div>
  <label className="price-filter">Cena za osobę<select value={filters.maxPrice} onChange={e=>onChange({...filters,maxPrice:Number(e.target.value)})}><option value={0}>Każda cena</option>{[65,75,85,95].map(price=><option key={price} value={price}>Do {price} zł</option>)}</select></label>
  <label className="available-filter"><input type="checkbox" checked={filters.availableOnly} onChange={e=>onChange({...filters,availableOnly:e.target.checked})}/>Tylko wolne w wynikach</label>
  <label className="available-filter" title="Preferencja dla nowych dodań do wyboru; usuwanie miejsc pozostaje dostępne."><input type="checkbox" checked={avoidSingles} onChange={e=>onAvoidSingles(e.target.checked)}/>Nie zostawiaj pojedynczych miejsc</label>
  <div className="filter-count" role="status"><strong>{count.format(matching)}</strong><span>pasujących z {count.format(total)} miejsc</span></div>
  <button className="filter-reset" aria-label="Wyczyść filtry ceny i dostępności" disabled={filters.maxPrice===defaultSeatFilters.maxPrice&&filters.availableOnly===defaultSeatFilters.availableOnly} onClick={()=>onChange({...defaultSeatFilters})}><RotateCcw size={15}/><span>Wyczyść</span></button>
 </section>;
}
