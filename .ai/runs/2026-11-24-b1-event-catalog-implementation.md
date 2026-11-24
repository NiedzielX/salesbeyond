---
started: 2026-11-24T15:43:00Z
ended:
agent: codex-root
spec: .ai/specs/2026-11-24-event-catalog-and-history.md
outcome: in-progress
---

# B1 — implementacja katalogu wydarzeń

## Zadanie

Po zatwierdzeniu właściciela wdrożyć dwa wydarzenia demo, event-scoped routing/session/inventory/hold, chooser oraz Back/Forward. Przygotować addytywną migrację drugiego eventu bez stosowania jej na produkcji i bez deployu.

## Przebieg

- Specyfikacja ustawiona na `in-progress`; osobna zgoda pozostaje wymagana dla produkcyjnej migracji i deployu.
- Pure event catalog/routing/testy delegowane Lunie w osobnym worktree; root integruje hooki, lifecycle i UI.
- Dodano dwa eventy (`enea-demo`, `enea-demo-alt`) ze wspólną geometrią, lecz osobnymi cennikami, storage, inventory i flow holda.
- Wydzielono event-keyed `EventExperience`; przełączenie eventu odmontowuje subskrypcje/timery poprzedniego flow bez zwalniania serwerowego holda.
- Dodano chooser, kanoniczne linki `event`/`seat`, Back/Forward, blokadę zmiany przy holdzie oraz fail-closed powrót do eventu wskazanego przez lokalny, nieautorytatywny pointer holda.
- Historyczny renderer jest ograniczony do default eventu. Link do miejsca zawiera event, a zapis v1 migruje logicznie tylko dla default eventu.
- Migracja `20261124120000_enea_demo_alt.sql` została sprawdzona w ephemeral PostgreSQL; nie zastosowano jej na produkcji.
- Niezależny review Luny wykrył brak restore fotela w historii, utratę seat w URL blokowanego holda i wejście eventu B przez renderer legacy; wszystkie trzy problemy naprawiono.
- Browser QA wykrył utratę ceny eventu przez globalną kanonizację selection. Dodano jawny eventowy rekord canonical bez zezwalania na obcą geometrię.

## Weryfikacja

- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm test` — 199/199 + test wyemitowanego API 1/1 pass.
- `npm run build` — pass; istniejące ostrzeżenie o dużym lazy chunku stadionu pozostaje poza B1.
- Izolowany PostgreSQL 17.6 — pełne testy holdów i idempotentnej migracji pass; 38 078 miejsc eventu B, ceny +20%, zgodna geometria/stany.
- Browser desktop fallback: event A seat `101-1-1` = 65 zł, Back odtwarza event i fotel; event B ten sam seat = 78 zł.
- Browser mobile 390×844: event B aktywny, brak poziomego overflow (`scrollWidth=clientWidth=390`), brak błędów konsoli poza oczekiwanym brakiem lokalnego endpointu Vercel.
- Test domenowy potwierdza osobne klucze/koszyki eventów i brak migracji v1 do eventu B.

## Wynik

Kod B1 jest gotowy lokalnie do finalnego przeglądu i autoryzowanego wdrożenia. Produkcyjna migracja drugiego eventu oraz deploy pozostają niewykonane i wymagają osobnej zgody właściciela.
