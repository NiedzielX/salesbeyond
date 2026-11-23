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

Uzupełnienie AC7: gęsty rząd miejsc jest jedną nazwaną grupą i jednym wejściowym tab-stopem. Wybrany fotel, a bez niego pierwszy, przyjmuje Tab; Left/Right oraz Home/End przesuwają wyłącznie fokus po wszystkich widocznych fotelach, także zajętych i poza filtrem. Enter/Space zachowują natywny podgląd. Klawisze są ograniczone na krańcach i nie zatrzymują zwykłego Tab/Shift+Tab.

Uzupełnienie dotyku AC7: na szerokości mobilnej scena i plan domyślnie oddają pionowy gest natywnemu przewijaniu strony. Widoczny przycisk o celu co najmniej 44 px włącza pełne sterowanie gestami sceny i jawnie pozwala wrócić do przewijania; przejście powierzchni lub widoku przywraca bezpieczny tryb przewijania. Tap wyboru i poziomy gest pozostają dostępne w trybie przewijania. Rzeczywiste zachowanie pointer-cancel/scroll wymaga odbioru przeglądarkowego 390 px.
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
### Korekta właściciela: reklama i dostęp do niskich rzędów — 2026-11-21
Beyond ma być na widocznym szarym prostokącie przy bramce oraz pionowych szarych bokach przy murawie; wcześniejsze malowanie ziemi wycofane. Screenshot II-2 pokazuje brak możliwości skierowania zbliżonej kamery na niższe rzędy. Odtworzyć ograniczenia rzeczywistego kontrolera i zapewnić dostęp manualny/wybór rzędu, zachowując bezpieczną wysokość, stały punkt oczu w POV i zachowanie przy polling/resize. Root integruje, bez ponownego otwierania zamkniętego zakresu MVP lub proszenia o zgodę na rutynowe poprawki.

Kod `13007f8`/`7480ee4`/`36f9388`: napisy pionowe; bounded pan sektora i jawny rowFocused frame, UI wyjaśnia gesty i suwak. Root/controller/review/lint/typecheck/163+1/build passed; 114 kadrów rzędów, 57 POV widowni, dotychczasowa regresja lotu zachowana. Wdrożenie production READY `dpl_2UeCxRZJ8tQKT3WVU5JBd1B2QYXX`, HTTP potwierdzone w `docs/qa-evidence/lower-rows-2026-11-21/deployment-proof.json`. Rzeczywisty ekran desktop/mobile nadal otwarty.

Korekta właściciela 2026-11-22: przy wartości startowej rzędu 1 suwak nie emituje `change`, więc poprzedni UI nie aktywował rowFocused. Dodać jawną akcję ustawienia/przywrócenia kadru na bieżącym rzędzie oraz pozwolić ręcznie obniżyć oko w sektorze z około 4.59 m do bezpiecznej granicy około 2.59 m. Zachować target wewnątrz sektora, panoramę, POV, dach i widownię.

Realizacja: `2f904ec`; jawny przycisk działa również dla niezmienionego rzędu 1 i wymusza recenter po ręcznej orbicie. Sektor używa `.49π`, panorama nadal `.47π`; kontroler potwierdził eyeY 2.585 m, rząd NDC y≈−.185 ręcznie i y=0 po aktywacji, 114 kadrów. Niezależny review bez must-fix, 163+1/lint/typecheck/build passed. Production READY `dpl_3eJc86HiySgQJoX8ZpQmi73badLE`; HTTP/API proof w `docs/qa-evidence/lower-rows-2026-11-21/deployment-proof-2026-11-22.json`. Browser acceptance pozostaje otwarte.

### Ciągłość statusu wydarzenia w pełnej ścieżce — 2026-11-21
W istniejącym zakresie wspólnej dostępności: po wiarygodnej obserwacji zamknięcia wydarzenia sama nawigacja, oczekiwanie na nowy blok lub błąd odczytu nie mogą przywracać otwartego statusu demo. Nowa odpowiedź serwera może ponownie otworzyć wydarzenie; wyłączenie trybu usługi wraca do oznaczonego demo. Sprawdzić realny hook, opóźnione odpowiedzi, zmianę sektora i reset, bez mutacji eventu produkcyjnego.

