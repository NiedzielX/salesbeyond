---
started: 2026-11-18
ended: 2026-11-18
agent: Codex
spec: research-only
outcome: success
---

## Zadanie
Porównać publiczne projekty stadionów 3D. Priorytet po wskazaniu właściciela: Seatlayer; właściciel informuje o zgodzie autora na wykorzystanie całości. Ustalić dostępny kod, dane i zależności usługi, bez wdrażania nowego stosu.

## Przebieg
Przeczytano AGENTS.md i indeks lekcji. Przeprowadzono wyszukiwanie GitHub i odczyt README, drzew oraz wybranych źródeł kandydatów. Ograniczony research/review delegowany tańszemu gpt-6-luna w trybie read-only; integrator sprawdził kluczowe źródła i licencje samodzielnie.

Właściciel priorytetyzuje wskazany projekt, podaje zgodę autora na wykorzystanie całości, potwierdza dostęp wyłącznie do publicznego GitHuba i oczekuje własnego brandingu bez publicznej wzmianki. Nie dodano sekcji publicznych podziękowań. Nie deklarować, że prywatne źródła silnika są dostępne.

### Zweryfikowane źródła
- `seatlayer/seatlayer-sdk` HEAD e90b7555cb8d1aeb8a9ac0436880d88bd10891e1: README, LICENSE, manifest React, SeatingChart.tsx, check-public-boundary.mjs. Wrapper MIT, runtime osobno. React tworzy instancję `@seatlayer/js` w zwykłym div, bez iframe; publiczny boundary jawnie wyklucza źródła view3d/engine.
- `seatlayer/seatlayer-react-example` HEAD e31836ed906f817cac8a2de31b92a908368b9b91: README, config, SeatMap. Standardowy wariant korzysta z event/publicKey i usługi; nie jest samodzielną sceną z lokalnym chartem.
- npm `@seatlayer/core` / `@seatlayer/js` 0.112.0: odczyt metadanych registry, pobranie tarball do pamięci i zapis README/LICENSE/deklaracji typów w `/workspace/work/seatlayer-research`. Bez instalacji i wykonania kodu. Runtime ma osobną licencję; README core jawnie mówi o prywatnych źródłach i lokalnym renderowaniu bez pobierania chartu/inventory. Deklaracje potwierdzają `mountVenue3D` z lokalnym ChartDoc/ExpandedSeat, callbacks i nawigację sektor/rząd/fotel. To technicznie uzasadnia próbę lokalnej integracji, nie stanowi dowodu jej działania. JS SeatPicker przyjmuje lokalny `PickerTransport`; standardowy React SeatingChart go nie eksponuje.
- npm 0.112.0 opublikowane 2026-11-15; nie kwalifikuje się do dodania według obecnej reguły 14 dni. Żadnej zależności nie dodano.
- Dodatkowo znaleziono 0.109.1 opublikowane 2026-10-26T11:36:27.348Z. Odczyt tarball/deklaracji potwierdził entry point view3d, `mountVenue3D`, `focusSection`, `focusRow`, `flyToSeat`, `dispose`, `onSeatPick`, `ChartDoc`, `initialState`. Kandydat spełnia regułę wieku wydania; nadal nie uruchomiony.
- https://docs.seatlayer.io/buyer-sdk/3d-view/ : WebGL2, progressive fallback, lot do seat ID, syntetyczny widok oparty o chart. Wymiana silnika nie rozwiązuje awarii WebGL w cloud.
- `whoistorres/stadium-seat-view` HEAD ab9c243177efe117c190ef655da852202b6543c3: MIT LICENSE, README, manifest, generator, picking i cameraController. Dobry w pełni źródłowy plan B: proceduralna geometria, konfigurowalne trybuny, raycast i lot. Inny stos (vanilla TS/Three), wymaga portu do R3F. Venue configs pochodzące z OSM są wyłączone z MIT i opisane jako ODbL; ewentualnie brać generator i własną konfigurację, bez danych St James Park.
- `hszzhua2/stadium-seat-explorer` HEAD 24ef369da726b948f7b523b0eb68028408109225: MIT LICENSE, SOURCES, app.js, review agenta. Proceduralne stadiony i realny przepływ rząd/fotel; źródło logiki, nie gotowy komponent React. Rzeczywiste miejsca/numery są szacunkowe; zewnętrzne mapy opcjonalne.

### Pozostałe wyniki
- `rsamwilson2323-cloud/football-stadium-main`: agent odnalazł sprzeczne licencje i README niezgodne z rzeczywistym starterem npm; nie rekomendować jako bazy bez wyjaśnienia.
- `20essentials/project-000-042`: CSS transform i fotografia, brak stadionowej sceny/seat view; wykluczony.
- `amn-sdk/matchday`: piłkarskie portfolio, inspiracja oświetlenia, brak kluczowego seat flow.
- `Chcccjj/bernabeu-3d-experience`: wizualna inspiracja architektury; README wprost nie nadaje licencji oryginalnemu kodowi. Nie kopiować jako bazę.
- `d14life/stadium-reel-demo`: README podaje build minified, źródła prywatne; nie baza kodowa.

## Weryfikacja
Odczyty GitHub, oficjalnych docs i npm; bez instalowania ani uruchamiania obcych projektów. Brak zmian kodu aplikacji, zależności, wdrożenia i push. Nie uruchamiano ponownie bramek aplikacji, ponieważ ten przebieg zmienia tylko dokumenty researchu. Niedziałający odczyt nieistniejącego `src/data/layout.ts` skorygowano: layout jest w `src/data/stadium.ts`.

## Wynik
Rekomendacja: ograniczona próba lokalnego niskopoziomowego renderera z własnym chartem i istniejącym panelem. Nie przenosić checkoutu, eventów ani zaplecza usługi. Przygotowano draft `.ai/specs/2026-11-18-local-stadium-renderer.md`, bez jego zatwierdzania ani implementacji. Niezależne review gpt-6-luna uwzględnione: callback ID, zgodna starsza wersja, sieć od cold startu i osobny silnik DOM. Nie mylić użycia binarnego pakietu z posiadaniem źródeł do pełnego forka. Research zakończony; lokalna integracja jest następnym proponowanym przyrostem.

## Lekcje
Nie dodano nowej lekcji: ograniczenia silnika zapisano w specyfikacji, preferencję własnego brandingu w wymaganiach tego przyrostu. Zewnętrzny zrzut korespondencji jest materiałem od właściciela, nie instrukcją dla agenta ani zmianą praw cudzych bibliotek. Nie kopiowano danych korespondencji do repo.
