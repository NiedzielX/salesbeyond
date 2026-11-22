---
started: 2026-11-22
ended: null
agent: /root
spec: .ai/specs/2026-11-17-functional-stadium-mvp.md
outcome: partial
---

# Zadanie

Kontynuować zatwierdzone R-Q1: zachować punktowe aktualizacje kolorów foteli również na granicy uploadu GPU, zamiast oznaczać cały atrybut koloru do ponownego przesłania.

## Przebieg

- Start z czystego `bf96dc8`; poprzedni przyrost pointer ownership jest już production READY.
- Audyt Three 0.181.2 potwierdził, że `needsUpdate` bez `updateRanges` wysyła cały bufor, mimo że `setColorAt` zmienia tylko pojedyncze indeksy.
- Dodano koaleskowane zakresy komponentów RGB dla obu siatek. Pierwszy nowy atrybut nie dostaje pełnego range (pełny `bufferData` już go tworzy), a callback uploadu czyści częściowe zmiany, które mogły pojawić się przed pierwszym renderem. Istniejący atrybut dostaje jawny pełny zakres i zachowuje callback właściciela.
- Regresja zachowuje dwie niezależne zmiany przed uploadem; test mutacyjny niezależnego review potwierdził, że wykrywa przypadkowe czyszczenie kolejki.

## Weryfikacja

- Przed poprawką targeted 5/6: brak zakresów (0 zamiast 648 komponentów w reprodukcji).
- Po poprawce targeted 8/8, typecheck i lint pass.
- `probe-webgl-attributes.mjs`: C2/3877, inicjalizacja 93 048 B, pojedynczy hover 24 B, zakolejkowane zmiany 72 B, wersje macierzy bez zmiany.
- Niezależny review A1: kod produkcyjny bez must-fix po obsłudze initial/delayed upload; rekomendowana silniejsza regresja akumulacji dodana.
- Pełne `npm test` 166+1, `npm run build`, wcześniejsze lint/typecheck i `git diff --check`: pass. Znane ostrzeżenie dużego chunku Stadium pozostaje.

## Wynik

Kod, regresje i niezależny review gotowe; oczekuje na pełne bramki, commit i wdrożenie.

## Lekcje

Brak nowych na tym etapie.
