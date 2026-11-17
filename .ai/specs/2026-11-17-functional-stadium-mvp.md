---
status: in-progress
created: 2026-11-17
owner: NiedzielX
related:
  - docs/PROJECT.md
  - .ai/runs/2026-11-17-adopt-agent-process.md
---

# Funkcjonalne MVP stadionu 3D

## Problem
Istniejący prototyp ma pełną deklarowaną ścieżkę wyboru miejsca, ale nie ma potwierdzonej weryfikacji przeglądarkowej. Dane miejsc i bazowe krzesełka używają odmiennych wzorów pozycjonowania; zgodność fotela i kamery wymaga poprawy. Potrzebne jest wiarygodne demo, nie rozbudowa do systemu sprzedaży.

## Cel i zakres
Dokończyć istniejący pionowy wycinek: stadion → sektor → rząd → miejsce → płynny przelot → widok z fotela → proste podsumowanie → zmiana miejsca. Utrzymać estetyczny, uproszczony model inspirowany Enea Stadionem; generyczne elementy są dopuszczalne. Zachować obecny stos i interfejs jako bazę.

### Poza zakresem
Fotorealistyczne kadry, filmy AI, maski w postprodukcji, VIP, oficjalne sektory/cennik, dokładny bliźniak, wszystkie realne fotele, backend, konta aplikacji, dostępność live, rezerwacje i płatności. Brak zmian hostingu, dostępu i publikacji w ramach tej specyfikacji. Autotour istniejący można zachować, bez rozbudowy. Bez benchmarku na fizycznym telefonie jako warunku MVP.

## Wymagania
- R1: Zachować trzy sektory demonstracyjne 101–103, po 12 rzędów i 18 miejsc. Stałe identyfikatory i deterministyczne ceny/statusy.
- R2: Jedno źródło parametrów pozycji/układu dla wybieralnych krzesełek, stopni, podświetlenia i kamery. Nie renderować drugiej niespójnej warstwy krzesełek w obszarze demonstracyjnym.
- R3: Wybór sektora w panelu i scenie daje identyczny stan. Wybór miejsca w scenie aktualizuje również rząd w panelu. Niedostępne miejsce nie zmienia wyboru.
- R4: Przelot 2–3 sekundy od bieżącej pozycji do poziomu oczu wybranego fotela; reduced-motion skraca go do natychmiastowego ustawienia. W trybie widoku z fotela rozglądanie obraca kierunek kamery wokół stałej pozycji oczu, bez orbitowania wokół środka boiska. Przerywanie ruchu ręcznego nie uruchamia później oczekujących kroków autotour.
- R5: Podsumowanie jest zgodne z danymi wyboru; powrót zachowuje sektor i rząd, reset przywraca panoramę. Zmiana miejsca możliwa bez przeładowania.
- R6: Bryła ma boisko, cztery niebieskie trybuny, uproszczony dach i przejścia. Geometria nie zasłania wybranej kamery; dekoracyjne elementy nie przechwytują wyboru fotela. Bez wymogu odwzorowania oficjalnej architektury. Jawny opis inspiracji i ograniczeń.
- R7: Pełna ścieżka obsługiwalna w panelu z klawiatury i dotykiem; widoczny fokus. Układ 390×844 i 1440×900 bez poziomego przewijania. Etykiety przycisków ikonowych po polsku. W razie braku WebGL widoczna informacja o niedostępności sceny, bez udawania podglądu.
- R8: Pozostaje widoczne „Demo koncepcyjne — dane poglądowe”; brak komunikatów sugerujących zakup, rezerwację lub dokładny rzeczywisty widok.
- R9: Odtwarzalna instalacja, typecheck, testy, build, jawna kontrola lint. Przypięcie wersji istniejących pakietów do lockfile bez aktualizacji: minimalne dostosowanie do §9 nowych zasad właściciela, bez zmiany rozwiązanego drzewa zależności; npm ci nadal jest instalacją odtwarzalną. Dodać minimalny lokalny lint TypeScript/React, po sprawdzeniu wersji i dat publikacji nowych zależności (wydania starsze niż 14 dni). Nie dodawać backendu ani frameworka testów E2E w tym przyroście; browser QA udokumentowane krokami i zrzutami.

