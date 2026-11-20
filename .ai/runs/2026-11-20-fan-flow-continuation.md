---
started: 2026-11-20
ended: 2026-11-20
agent: /root
spec: .ai/specs/2026-11-17-functional-stadium-mvp.md
outcome: partial
---

# Zadanie
Po wdrożeniu architektury18e1630 kontynuować gotowe zadania pełnej ścieżki kibica, bez czekania na kolejną wiadomość. Naprawić konkretne usterki ujawnione przez niezależny audyt kodu: znikająca grupa podczas pollingu/podglądu, powrót z dolnych list do sceny, fokus przy starcie i dialog na niskim ekranie.

## Przebieg
- Source audit Sol: `ruleKey` zawierał updatedAt, więc pierwsze wejście do bloku i każde15s unieważniało propozycję mimo niezmienionych filtrów. Prześledzono warunek GroupFinder i zmianę znacznika w useSectionInventory. Odbiór w przeglądarce nadal zablokowany, nie deklarujemy odtworzenia na ekranie.
- Powtórny podgląd z koszyka/grupy/holda nie zmieniał view='seat'; efekt fokus/scroll go pomijał, a ponowny wybór tego samego fotela ustawiał flying bez zmiany zależności kamery. Efekt wykonywał też fokus na pierwszym montażu.
- Modal miał stałe wyśrodkowanie bez ograniczenia wysokości/przewijania. Maksymalny koszyk i zoom/landscape mogły uciąć akcje.
- Zakres istniejącej specyfikacji: pełne grupy/koszyk i R7, bez nowej infrastruktury/zakupu/płatności. Implementuje root w istniejącym worktree; agent tylko read-only.
- Zmieniono klucz polityki bez czasu odczytu; propozycja zachowuje ID i uzupełnia aktualne ceny/statusy, a konkretny problem blokuje dodanie całej grupy. Ostateczny precheck używa resolveCurrent zamiast starego katalogu.
- Podglądy z trzech dolnych list dostają licznik jawnego żądania: post-render focus/scroll, ponowny lot do tego samego fotela oraz focusRequest dla natywnej2D. Polling nie zmienia tego licznika i nie centruje mapy. Fallback mapy resetuje pan/zoom tylko przy jawnym żądaniu. Brak fokusu przy pierwszym montażu, kontekst awaryjny/modal zachowany.
- Modal dostał granicę100dvh i własne przewijanie. Przegląd React skill: proste dane wyliczane w renderze, brak nowych fetchy/zależności, prymitywne zależności nawigacji, istniejące lazy moduły zachowane.
- Review wykrył dwa problemy pierwszego diffu: ogólny komunikat zasłaniał limit10 oraz usunięcie overlay przy wyjściu z bloku przywracało statyczne dane. Root poprawił priorytet limitu i dodał stan ostatniej obserwacji. Dane historyczne pozostają widoczne, ale wymagają ponownego odczytu przed dodaniem, bez deklaracji bieżącej dostępności. Efekt porównuje wartości, nie referencje, więc nie zapętla się dla nowej instancji resolvera.

## Weryfikacja
- Focused basket/nativeMap:12/12 pass. Regresje obejmują utrzymanie ID, zmianę cen, zajęcie/brak jednego fotela, budżet, utratę/odzyskanie obserwacji live i powtórne jawne kadrowanie bez zmiany kadru przy pollingu.
- Końcowe `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`:exit0.153 testy źródeł+1 wyemitowanego serwera. Build10.63s. Brak nowych pakietów.
- Ponowny niezależny read-only review Sol po poprawkach:bez nowych regresji blokujących. Root przeczytał diff i wyniki; raport nie stanowi odbioru przeglądarkowego.
- `git diff --check`:pass. HTTP nowego wdrożenia:pass. Rzeczywisty fokus, scrolling i dotyk w przeglądarce nadal pending z powodu wcześniejszej automatycznej odmowy, bez próby obejścia.
- W pierwszym probe niepotrzebnie założono identyczny fingerprint lokalnego/remote buildu. Produkcja miała nowy, odmienny hash; poprawiono kontrolę na assety wskazywane przez faktyczny HTML i znaczniki nowego zachowania. To nie była potwierdzona awaria aliasu.

## Wynik
Kod768e029 wdrożony production READY, aliasError=null: `dpl_9V66kgvZx49qzjK8pnuKwChm8swb`, https://salesbeyond.vercel.app. Lokalny manifest60plików409 158bajtów wiąże wysłane źródła z commitem; metadane zdalnego Git nie są dowodem SHA, bo wdrożono snapshot plików. Bez push/merge GitHub i bez zmian infrastruktury/migracji/sekretów.

HTTP200 i poprawne MIME: HTML, index-Gh8_yWPO.js, index-B2ZT3Lsr.css, Stadium-B54KTkw_.js, StadiumMap-C3JKkMh1.js. Główny bundle zawiera obsługę nieaktualnej propozycji i jawnego focusRequest; CSS granicę100dvh, moduł3D nową architekturę. API status configured/service oraz inventory II-3/1998:200. Dowód: `docs/qa-evidence/fan-flow-2026-11-20-http.json`. Brak wpisów error/fatal w15minutowym skanie tego wdrożenia; to nie kontrola konsoli przeglądarki.

Oba spójne przyrosty zakończone kodem i deployem, nie samym planem. Odbiór UI/WebGL pozostaje otwarty, dlatego outcome partial i spec in-progress. Osobny tymczasowy worktree agenta usunięto po integracji, z zachowanym patchem poza repo. Kolejne kryteria wymagają realnej przeglądarki; nie utworzono fikcyjnego odbioru ani zastępczego kanału omijającego odmowę.

## Lekcje
`.ai/lessons/2026-11-20-proposals-and-live-refresh.md`: znacznik odczytu nie jest tożsamością grupy; utrata obserwacji nie przywraca demo; jawny podgląd ma własny licznik.