`81695b8` zachowuje znany eventStatus do nowego wiarygodnego wyniku lub disable. Test rzeczywistego hooka, niezależny review i wspólne końcowe bramki passed; wdrożono z `36f9388`.

### Rozszerzenie MVP zlecone przez właściciela: widownia — 2026-11-20
Właściciel polecił dopisać do scope MVP poglądowe zapełnienie trybun, żeby ocenić widok, gdy przed wybranym miejscem siedzi kibic. To element aktualnego MVP, nie edytora/panelu organizatora.

- C1: Własne uproszczone, ciemne sylwetki siedzących kibiców w3D, bez twarzy i zewnętrznych modeli. Pozycje/kierunki wynikają z tego samego katalogu foteli i wysokości stopni.
- C2: Przełącznik „Puste trybuny / Z kibicami”; podgląd z tego samego fotela pozwala porównać oba warianty. Widoczna także sylwetka w poprzedzającym rzędzie, jeżeli ten istnieje. Nie renderować głowy/sylwetki obserwatora na jego własnej kamerze.
- C3: Sylwetki są wyraźnie oznaczoną symulacją widowni, niezależną od dostępności/holdów. Przełączenie nie zmienia ID, wyboru, cen, koszyka ani blokady. Brak deklaracji zmierzonego zasłonięcia rzeczywistego miejsca lub prawdziwej frekwencji.
- C4: Lekka geometria instancjonowana; sylwetki nie przechwytują kliknięć foteli. Zachować 2D i działanie panelu oraz dostępny z klawiatury/dotyku przełącznik.
- C5: Akceptacja: porównanie pusty/z kibicami dla pierwszego, środkowego i ostatniego rzędu każdej trybuny oraz narożnika, brak własnej sylwetki w kamerze, spójność po zmianie fotela/resetach. Osobno sprawdzić faktyczną płynność i obraz na desktopie/telefonie. CPU/testy nie zastępują tego odbioru.

Stan: implementacja rozpoczęta21listopada po poleceniu „Działaj dalej”. Model domyślnie pusty, przełącznik dotyczy domyślnej sceny3D. Jedna lekka instancjonowana sylwetka oparta o katalog; ukrywanie obserwatora i poprzednich punktów startowych do zakończenia lotu. Przełączenie nie resetuje kamery; miniatura fotela musi odpowiadać nowej widowni po zastosowaniu geometrii. Pozostaje niezależna, jasno oznaczona symulacja, bez powiązania z holdami.
Realizacja C1–C4 w kodzie:60tri/postać, jedna instancjonowana geometria38 078foteli, pusty raycast, maski kolejnych źródeł/celów i odczyt miniatury po commit przybycia.160+1testów/lint/typecheck/build:pass. Kontroler StrictMode sprawdza57perspektyw i przełączanie; obejrzano parę identycznych kadrów CPU. C5 obraz/płynność/telefon nadal nieodebrane. Log `.ai/runs/2026-11-21-simulated-crowd.md`; dowody `docs/qa-evidence/crowd-2026-11-21/README.md`.
Wdrożeniea46fba9 production READY na salesbeyond.vercel.app, UI/moduły/API potwierdzone przez HTTP. Brak zamknięcia C5 na podstawie tych dowodów.

### Polecenia właściciela: Beyond i dokładny przegląd kamery — 2026-11-20
Subtelny napis Beyond na szarej strefie za obiema bramkami, lokalna geometria/zasoby, bez zasłaniania pola gry i miejsc. Właściciel zgłosił możliwe zapadanie kamery w murawę przy podglądzie: odtworzyć na rzeczywistych kontrolerach i danych, naprawić potwierdzoną przyczynę oraz utrwalić regresję. Równolegle przejrzeć punkty1–4 poprzedniego planu w istniejącym zakresie. Oddzielać kod/CPU od niewykonanego odbioru przeglądarkowego; nie obchodzić wcześniejszej odmowy dostępu.
Realizacja: Beyond0eb5292, kamera aaf9103 i gate dachu w integracji. Potwierdzono przecięcia stopni/membrany, nie końcową pozycję pod murawą.155+1testów/lint/typecheck/build oraz rzeczywisty kontroler R3F na CPU:pass. Cztery równoległe zadania wykonane w zakresie źródeł; realny odbiór UI/telefonu pozostaje otwarty. Ślad: `.ai/runs/2026-11-20-beyond-and-seat-camera.md` i kontrolne obrazy/programy w `docs/qa-evidence/`.
Całość9584df7 opublikowana production READY na salesbeyond.vercel.app; HTML/moduły/font w bundlu i API potwierdzone przez HTTP. Nie oznacza odebrania obrazu WebGL. Widownia C1–C5 pozostaje do implementacji.

