---
started: 2026-11-22
ended: null
agent: /root
spec: .ai/specs/2026-11-17-functional-stadium-mvp.md
outcome: partial
---

# Zadanie

Domknąć źródłową część A3 dla klawiatury w gęstej siatce miejsc: jeden wejściowy tab-stop na rząd i jawna nawigacja Left/Right/Home/End bez automatycznej zmiany wyboru.

## Przebieg

- Przed zmianą każdy fotel w widocznym rzędzie był osobnym tab-stopem.
- Dodano czysty, ograniczony helper indeksu i regresje granic.
- Siatka jest nazwaną grupą; wybrany lub pierwszy fotel jest wejściowym tab-stopem. Strzałki i Home/End przenoszą sam fokus, Enter/Spacja zachowują natywny klik, zajęte miejsca pozostają dostępne do podglądu.
- Targeted 2/2, typecheck i lint pass. Niezależny read-only review Luny: bez must-fix; grupa, fallback tab-stop, wszystkie fotele, native Enter/Space i wyjście Tab/Shift+Tab zachowane.
- Pełne bramki: lint pass, typecheck pass, 171 testów JS + 1 emitted API pass, build pass (istniejące ostrzeżenie o dużych chunkach). Ręczny keyboard/screen-reader browser acceptance pozostaje otwarty.

## Wynik

Kod gotowy do wdrożenia; produkcyjny proof w toku.
