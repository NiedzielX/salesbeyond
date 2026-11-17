---
started: 2026-11-17T15:38:22+01:00
ended: 2026-11-17T15:42:53+01:00
agent: Codex / root
spec: .ai/specs/2026-11-17-functional-stadium-mvp.md
outcome: partial
---

## Zadanie
Przyjąć przekazany AGENTS.generic.md, rozpoznać istniejący projekt, zapisać stan wyjściowy i przygotować specyfikację funkcjonalnego MVP do zatwierdzenia. Nie zmieniać kodu aplikacji podczas rozpoznania.

## Przebieg
- Przeczytano cały AGENTS.generic.md. Nie znaleziono istniejącego AGENTS.md ani .ai/lessons.md w repozytorium.
- Przeczytano README, package.json, konfigurację TypeScript/Vite/Vercel/Sites i historię (jeden commit 3d3c307).
- Utworzono osobny worktree i gałąź chore/adopt-agent-process; main pozostaje bez zmian.
- Uzgodniony zakres: uproszczone 3D inspirowane Enea Stadionem, trzy sektory, wybór rzędu i miejsca, przelot, podsumowanie. Bez fotorealizmu, VIP i systemu sprzedaży.
- Właściciel wyraźnie zezwolił na tańsze modele przy delegacji.
- Skopiowano nowy AGENTS.generic.md do AGENTS.md i wypełniono sekcję Projekt obserwacjami z repozytorium; uniwersalne reguły zachowane.
- Zapisano docs/PROJECT.md, specyfikację draft i lekcję zakresu/delegacji. Nie dodano lintu ani zależności w czasie rozpoznania.
- Audyt kodu i niezależne review specyfikacji delegowano do gpt-6-luna w świeżym kontekście, bez uprawnień do zmian/push/PR.

## Weryfikacja
Stan wyjściowy bez zmian w kodzie, worktree chore/adopt-agent-process:

| Polecenie | Wynik |
|---|---|
| npm ci --cache /workspace/work/npm-cache --no-audit --no-fund | exit 0; 148 pakietów, 5 s |
| npm run lint | exit 1: Missing script lint; brak konfiguracji |
| npm run typecheck | exit 0 |
| npm test | exit 0; 4 testy, 4 pass, 0 fail |
| npm run build | exit 0; 2246 modułów; JS 1190,59 kB / gzip 337,37 kB; ostrzeżenie o paczce >500 kB |

Browser QA: nie sprawdzono — rozpoznanie dotyczy stanu kodu i narzędzi; nie wykonano zmian UI. Poprzedniego problemu relay nie uznano za rozwiązany.

Samodzielna kontrola uwag audytora:
- stadium.ts:13 vs Stadium.tsx:19–24: różne kroki X/Y/Z i przesunięcie DemoSeats +0.4 Y. Potwierdzono niespójność, bez opierania się na przybliżonych wysokościach z raportu.
- App.tsx:8: selectSeat nie ustawia row, mimo że klik 3D może wskazać inny rząd. Dodano kryterium AC2.
- Stadium.tsx:31: OrbitControls obraca pozycję wokół celu boiska. W widoku fotela potrzebne rozglądanie przy stałej pozycji oczu (R4/AC4).
- Ryzyko przechwytywania klików przez nakładkę sektora: wyłącznie hipoteza do browser QA, nie odtworzony błąd.
- Niezależny audyt przeprowadzony przez gpt-6-luna, read-only. Nie przyjęto wycofanej uwagi o zbyt krótkim czasie autotour.

## Wynik
Przygotowano lokalnie AGENTS.md, docs/PROJECT.md i specyfikację MVP w statusie draft. Brak zmian funkcjonalnych, publikacji i scalania. Do rozpoczęcia implementacji wymagana akceptacja właściciela sekcji Projekt i specyfikacji (§1 i §3 AGENTS.md). Nowy dokument zasad zastępuje przekazany wcześniej dokument Wine Match.

Niezależne review specyfikacji: gpt-6-luna wskazał niejednoznaczność pokrycia AC2 i niemierzalność AC4; integrator poprawił oba kryteria. Doprecyzował także klawiaturę/WebGL i uzasadnił pinowanie wersji z lockfile. Samodzielnie odczytano końcowy dokument oraz porównano zmieniane pliki z bazą: wyłącznie dokumentacja. Zmiana manifestu i dodanie lintu pozostają propozycją w specyfikacji, nie implementacją.

Weryfikacja dokumentacji: git diff --cached --check: exit 0; w kodzie aplikacji brak diffu względem 3d3c307.

## Lekcje
.ai/lessons/2026-11-17-mvp-scope-delegation.md — uzgodniony zakres i użycie tańszych modeli.