### Szczegóły architektury Enei — 2026-11-20
Po porównaniu obrazu własnej geometrii z publiczną referencją poprawiono przestrzenne pasy kratownicy, podziały i wypukłe fartuchy membrany oraz kondygnacje elewacji. Bez zmiany katalogu38 078foteli i ich pozycji. Wspólne kadry eksportowane z helperów kamery: panorama, II-3, fotel oraz elewacja. Nowy test171osi widoku i bramki148+1/lint/typecheck/build:pass. CPU obrazy oraz rzeczywiste wyjście cięć weryfikowane przez root, niezależne source review po poprawkach narzędzi. Dowody: `docs/qa-evidence/enea-fidelity-2026-11-20/README.md`; log `.ai/runs/2026-11-20-enea-visual-fidelity.md`. Status nadal in-progress: odbiór aplikacji w WebGL jest otwarty.

### Ciągłość wyboru grupy i nawigacji — 2026-11-20
W istniejącym zakresie pełnej ścieżki i R7: polling nie usuwa propozycji grupy bez zmiany filtrów/polityki. Propozycja odczytuje aktualne ceny/statusy swoich ID, pokazuje rzeczywisty powód utraty możliwości dodania i nadal podlega końcowej walidacji. Podgląd z grupy/koszyka/holda przenosi użytkownika do sceny przy każdym jawnym żądaniu, także tego samego fotela; zwykły mount nie kradnie fokusu. Dialog pozostaje przewijalny w granicach niskiego viewportu. Weryfikacja domeny i źródeł nie zastępuje otwartego odbioru UI.
Implementacja768e029:153+1testów/lint/typecheck/build pass, niezależny review po poprawkach i production READY z potwierdzeniem assetów/API przez HTTP. Log `.ai/runs/2026-11-20-fan-flow-continuation.md`; lekcja `.ai/lessons/2026-11-20-proposals-and-live-refresh.md`. Status pozostaje in-progress z powodu niewykonanego odbioru przeglądarkowego.

### Rozszerzenie zlecone bezpośrednio przez właściciela 2026-11-18
Właściciel wskazał jako cel pełne doświadczenie kibica (2D/3D, cały stadion, wielokrotny wybór i koszyk), wyłączając edytor/panel organizatora. Następnie zgłosił dwie konkretne luki obecnego przyrostu: generyczny model zamiast Enei oraz brak wyboru większości widocznych foteli. Podał konkretną ofertę fotogrametrycznego modelu Enei na CGTrader. To aktualizacja wymagań właściciela; wcześniejszy limit 648 miejsc opisuje tylko poprzedni etap.

