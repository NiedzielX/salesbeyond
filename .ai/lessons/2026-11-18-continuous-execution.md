---
date: 2026-11-18
area: execution
status: active
source: korekta właściciela „zbyt często przestajesz pracę”
---

## Kontekst
Agent kończył turę po lokalnym przyroście i bramkach, mimo że pozostawały kolejne zadania w zatwierdzonym MVP. Właściciel kilkukrotnie musiał pisać „kontynuuj”.

## Przyczyna
Commit i raport potraktowano jak koniec celu, a blokadę GPU jak blokadę całej pracy. Brakowało kolejki zależnych i niezależnych prac obejmującej cały odbiór.

## Reguła
Prowadź jeden plan wykonawczy całego zatwierdzonego MVP. Po przyroście wybierz kolejną gotową pozycję bez oddawania tury tylko z powodu zielonych testów lub commitu. Zablokuj wyłącznie zadania zależne od brakującej możliwości i realizuj pozostałe. Dawaj krótkie aktualizacje w trakcie. Nie wymyślaj nowych funkcji ani kosmetycznych zadań, żeby pozornie przedłużać pracę. Zakończ przy osiągniętym kamieniu milowym, koniecznej decyzji właściciela albo rzeczywistej blokadzie pozostałych działań.

## Jak sprawdzić
Sprawdź .ai/EXECUTION_PLAN.md: źródło zakresu, gotowe zadania, zależności, dowody ukończenia i dokładne blokady. Po każdym etapie odnotuj, które następne zadanie zostało podjęte. Nowy zakres nadal wymaga specyfikacji i decyzji człowieka.
