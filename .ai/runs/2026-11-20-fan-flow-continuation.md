---
started: 2026-11-20
ended: null
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
- `git diff --check`:pass. HTTP nowego wdrożenia w toku. Rzeczywisty fokus, scrolling i dotyk w przeglądarce nadal pending z powodu wcześniejszej automatycznej odmowy, bez próby obejścia.

## Wynik
W toku.

## Lekcje
`.ai/lessons/2026-11-20-proposals-and-live-refresh.md`: znacznik odczytu nie jest tożsamością grupy; utrata obserwacji nie przywraca demo; jawny podgląd ma własny licznik.
