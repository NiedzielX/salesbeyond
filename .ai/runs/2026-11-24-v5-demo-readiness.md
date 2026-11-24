---
started: 2026-11-24T15:25:00Z
ended: 2026-11-24T15:27:00Z
agent: codex-root
spec: docs/FAN_EXPERIENCE_ROADMAP.md
outcome: success
---

# V5 — powtarzalne demo dla klubu

## Zadanie

Złożyć odebrane V1–V4 w krótki, powtarzalny scenariusz na stałym linku, z dokładnymi akcjami, jawnymi danymi demo, cleanupem blokady i planem awaryjnym bez WebGL.

## Weryfikacja

- Stały link produkcyjny został ponownie użyty przez pełny przebieg V3 i macierz V4 bez błędów aplikacji.
- Dokładna ścieżka 2D → `II-2-1-16` → WebGL2 → grupa → quote → hold → reload → release jest powtarzalna przez `docs/qa-evidence/v3-contiguous-flow-2026-11-24/probe-production.mjs`.
- Fallback 2D, mobile 390×844, klawiatura i tryby gestów mają oddzielne dowody B3/V4.
- Runbook kończy aktywny hold przez release i nie zależy od dziesięciominutowego oczekiwania.
- Końcowe bramki repozytorium: lint pass, typecheck pass, 190 testów aplikacji + 1 test emitowanego API pass, build pass. Pozostaje znane ostrzeżenie Vite o chunkach `Stadium` i `dist` większych niż 500 kB.

## Wynik

V5 przyjęte. `docs/DEMO_RUNBOOK.md` jest kanonicznym scenariuszem prezentacji 6–7 minut. Oddziela demo od oficjalnego planu/cennika, opisuje fallback 2D oraz pozostawia fizyczny telefon, ręczny AT i sprzętową wydajność jako checklistę pilota.
