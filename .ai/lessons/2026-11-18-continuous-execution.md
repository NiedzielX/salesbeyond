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
Korekta właściciela 2026-11-19: kilka kolejnych małych przyrostów zakończonych finalem po każdym deploy nadal zmusza właściciela do pilnowania ciągłości. Prowadź większy spójny etap produktu z równoległym audytem braków, implementacją i review. Po zakończeniu jednego podzadania podejmij następne gotowe w tym samym etapie. Nie traktuj samego deploy jako automatycznego kamienia kończącego; nie obiecuj też wielogodzinnej pracy agentów po zakończeniu tury.

Porównuj postęp również z briefem i widocznym doświadczeniem użytkownika. Nie uznawaj audytu integracji i zielonych testów za dowód braku dalszych prac produktowych. Rozdziel gotowy kod, jakość doświadczenia i faktyczny odbiór. Po wskazaniu przez właściciela, że MVP jest daleko od celu, ponownie oceń konkretne luki produktu zamiast powtarzać własną deklarację ukończenia planu.

Prowadź jeden plan wykonawczy całego zatwierdzonego MVP. Po przyroście wybierz kolejną gotową pozycję bez oddawania tury tylko z powodu zielonych testów lub commitu. Zablokuj wyłącznie zadania zależne od brakującej możliwości i realizuj pozostałe. Dawaj krótkie aktualizacje w trakcie. Nie wymyślaj nowych funkcji ani kosmetycznych zadań, żeby pozornie przedłużać pracę. Zakończ przy osiągniętym kamieniu milowym, koniecznej decyzji właściciela albo rzeczywistej blokadzie pozostałych działań.

## Jak sprawdzić
Sprawdź .ai/EXECUTION_PLAN.md: źródło zakresu, gotowe zadania, zależności, dowody ukończenia i dokładne blokady. Po każdym etapie odnotuj, które następne zadanie zostało podjęte. Nowy zakres nadal wymaga specyfikacji i decyzji człowieka.
