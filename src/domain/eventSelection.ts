import type {SeatRuleResult,EventStatus} from './seatRules.ts';
export function eventSelectionLabel(status:EventStatus){return status==='open'?'Wybór otwarty':status==='closed'?'Wybór zamknięty':'Brak wolnych miejsc';}
export function seatRuleMessage(reason:SeatRuleResult['reason']){
 switch(reason){
 case 'closed':return 'Wybór na to wydarzenie jest zamknięty. Nadal możesz oglądać stadion i miejsca.';
 case 'sold-out':return 'Brak wolnych miejsc na to wydarzenie. Podgląd perspektyw pozostaje dostępny.';
 case 'orphan-seat':return 'Ten wybór pozostawi pojedynczy wolny fotel. Wybierz inne miejsce, dodaj całą grupę lub wyłącz tę preferencję.';
 case 'limit':return 'Limit wyboru wynosi 10 miejsc. Usuń część obecnego wyboru.';
 case 'unavailable':return 'Jedno z miejsc nie jest już dostępne w katalogu demo. Sprawdź wybór ponownie.';
 case 'unknown-seat':return 'Nie rozpoznano jednego z miejsc. Wybierz je ponownie na planie stadionu.';
 case 'invalid-limit':return 'Wybór jest chwilowo niedostępny. Możesz nadal oglądać miejsca.';
 default:return '';
 }
}
