---
date: 2026-11-18
area: camera-integration
status: active
source: niezależne review i test regresji lokalnego adaptera
---

## Kontekst
Runtime zwraca Promise z flyToSeat. Deklaracja jawnie mówi o rozwiązaniu Promise także przy przeciągnięciu anulującym lot i disposal.

## Przyczyna
Adapter uznał każde resolve za sukces i kasował stan flying. UI ogłaszał perspektywę fotela, mimo że kamera nie dotarła. Miniatura już miała kontrolę stopu, lecz status UI nie.

## Reguła
Sprawdzaj faktyczny stan dotarcia przed zgłoszeniem sukcesu. Odróżniaj anulowanie od awarii i ukończenia. Zachowuj wybrane miejsce, ale nie podpisuj przerwanego widoku jako widoku z fotela. Unieważniaj spóźnione wyniki lotów po resecie i unmount.

## Jak sprawdzić
Test w src/integrations/localVenue.test.ts: rozwiąż lot przy seatViewStop=null; oczekuj arrived=false i braku obrazu. Przed poprawką26/27, po27/27. Na działającym GPU przerwać przeciągnięciem, sprawdzić komunikat i retry — ten krok wizualny pozostaje niewykonany.
