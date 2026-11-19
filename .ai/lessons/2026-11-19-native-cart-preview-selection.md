---
date: 2026-11-19
area: renderer-integration
status: active
source: testy kontraktu nativeMap i implementacja wielu ID koszyka
---

## Kontekst
Pełny koszyk ma 10 ID. Podgląd kolejnego, także zajętego fotela jest niezależny od koszyka. Natywny renderer ma własną listę zaznaczeń i limit; progressive reveal może odtworzyć warstwę miejsc.

## Przyczyna
Odtworzenie wyłącznie aktywnego fotela kasuje wizualne oznaczenia wcześniejszego wyboru. Limit renderera równy limitowi koszyka może blokować gest wskazania kolejnego podglądu, zanim host przetłumaczy callback. Polecenia clear/select mogą synchronicznie wywoływać zwrotne zdarzenia wyboru.

## Reguła
Trzymaj koszyk i aktywny podgląd oddzielnie. Odtwarzaj sumę kanonicznych dostępnych ID koszyka i aktywnego fotela; nie zmieniaj zajętości przy podglądzie. Daj rendererowi miejsce na aktywny podgląd i przejściowy gest (tu maxSelection=12), zachowując domenowy limit koszyka 10. Odtwarzaj pod command guard po progressive reveal, ignoruj callbacki po dispose i nie dodawaj do koszyka przez echo programu.

## Jak sprawdzić
src/integrations/nativeMap.test.ts sprawdza 10 foteli + zajęty podgląd, deduplikację, progressive reveal, zmianę bloku i usuwanie bez callbacków hosta. src/domain/seat-feedback.test.ts sprawdza priorytet koloru podglądu/statusu/koszyka. Testy kontraktu nie zastępują odbioru w rzeczywistej przeglądarce.