## Kryteria akceptacji
- AC1 (R1–R2): Testy wszystkich 648 miejsc: unikalne ID/pozycje, poprawne parametry, odrzucenie błędnych indeksów; test pozycji geometrii vs fotel i punkt kamery. Scena korzysta z tych samych funkcji, co testy.
- AC2 (R3): Automatyczny test przejść stanu dla wszystkich 648 miejsc: dostępne aktualizują sektor/rząd/miejsce, niedostępne nie zmieniają poprzedniego wyboru. Ręczny smoke test UI: każdy sektor 101/102/103, rzędy 1/6/12, pierwsze i ostatnie dostępne miejsce w każdym z tych rzędów (18 wyborów). Dodatkowo kliknąć w scenie fotel innego rzędu i wrócić do panelu; numer rzędu i sektor muszą odpowiadać fotelowi.
- AC3 (R3/R5): Niedostępne miejsca nie dają się wybrać w UI ani scenie. Cena i dane podsumowania odpowiadają wybranemu ID, także dla rzędu z dopłatą. Testy i kroki QA.
- AC4 (R4): Test kontrolera symulowany krokami 1/60 s: czas lotu 2,4 s ± jeden krok; początek równy bieżącej pozycji, koniec równy celowi z tolerancją 0,001 jednostki; wszystkie próbki skończone, bez teleportacji między końcami. Punkt oczu = środek górnej powierzchni siedziska + 1,1 jednostki Y; kierunek domyślny na środek boiska (0,1,0). Test rozglądania: yaw/pitch zmieniają kierunek, pozycja oczu pozostaje stała z tolerancją 0,001. Reduced-motion: cel w najbliższej klatce. Ręcznie obejrzeć lot, brak wejścia w geometrię i widok boiska dla próbek AC2; sprawdzić reset w czasie lotu. Czas 2,4 s dotyczy zegara animacji, nie gwarancji wall-clock na przeciążonym urządzeniu.
- AC5 (R5): Dziesięć kolejnych zmian miejsca i trzy powroty do panoramy bez przeładowania, błędów konsoli i niespójnego biletu.
- AC6 (R6/R8): Obejrzane zrzuty panoramy, sektora i fotela: widoczne boisko i niebieskie trybuny, dach nie blokuje widoku; stałe oznaczenie DEMO, brak deklaracji dokładności. Checklista wizualna, nie test podobieństwa do oficjalnego modelu.
- AC7 (R7): Przy 390×844 i 1440×900 przejść wybór sektora/rzędu/miejsca/powrót, brak poziomego scrolla i krytycznych błędów konsoli; obejrzane zrzuty i wyniki w logu. Klawiatura: Tab/Shift+Tab do sektorów i miejsc, Enter/Space wybiera przycisk, strzałki zmieniają rząd na suwaku, Enter na powrocie odtwarza wybór, Escape zamyka modal/zatrzymuje tour; fokus jest widoczny i nie ginie przy przejściach. Przy awarii WebGL: widoczny komunikat, brak obietnicy wyrenderowanego widoku; panel wyboru i podsumowanie mogą pozostać dostępne. Krok QA opisuje symulację awarii i obserwowany wynik.
- AC8 (R4): Jeżeli autotour pozostaje: start → ręczny wybór/stop/Escape → brak późniejszego automatycznego przestawienia wyboru. Kroki odtworzenia i regresja logiki timerów.
- AC9 (R9): npm ci, npm run lint, npm run typecheck, npm test, npm run build kończą się kodem 0. README opisuje działające polecenia i ograniczenia. Jeżeli infrastruktura QA zawiedzie, specyfikacja pozostaje in-progress, a raport nazywa niesprawdzone AC.

## Projekt rozwiązania
1. Integrator: przypiąć zastane wersje w package.json/package-lock.json, dodać minimalny lint i skonfigurować niezbędne testy. Bez automatycznej aktualizacji zależności. Weryfikacja AC9.
2. Dane/scena: w src/data/stadium.ts lub niewielkim src/data/layout.ts scentralizować wymiary rzędów i foteli. Dopasować Tier/DemoSeats i nakładkę sektorów. Zapewnić lukę w dekoracyjnych krzesełkach dla sektorów demo. Dotknięte pliki: dane, ich testy, src/components/Stadium.tsx. Weryfikacja AC1, AC2, AC6.
3. Kamera/wybór: wyodrębnić tylko potrzebne czyste obliczenia (np. src/domain/camera.ts i selection.ts), dodać testy; podpiąć kontroler kamery i wybór w App.tsx. Nie refaktoryzować całej aplikacji. Weryfikacja AC2–AC5, AC8.
4. UI i geometria: wyłącznie poprawki potrzebne do ścieżki i czytelności bryły, src/styles.css, App.tsx, Stadium.tsx. Zachować obecny kierunek wizualny. Weryfikacja AC6–AC7.
5. Integrator: bramki, niezależne review i browser QA; README i docs/QA.md z krokami i dowodami, aktualizacja logu. Żadnej publikacji ani scalenia bez wyraźnego polecenia właściciela.

