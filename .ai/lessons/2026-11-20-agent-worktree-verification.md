---
date: 2026-11-20
area: collaboration
status: active
source: równoległa integracja wspólnej dostępności
---

## Kontekst
Dwa zadania agentów miały dostarczyć patch spoza worktree, lecz zmiany sceny i mapy pojawiły się bezpośrednio w worktree integratora. Zakresy plików były rozdzielone; wykryto to przez git status przed zastosowaniem patchy.

## Przyczyna
Sam brief „pracuj w izolowanej kopii” nie zapewnił faktycznej izolacji. Agent potwierdził użycie wspólnej ścieżki. Raport testów nie dowodzi poprawnej lokalizacji ani czystości zmian.

## Reguła
Przed następną delegacją implementacji utwórz konkretny osobny git worktree i wskaż jego bezwzględną ścieżkę. Przed pierwszym zapisem agent musi potwierdzić git rev-parse --show-toplevel i branch. Sprawdzaj git status integratora zanim zastosujesz patch; jeśli pliki już zmieniono, zatrzymaj pozostałe zapisy i przejrzyj rzeczywisty diff. Nie aplikuj ponownie tego samego patcha. Root sam integruje, naprawia typecheck i uruchamia bramki.

## Jak sprawdzić
Log wskazuje faktyczne ścieżki i zmodyfikowane pliki, a izolowany worktree ma własną gałąź. W tym przebiegu oba procesy zapisujące zostały zatrzymane, root przeczytał diff, poprawił typy oraz semantykę own-held vs cudzego held i sprawdził pełne bramki.