Najbliższy przyrost w ramach tego polecenia:
- Aktualna korekta właściciela: nie będzie dostarczać BLEND/GLB. Zbudować stadion kodem według blueprintu i referencji Enei: ciągła bryła z zaokrąglonymi narożnikami, zróżnicowane wysokości/poziomy trybun, charakterystyczna biała membrana i widoczne kratownice. Każdy widoczny fotel pozostaje częścią kanonicznego katalogu. Punkty oczu, plan2D, kadr i geometria mają wspólne parametry. Bez zakupu i bez nazywania autorskiej rekonstrukcji zweryfikowanym skanem. Wcześniejsza zależność od pliku modelu poniżej jest wycofana tą korektą.
- Pełny plan 2D dla tego samego katalogu i zaznaczenia, przełącznik 2D/3D zachowujący ID, zoom/pan i podgląd fotela. Przy braku WebGL automatycznie pozostać w działającym wyborze 2D, bez blokowania panelu. To część wskazanego wprost pełnego doświadczenia kibica; nie dodaje backendu ani rezerwacji.
- Każde krzesełko renderowane w obecnej scenie musi pochodzić z katalogu i mieć stabilne ID, trybunę/sektor/rząd/numer/pozycję. Usunąć rozdział krzesełek dekoracyjnych i danych wyboru. Zachować stare ID 101–103 dla zgodności poprzedniego porównania.
- Przewidzieć sektory i nawigację wszystkich czterech trybun; panel, kamera, etykieta i karta używają tego samego rekordu. Podgląd perspektywy dostępny także dla fotela poglądowo zajętego; to nie zmienia jego dostępności do zakupu. Obecny etap nie ma zakupu/rezerwacji.
- Testy zgodności wszystkich instancji z katalogiem, kanonizacji wyboru oraz reprezentatywnych foteli każdej trybuny. Nie nazywać przykładowych numerów oficjalnym rozkładem Enei.
- Model CGTrader służy wyłącznie jako publiczna referencja wyglądu. Zgodnie z późniejszą korektą właściciela budujemy model kodem, bez plików BLEND/GLB i zakupu. Nie deklarować skanu/bliźniaka ani oficjalnej numeracji miejsc.
- Przyrost wizualny 2026-11-20 w tym samym zakresie: czytelne żebra membrany, przestrzenna kratownica otworu oraz poziome podziały i podpory elewacji. Zachować ID, pozycje i punkty oczu wszystkich 38 078 foteli oraz obecny przekrój dachu. Weryfikacja: wspólne bufory sceny/eksportu CPU, test skończoności/budżetu geometrii i niezasłaniania osi widoku z reprezentatywnych miejsc; lint/typecheck/test/build. Obrazy CPU porównać z referencją, nie traktować ich jako odbioru WebGL ani pomiaru zgodności z budynkiem.

Oryginalne wymagania odrzucania zajętego fotela dotyczące wyboru zakupowego nie obowiązują dla nowo zleconego podglądu każdego fotela. Rozdzielenie podglądu i koszyka jest wymaganiem aktualnym. Pozostałe etapy pełnego doświadczenia kibica wymagają opisania i realizacji, a nie zamknięcia tej specyfikacji po pierwszym przyroście. Odbiór WebGL nadal jawnie otwarty.

Właściciel zatwierdził dokument i sekcję Projekt wiadomością „zatwierdzam” 2026-11-17. Rozpoczęto implementację.


### Wynik przyrostu
Commit implementacyjny: ccf5733. Wspólny layout miejsc/stopni, reducer wyboru, kamera z ustaloną pozycją oczu, czyste obliczenia lotu, cleanup autotour, komunikat braku WebGL, lint i przypięte wersje.

Kontrole: npm ci, lint, typecheck, testy 10/10 i build — exit 0. Bundle JS 1193,89 kB / gzip 338,62 kB, ostrzeżenie Vite o rozmiarze. Instalator ostrzega o zakończonym wsparciu eslint 9.39.1; zależność lokalna developerska, kontrola działa. Nowe wersje eslint/typescript-eslint sprawdzono w registry: odpowiednio 2025-11-03 i 2025-11-10 (starsze niż 14 dni).

Read-only review świeżej sesji gpt-6-luna nie wskazał potwierdzonych błędów głównej ścieżki. Integrator sprawdził diff i uruchomił bramki samodzielnie. Browser QA: niewykonane — sites-preview relay timeout, bez adresu podglądu. AC2–AC8 w części wizualnej pozostają niepotwierdzone. Brak publikacji/push/scalenia. Status pozostaje in-progress zgodnie z AC9. Szczegóły i kroki: docs/QA.md.


### Dalsza poprawka interakcji 2026-11-17
Reprodukcja regresji raycast po powrocie do panoramy: test przed poprawką 10/11, po przywróceniu konkretnej funkcji Mesh.prototype.raycast 11/11. Klik fotela obsługuje wspólna grupa siedziska/oparcia. Cena w panelu uwzględnia aktualny rząd; fallback nie obiecuje widoku 3D. Lint/typecheck/test/build zielone. Niezależne review gpt-6-luna bez uwag. Log: .ai/runs/2026-11-17-finish-mvp-interactions.md. AC przeglądarkowe nadal niezweryfikowane; status bez zmian.


### Domknięcie kontrolera kamery i klawiatury
Commit 8961d50: usunięcie starej bezwładności OrbitControls przed lotem, analityczne dopasowanie kadru panoramy do telefonu, stały widok fotela przy zmianie rozmiaru, obsługa utraty kontekstu GPU oraz fokus modala. Testy 14/14 i lint/typecheck/build zielone. Review tańszego gpt-6-luna wykrył konflikt autoFocus/opener — naprawiony. Log: .ai/runs/2026-11-17-complete-camera-controls.md. Pozostałe AC wizualne nadal niepotwierdzone; status in-progress.