### Podział pracy i koszt
Jedna specyfikacja = jeden worktree implementacyjny. Integrator jest jedynym autorem zmian w plikach współdzielonych (Stadium.tsx i App.tsx). Tańszy agent (gpt-6-luna) wykonuje niezależny audyt/review w trybie read-only; nie pushuje i nie otwiera PR. Jeżeli wydzielone zadanie będzie faktycznie niezależne, otrzyma osobną specyfikację/gałąź/worktree. Nie mnożyć agentów dla małych zmian.

## Ryzyka i otwarte pytania
- Sekcja Projekt i specyfikacja zatwierdzone przez właściciela wiadomością „zatwierdzam” 2026-11-17.
- Lokalny podgląd miał problem z relay w poprzedniej sesji. Nie uznawać browser QA za wykonane na podstawie udanego buildu lub strony logowania hostingu.
- Gotowy film i darmowy blueprint służą jako inspiracja flow; nie kopiujemy ich obiektu, nie odtwarzamy fotorealizmu.
- Nie ma aktualnie konfiguracji CI, lintu i skanu sekretów. Lint w zakresie R9; CI nie jest wymagane w MVP.
- Wygląd Enea Stadionu jest inspiracją, nie kryterium zgodności geodezyjnej. Nie kupować modeli ani nie wymagać oficjalnych planów do ukończenia MVP.

## Niezależny przegląd
Przeprowadzony 2026-11-17 przez osobną sesję gpt-6-luna (świeży kontekst, read-only), bez zatwierdzania dokumentu.

- Uwaga o niejasnym pokryciu AC2: poprawiono na automatyczne przejścia dla 648 miejsc i ręczną próbkę 18 dostępnych wyborów.
- Uwaga o niemierzalnym AC4: dodano czas zegara animacji, tolerancje pozycji, punkt oczu i test stałej pozycji przy rozglądaniu.
- Sugestia klawiatury/fallback: doprecyzowano AC7.
- Sugestia ograniczenia pinowania: zachowano wyłącznie wersje z lockfile i zapisano uzasadnienie zgodności z §9, bez aktualizacji pakietów.
- Integrator sam sprawdził dokument i wskazane miejsca kodu. Status pozostaje draft; akceptacja należy do właściciela.

## Realizacja
Właściciel zatwierdził dokument i sekcję Projekt wiadomością „zatwierdzam” 2026-11-17. Rozpoczęto implementację.


### Wynik przyrostu
Commit implementacyjny: ccf5733. Wspólny layout miejsc/stopni, reducer wyboru, kamera z ustaloną pozycją oczu, czyste obliczenia lotu, cleanup autotour, komunikat braku WebGL, lint i przypięte wersje.

Kontrole: npm ci, lint, typecheck, testy 10/10 i build — exit 0. Bundle JS 1193,89 kB / gzip 338,62 kB, ostrzeżenie Vite o rozmiarze. Instalator ostrzega o zakończonym wsparciu eslint 9.39.1; zależność lokalna developerska, kontrola działa. Nowe wersje eslint/typescript-eslint sprawdzono w registry: odpowiednio 2025-11-03 i 2025-11-10 (starsze niż 14 dni).

Read-only review świeżej sesji gpt-6-luna nie wskazał potwierdzonych błędów głównej ścieżki. Integrator sprawdził diff i uruchomił bramki samodzielnie. Browser QA: niewykonane — sites-preview relay timeout, bez adresu podglądu. AC2–AC8 w części wizualnej pozostają niepotwierdzone. Brak publikacji/push/scalenia. Status pozostaje in-progress zgodnie z AC9. Szczegóły i kroki: docs/QA.md.


### Dalsza poprawka interakcji 2026-11-17
Reprodukcja regresji raycast po powrocie do panoramy: test przed poprawką 10/11, po przywróceniu konkretnej funkcji Mesh.prototype.raycast 11/11. Klik fotela obsługuje wspólna grupa siedziska/oparcia. Cena w panelu uwzględnia aktualny rząd; fallback nie obiecuje widoku 3D. Lint/typecheck/test/build zielone. Niezależne review gpt-6-luna bez uwag. Log: .ai/runs/2026-11-17-finish-mvp-interactions.md. AC przeglądarkowe nadal niezweryfikowane; status bez zmian.


### Domknięcie kontrolera kamery i klawiatury
Commit 8961d50: usunięcie starej bezwładności OrbitControls przed lotem, analityczne dopasowanie kadru panoramy do telefonu, stały widok fotela przy zmianie rozmiaru, obsługa utraty kontekstu GPU oraz fokus modala. Testy 14/14 i lint/typecheck/build zielone. Review tańszego gpt-6-luna wykrył konflikt autoFocus/opener — naprawiony. Log: .ai/runs/2026-11-17-complete-camera-controls.md. Pozostałe AC wizualne nadal niepotwierdzone; status in-progress.
