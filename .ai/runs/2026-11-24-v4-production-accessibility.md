---
started: 2026-11-24T15:22:00Z
ended: 2026-11-24T15:24:34Z
agent: codex-root
spec: .ai/specs/2026-11-21-seatlayer-feature-parity.md
outcome: success-with-limitations
---

# V4 — produkcyjna klawiatura, dotyk i reduced motion

## Zadanie

Uzupełnić istniejący odbiór 390×844 o produkcyjny przebieg klawiatury/fokusu, przełącznika gestów i porównanie czasu dotarcia kamery dla `prefers-reduced-motion`. Nie przedstawiać emulacji, SwiftShadera ani semantycznego odczytu DOM jako fizycznego telefonu, sprzętowego GPU lub ręcznego czytnika ekranu.

## Weryfikacja

- Produkcyjny desktop 1440×900: `Tab` przeniósł fokus `Poprzednie → Na boisko`, `Shift+Tab` wrócił do `Poprzednie`; `Enter` zmienił miejsce `16 → 17`, a `Space` `17 → 16`; `scrollDelta=0`, zero błędów.
- Produkcyjna emulacja touch 390×844: `16 → 17`, `scrollWidth=390`; wszystkie trzy kontrolki mają wysokość 44 px.
- Przełącznik gestów: `aria-pressed false → true → false`; statusy jawnie komunikują sterowanie sceną i powrót pionowego przewijania strony.
- `prefers-reduced-motion`: oba warianty dotarły do poprawnego fotela; SwiftShader zanotował 8010 ms dla `reduce` i 11711 ms dla `no-preference`. To wyłącznie relatywny dowód zachowania, nie baseline wydajności urządzenia.
- Obraz mobilny obejrzany: scena, kontrolki, ticket, koszyk i hold nie wychodzą poza 390 px.
- Dowody: `docs/qa-evidence/v4-accessibility-2026-11-24/verification.json`, `mobile-touch-modes.png`, `probe-production.mjs` oraz wcześniejsza macierz fallback/context-loss w `docs/qa-evidence/b3-seat-navigation-2026-11-24/verification.json`.

## Wynik

Automatyzowalny zakres V4 dla MVP przyjęty: klawiatura, focus, emulowany touch, 44 px, tryby gestów, brak overflow, reduced motion oraz fallback mają browser evidence. Pilot na fizycznym telefonie, ręczny czytnik ekranu i hardware-GPU frame-time/memory pozostają jawnie otwarte; SwiftShader ani DOM nie są ich zamiennikiem.