### Usunięcie blokerów interakcji i lotu
Commit 5d61dfb: etykiety sektorów tylko w panoramie, odsłonięcie przednich słupów (11 kolizji przed / 0 po dla sprawdzonych lotów), quaternion slerp orientacji, status błędu fullscreen, poprawne przewijanie telefonu także w fallbacku i ochrona fokusu modala. Weryfikacja: lint/typecheck/build exit 0, 20/20 testów. Odrębna sesja audytu/review; integrator sprawdził ustalenia i bramki. Log: .ai/runs/2026-11-17-finish-mvp-accessibility.md. Realne browser QA nadal niewykonane, status in-progress.


### Rzeczywisty browser QA panelu i poprawka montowania sceny
Właściciel zezwolił na lokalne Vite zamiast managed preview. Commit 8d355e6: czysty neutralny fallback HTML canvas zamiast efektu wyłączającego scenę, spacje mobilnych nagłówków. W realnej przeglądarce wykonano 36 wyborów (18 na 1440×900, 18 na 390×844), ceny, powroty, reset, klawiaturę, modal, reload i brak overflow. Obejrzane zrzuty w docs/qa-evidence. Kontrole kodu 20/20, lint/typecheck/build zielone. Review niezależne. Realne renderowanie 3D, raycast i lot pozostają niepotwierdzone: cloud nie może utworzyć WebGL, diagnostyka GPU/DevTools zablokowana polityką. Nie oznaczać implemented; AC2/3/5/7 zaliczone jedynie w zakresie panelu/fallbacku. Log: .ai/runs/2026-11-17-local-browser-qa.md.


### Przyrost produktu po przeglądzie briefu
W zakresie istniejących wymagań: wyróżnienie rzędu/hover fotela i etykieta ceny w klasycznej scenie, miniatura fotela w obu wariantach, podziały i przejścia lokalnych trybun oraz segmenty skośnego dachu w obu scenach. Zachowano 648 ID, ceny, statusy, punkty oczu i cel na boisko. Kamera klasyczna aktualizuje cel przed RAF; miniatura jest powiązana z ID i faktycznym zakończeniem lotu. Log `.ai/runs/2026-11-18-product-progress-and-vercel.md`. Status pozostaje in-progress: brak odbioru GPU. Osobne polecenie właściciela zezwala na deploy Vercel „sales”; API wymaga jeszcze nadania dostępu do zespołu, nie wykonano publikacji.


### Przyrost pełnego katalogu i doświadczenia kibica
Na podstawie bezpośrednio zleconego rozszerzenia: katalog7614 widocznych foteli4 trybun/15 bloków; instancje sceny i panel korzystają z tych samych danych. Plan2D z tym samym wyborem, zoom/pan i automatycznym fallbackiem. Lokalny koszyk do10, kanonizacja cen, atomowe dodawanie i grupy obok siebie w budżecie. Podsumowanie wyraźnie demo, bez udawania rezerwacji. Aktualny cel/pozostałe funkcje/model Enei: `docs/FAN_EXPERIENCE_ROADMAP.md`. Zakończenie tego przyrostu nie zamyka całego MVP. Status in-progress.


### Przyrost autorskiej geometrii i natywnego planu 2026-11-18
Wspólny katalog rozszerzony do 38 078 foteli / 19 bloków. Własne eneaLayout/eneaModel budują ciągłą misę, narożniki, asymetryczne poziomy, dach membranowy, portale i kratownice. Fotele i architektura korzystają z tych samych profili. Kadry bloków od strony boiska, sprawdzone projekcją dla różnych proporcji ekranu. Natywny createRenderer 2D korzysta z pełnego chartu, jawnej mapy ID, statusów i ochrony przed echem zdarzeń; SVG jako fallback. Domyślne 3D pozostaje własnym R3F; nie jest to przeniesienie całego produktu. Kryteria odbioru wizualnego pozostają otwarte z powodu blokady dostępu do przeglądarki. Rendery CPU w docs/qa-evidence/authored-enea dokumentują samą geometrię. Log bieżącego przyrostu: .ai/runs/2026-11-18-authored-enea-stadium.md. Status in-progress.

