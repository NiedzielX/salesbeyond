---
started: 2026-11-17T15:44:43.144129+01:00
ended: 2026-11-17T15:51:12+01:00
agent: Codex
spec: .ai/specs/2026-11-17-functional-stadium-mvp.md
outcome: partial
related: .ai/runs/2026-11-17-adopt-agent-process.md
---

## Zadanie
Implementacja zatwierdzonego MVP.

## Przebieg
- Zgoda właściciela: „zatwierdzam”. Przeczytano zasady i lekcję.
- Stan wyjściowy z poprzedniego logu: typecheck/build OK, testy 4/4, brak lint.

## Weryfikacja
Kontrole wykonane na końcowym kodzie:
- npm ci --cache /workspace/work/npm-cache --no-audit --no-fund: exit 0 (258 pakietów).
- npm run lint: exit 0.
- npm run typecheck: exit 0.
- npm test: exit 0, 10 testów / 10 pass / 0 fail; w tym 648 miejsc i timer cleanup.
- npm run build: exit 0; 2249 modułów, JS 1193,89 kB/gzip 338,62 kB. Ostrzeżenie bundle >500 kB.
- git diff --check: exit 0 po usunięciu whitespace.
- Browser: uruchomiono cloud browser, sites-preview start zakończone timeout relay portu 4173; sites-preview status = stopped. Nie ma zrzutów nowej aplikacji. Nie sprawdzono mobile/desktop, raycast, widoku z fotela ani klawiatury w przeglądarce.
- Dodane developerskie zależności: eslint 9.39.1 (2025-11-03), typescript-eslint 8.46.4 (2025-11-10), daty odczytane z registry. Npm ostrzega o zakończonym wsparciu tej wersji ESLint; lint działa. Nie aktualizowano pozostałych wersji rozwiązanego drzewa.


## Wynik
Commit implementacyjny ccf5733. Pozostałe dokumenty zapisane w następnym commicie. Brak push, publikacji i scalenia.
- Wspólny layout rzędów i siedzisk eliminuje rozjazd geometrii i danych; dekoracyjne instancje nie dublują miejsc demonstracyjnych.
- Reducer ujednolica wybór sceny/panelu; powrót zachowuje sektor/rząd.
- Kamera interpoluje lot, reduced-motion kończy lot w jednej klatce, rozglądanie zachowuje pozycję oczu.
- Nakładka sektora nie przechwytuje klików miejsc po wejściu w sektor. Należy potwierdzić rzeczywisty raycast w QA.
- Dodano jawny fallback WebGL i blokadę autotour przy niedostępnej scenie.
- Po repro z audytu (odmienne wzory rzędów, brak aktualizacji row) dodano regresje; testy danych i domeny są zielone. Nie twierdzimy, że wykonano demonstrację red/green — zapisane kroki odtworzenia były w poprzednim logu.
- Niezależny review przez gpt-6-luna w świeżym kontekście, bez zapisów i bramek: brak potwierdzonych błędów. Integrator sam przeczytał diff i uruchomił kontrole. Nie przyjęto tego za dowód browser QA.
- Spec pozostaje in-progress; AC wizualne niewykonane przez awarię infrastruktury. Nie rozszerzano zakresu o fotorealizm, VIP, backend ani produkcyjną sprzedaż.

## Lekcje
.ai/lessons/2026-11-17-preview-qa-limit.md — awaria relay nie pozwala zaliczyć odbioru wizualnego.