### Przyrost wyszukiwania kibica — wykonanie zleconego pełnego zakresu
Zakres już wskazany przez właściciela: ceny/filtry i grupowy wybór. R-S1: filtr maksymalnej ceny za osobę i dostępności, z licznikami bloków i aktywnego rzędu; zmiana filtra nie kasuje ID wyboru ani koszyka i nie blokuje podglądu foteli poza filtrem. R-S2: obszar całego stadionu lub wybranej trybuny; po wybraniu bloku dobór grupy szuka tylko w nim. R-S3: propozycja 2–6 dostępnych miejsc w jednym rzędzie/bloku, fizycznie obok siebie, bez alejek i pozycji już w koszyku; numery/ceny/suma widoczne przed dodaniem. R-S4: osobne akcje obejrzenia i dodania całej grupy, atomowe sprawdzenie limitu/kanonicznych ID/statusów; brak wyników i pełny koszyk mają czytelny komunikat. Propozycja zachowuje jawny blok/rząd po obejrzeniu i nie udaje rezerwacji. Kontrole: testy zakresu/liczników i fizycznych luk, budżetu, zachowania koszyka; lint/typecheck/test/build. Odbiór UI desktop/telefon nadal otwarty do przywrócenia dostępu do przeglądarki.
R-S5: wszystkie ID koszyka widoczne jednocześnie na domyślnym 2D, fallbacku SVG i modelu R3F; aktywny podgląd odróżniony od pozostałego wyboru. Zmiana fotela/rzędu, przełączenie 2D/3D i progressive reveal nie kasują oznaczeń koszyka ani nie wywołują ponownego dodania przez echo native. Dotyczy domyślnego pełnego katalogu; wcześniejszy eksperyment native3D 648 zachowuje swój zakres.

### Wznowienie doświadczenia kibica i bezpośredni link
R-P1: po odświeżeniu odtworzyć lokalny koszyk, ostatni podgląd/blok/rząd, filtry i 2D/3D. Zapisywać tylko ID i preferencje, bez cen/pozycji/miniatur/danych osobowych. Oddzielić historyczny wariant 648 od pełnego katalogu kluczem.
R-P2: odtwarzane dane traktować jako niezaufane; limit 10, deduplikacja, bieżące kanoniczne ceny/statusy, odrzucenie nieznanych/zajętych/niedozwolonych ID i wersji. Zajęty fotel może być ostatnim podglądem. Uszkodzony lub niedostępny storage nie blokuje bieżącego wyboru; wyczyszczenie zapisuje pusty koszyk.
R-P3: podsumowanie ponownie kanonizuje koszyk względem bieżącego katalogu; konflikt/cena nie są po cichu akceptowane. Nie deklarować, że lokalny katalog jest odczytem rzeczywistej aktualnej dostępności serwera.
R-P4: link do konkretnego fotela otwiera jego podgląd bez kopiowania koszyka innych osób; nieznane/niedozwolone parametry nie powodują awarii. Kopiowanie linku ma potwierdzenie lub widoczną alternatywę do ręcznego skopiowania.
AC-P: testy uszkodzonego/wyłączonego storage, obcego klucza/wersji, limitów/ID, zmiany ceny/zajętości, podglądu zajętego, priorytetu linku i roundtrip obu wariantów; lint/typecheck/test/build. Browser QA nadal oddzielnie otwarty.

### Większy etap ciągłej pracy — reguły i jakość sceny
Zakres kontynuacji właściciela obejmuje pozostałe reguły pełnego doświadczenia kibica oraz jakość interakcji. R-Q1: nie przeliczać macierzy wszystkich foteli na hover/zmianę koloru; stabilne transformacje i aktualizacje tylko zmienionych kolorów. R-Q2: przyspieszyć wybór 38 tys. instancji przez indeks przestrzenny, zachowując zgodność faktycznych trafień/instanceId/material side/near/far z Three; bez utraty podglądu żadnego fotela. R-Q3: skonfigurowana reguła demo wykrywa wyłącznie nowo izolowany pojedynczy wolny fotel, po uwzględnieniu fizycznych alejek i narożników; nie blokuje z powodu istniejącego wcześniej singla. Dodatki atomowe, usuwanie i podgląd zawsze możliwe. R-Q4: stany wydarzenia open/closed/sold-out i reguła są jawnie danymi/polityką demo, bez przypisywania ich klubowi; blokują wybór zakupowy, zachowując podgląd. R-Q5: filtry/grupy/koszyk/podsumowanie mają zgodne wyniki polityki, a błędy konkretne komunikaty. Weryfikacja: test zgodności raycast z domyślnym Three na reprezentatywnych rzeczywistych fotelach i promieniach, test braku przepisywania macierzy na kolorze, testy polityki i atomowości, lint/typecheck/test/build. Pomiar CPU nie jest pomiarem WebGL; odbiór browser pozostaje otwarty.

Realizacja R-Q2 2026-11-22: grupa foteli jest jedynym właścicielem zdarzeń R3F, a w nieinteraktywnym POV handlery mają wartość `undefined`. Próba na rzeczywistym reconcilerze R3F zachowuje ślad zdarzeń i `instanceId`, zmniejszając raycasty dwóch siatek z 28 do 14 dla siedmiu zdarzeń oraz do 0 w POV. Pełne 163+1 testów, lint/typecheck/build i niezależny review bez must-fix. Commit `8cc693c` wdrożony jako production `dpl_6h9coTqhCrWXWdYSLaDmgUQSYSpe` READY; assety/API/runtime proof zielone. Rzeczywisty odbiór WebGL pozostaje otwarty.

Realizacja R-Q1 uploadów 2026-11-22: zmienione indeksy RGB tworzą koaleskowane `updateRanges` dla obu siatek, zakresy kilku commitów czekających na render są zachowywane, a pierwszy pełny `bufferData` czyści kolejkę bez ponownego pełnego uploadu. Rzeczywisty `Three.WebGLAttributes` z atrapą GL dla C2: inicjalizacja 93 048 B, hover jednego fotela 24 B; macierze bez zmiany. Istniejący atrybut i callback właściciela pozostają obsłużone. Source `4451a55`, production `dpl_8k3euiWbE7diSD2BApVZPfe6ayyK` READY; HTTP assety/API/runtime pass. Odbiór GPU/FPS na urządzeniu pozostaje osobnym kryterium C5.

R-Q6: dekoracyjny pierścień 65 drzew ma zachować dokładne pozycje, wysokości, skale i dwa kolory przy najwyżej trzech instancjonowanych batchach zamiast 130 osobnych meshów. Kontroler 38 078 sylwetek nie może dublować pełnego bufora macierzy; przechowuje kopie wyłącznie instancji aktualnie ukrytych i przywraca cały bufor bitowo, nie gubiąc oczekujących `updateRanges`. Pomiar heap/init Node jest dowodem CPU, nie zastępuje C5 GPU/FPS.

Korekta kamery po screenie 2026-11-22: ręczny target sektora może zejść do 0.75 m zamiast zatrzymywać się na wysokości pierwszego fotela; przy promieniu 32 m i `.49π` oko pozostaje na około 1.755 m nad murawą. Ograniczenie dotyczy tylko ręcznego sektora, nie panoramy, automatycznego fokusu rzędu ani POV. Test obejmuje wszystkie 19 bloków, a controller II-2 przesuwa rząd 1 do `NDC y≈0.034`. Source `b96f203`, production `dpl_3HK5cpiMxFrCxLo2bxD9JdBbQAsA` READY; assety/API/runtime proof pass. Browser/WebGL acceptance nadal otwarty.

### Przygotowanie wykonywalnej warstwy holdów przed połączeniem infrastruktury
R-H1: rzeczywista migracja Postgres i RPC all-or-nothing, idempotencja, własność sesji, ceny/wersja/wygaśnięcie/release; testy na izolowanym lokalnym Postgres, nie Map. R-H2: server-only adapter RPC i Web Request/Response API przygotowane do Vercel Functions, bez sekretów/VITE_* w kliencie. Cookie HttpOnly sesji ustanawiane przed żądaniem holda, ścisły Origin, limit/body i współdzielony rate bucket. R-H3: publiczny odczyt tylko metadanych/sekcji, bez właścicieli/tokenu; walidowane odpowiedzi i ogólne błędy bez ujawniania sekretów. R-H4: kod i migrację można przygotować/testować niezależnie od wyboru istniejącej/nowej bazy; żadnego wykonania na koncie właściciela ani włączania publicznego holda przed połączeniem zatwierdzonego zasobu i testami usługi. Nie udawać, że lokalny Docker jest wdrożeniem Supabase. To przygotowanie konkretnej implementacji wymaganego pełnego doświadczenia kibica; operacja infrastrukturalna pozostaje pytaniem do właściciela.

### Dowód uruchamiania API po emisji
2026-11-20: dodano test gotowego JS po stwierdzonym 500 na Vercel. Przed poprawką ten sam ERR_MODULE_NOT_FOUND, po rewriteRelativeImportExtensions test 200/demo i 503/inventory. SQL i publiczne holdy nadal niepołączone: quota Supabase. Status specyfikacji pozostaje in-progress, browser odbiór i cloud proof otwarte.

### Korekta zachowania zlecona przez właściciela 2026-11-20
R-U1: zwykły adres otwiera panoramę, niezależnie od zapisanego podglądu; koszyk i preferencje zostają, jawny link do fotela nadal działa. Pierwszy layout i resize nie uruchamiają lotu. R-U2: dach widoczny w panoramie; w sektorze/perspektywie odsłaniana tylko bliższa część, przeciwna zachowuje bryłę stadionu, przełącznik działa w 3D. R-U3: wejście do sektora nie narzuca rzędu 6 ani nie sugeruje wskazanego rzędu; kliknięcie rzeczywistego fotela w panoramie zachowuje jego rząd, suwak i wybór fotela synchronizują numer. Testy regresji bootstrapu/wyboru i geometria przekroju; faktyczny odbiór WebGL nadal otwarty. To bezpośrednio zlecone poprawki, nie nowy zakres produktu.

### Aktualizacja dostępności wybranego bloku
R-I1: tylko aktywny blok pobiera kompletną migawkę z usługi demo (co15s, focus, manualrefresh i zmiana lifecycle holda). Spóźniona odpowiedź nie nadpisuje nowszej ani nowego bloku. R-I2: grid/podgląd/ceny/liczniki/reguły/grupa/2D/R3F/fallback używają tej samej migawki, globalne nieodczytane bloki pozostają jawnie katalogiemdemo. R-I3: heldcudzego pozostaje niedostępne, własnyhold wyróżniony bez utratykoszyka; globalna geometria/ID niezmienione. R-I4: zmianykoloru/statusu nie przepisują macierzy i nie restartują kamery (zależność odseatID). APIquote/hold nadalweryfikuje wszystko wtransakcji. Testydomeny/adapterów/kolorów +pełnebramki, rzeczywisty browserodbiór nadalotwarty.

Korekta browser acceptance 2026-11-23: po zaakceptowaniu migawki bloku jej pochodzenie pozostaje „z usługi demo” podczas kolejnego `loading` i po błędzie refreshu, ponieważ overlay nadal używa ostatnich znanych danych. Stan transferu/błędu jest komunikowany oddzielnie; nowy blok bez przyjętej migawki pozostaje katalogiem demo.

RealizacjaR-H/R-I/R-U: source91272b3 wdrożonyproductionREADY 2026-11-20, backend/seed/HTTPtransakcje potwierdzone,147+1testówpass. R-U1/R-U3 domenowe regresje iCPUprzekrójR-U2passed; obrazuGPU i całejReactścieżki nieoznaczaćjakoodebranych. Szczegóły verification-2026-11-20.md i bieżącylog. Statusin-progress.

R-H5: trwałość lokalnego wskaźnika holda jest opcjonalna. Odmowa dostępu do `localStorage` nie może wyłączyć skonfigurowanej usługi ani pominąć serwerowego `current(eventId)`; własny aktywny hold ma zostać odzyskany z sesji HttpOnly. Błąd samego `status()` nadal ustawia usługę jako niedostępną. Wymagany test zamontowanego hooka dla obu ścieżek.

R-A3: powtarzalne akcje podglądu w liście wyceny/aktywnego holda mają unikalną nazwę dostępną zawierającą sektor, rząd i miejsce; widoczny krótki tekst może pozostać „Zobacz”. Ręczny odbiór czytnikiem ekranu pozostaje częścią V5.

Uzupełnienie R-A3: sekundowy licznik aktywnej blokady nie jest live regionem. Przejście do `released` lub `expired` generuje jeden jednoznaczny komunikat w polite status region, aby wynik operacji był dostępny bez ogłaszania każdej sekundy.
