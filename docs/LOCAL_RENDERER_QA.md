# Odbiór lokalnego wariantu sceny — 2026-11-18

## Stan
Próba integracyjna pozostaje **in-progress**. Włączana przez `/?renderer=local`; domyślny wcześniejszy renderer zachowany. Bez publikacji, push i scalenia.

## Sprawdzone
- 43 testy Node (po geometrii, mostku zdarzeń i właścicielu sesji): obecne 20 oraz mapowanie wszystkich 648 ID, pozycje/statusy/metryczna skala boiska w rzeczywistym kompilatorze sceny, własny samowystarczalny GLB, nawigacja sektora/rzędu/fotela, unieważnianie starych lotów, disposal i odróżnienie lotu przerwanego od dotarcia.
- Lint, typecheck i build; wynik finalnego `npm ci` i bramek w logu przebiegu.
- Niezależne review osobnej sesji gpt-6-luna. Zgłoszony błąd anulowanego lotu naprawiony i ponownie przejrzany.
- Browser QA rzeczywistego panelu/fallbacku: 18 wyborów dla 1440×900 i 18 dla ramki 390×844. Sektory 101/102/103, rzędy 1/6/12, pierwsze i ostatnie wolne miejsce; cena i numery zgodne, powrót zachowuje rząd. Mobile odczyt viewportu: szerokość390, wysokość843 przy ramce844; nie udawać pomiaru innej wysokości.
- Brak poziomego overflow w obu rozmiarach. Miejsce 4 w sektorze102/rzędzie6 disabled. Suwak z klawiatury Home/strzałki, fokus wewnątrz modala po Shift+Tab, Escape zamyka modal. Reload odtwarza startowy ekran. StrictMode przy braku GPU nie zostawia canvasa.
- W konsoli aplikacji jawne `Local stadium: WebGL2 is unavailable.`. Komunikaty o wysyłaniu metadanych rozszerzenia Chrome nie pochodzą z aplikacji. Aplikacja pokazuje BRAK3D i nie podstawia fikcyjnego renderu.
- Zrzuty obejrzane: `qa-evidence/local-renderer/desktop-1440x900.jpg`, `mobile-390x844.jpg`; wyniki36 wyborów w `results.json`. Zrzuty dokumentują panel i awarię WebGL, nie stadion3D.
- Tymczasowa lokalna strona z ramką o określonym rozmiarze użyta do QA i usunięta przed commitem. Nie jest funkcją produktu ani elementem buildu.

## Niesprawdzone — bramki przed zastąpieniem poprzedniej sceny
1. Realne WebGL2: panorama, cztery trybuny/boisko/dach i wybrany punkt widzenia. Brak wizualnego odbioru, kliknięć GPU i potwierdzenia orientacji/funkcji miniatury.
2. Czasy i ciągłość przelotu, prześwit przez dach, rozglądanie oraz reduced-motion. Kod adaptera nie wymusza2.4s; należy zmierzyć zachowanie runtime i porównać z wymaganiem2–3s. Nie twierdzić, że stare testy kamery Three weryfikują nowy runtime.
3. 18 próbek kliknięć/lotów i10 kolejnych zmian w scenie, retry po przeciągnięciu, reset w trakcie, prawdziwa utrata kontekstu i ponowne mount/unmount z aktywnym GPU.
4. Cold start i requesty wszystkich lazy chunks/workerów/fontów/tekstur na działającym GPU. Źródła aplikacji nie używają obcego API i usunięto fonty Google, lecz nie jest to pełny dowód niezależności sieciowej runtime.
5. Zachowanie na fizycznym telefonie i rzeczywisty czas pierwszej klatki/FPS.

## Następny odbiór
Uruchomić `npm ci && npm run dev`, otworzyć `/?renderer=local` w środowisku z działającym WebGL2. Przejść powyższe bramki i porównać z domyślną sceną. Bez przechodzenia przez ustawienia zabezpieczeń lub zmieniania polityki przeglądarki.


## Dalsza kontrola geometrii i zdarzeń

- Z prawdziwego skompilowanego modelu wyeksportowano pozycje i kolory trójkątów oraz648 punktów oczu. Dostępnych foteli jest500. Test obejmuje2500 linii: każdy dostępny fotel → środek i cztery punkty przy narożnikach boiska.
- Przy liczeniu obu stron trójkątów poprzedni model miał14 przecięć, głównie z automatycznie wygenerowanymi bocznymi ściankami pierwszego rzędu. Po dopasowaniu naszej syntetycznej architektury0. Kontrola z backface-culling dała0 już przed poprawką. To **konserwatywna kontrola dwustronnej geometrii**, nie dowód błędu natywnego renderera ani jego polityki cullingu. Nie deklarować naprawionej widoczności w WebGL bez testu GPU.
- Publiczny bufor sceny z importowanego GLB tracił niebieski kolor trzech niewybieralnych trybun. Usunięcie theme.venue3d.shell nie pomagało: w obu wariantach blue-vertex count północ7866, pozostałe strony0. Własna przygotowana siatka zachowuje kolory wszystkich czterech trybun. Tylko autogenerowany beton material5 wewnątrz sectionSolidRanges jest zastąpiony; stopnie, podstopnice i cała własna architektura pozostają. Nie stosować takiej polityki do zweryfikowanej geometrii prawdziwego stadionu.
- Kontrola buforów: stride3/3/3/1/1, wyrównanie do trójkątów, poprawione sectionSolidRanges i render/clip bounds. Miejsca, ID, ceny i dostępność bez zmian.
- Cztery testy mostka zdarzeń: echo polecenia nie dispatchuje, duplikat przed commitem React nie dispatchuje drugi raz, callback z odmontowanej instancji odrzucony, błędny/zajęty fotel odrzucony. Zmianą miejsca kieruje jawne onSeatPick; obserwacja celu kamery nie zmienia wyboru, wbudowane next/previous nadal wyłączone.
- Render CyclesCPU w Blender4.3.2 pomógł obejrzeć model przed i po. Są to obrazy kontrolne geometrii, bez instancjonowanych foteli i shaderów WebGL. Obejrzano trzy obrazy w qa-evidence/geometry-review; szczegóły reprodukcji w tamtejszym README.
- Próba ponownego odbioru w przeglądarce nie doszła do sceny: cua.getTab zwracał Emulation.setFocusEmulationEnabled timeout (ponowiono raz na potwierdzonym ID karty). HTTP lokalnej aplikacji200. Nie ogłoszono nowego browser QA ani ponownego testu WebGL. Nie zmieniano ustawień przeglądarki.
- Niezależny przegląd nie znalazł potwierdzonego błędu kompaktowania ani mostka. Do GPU QA pozostaje czytelność highlightu: własna dopisana bryła nie należy do sectionSolidRanges, natywne treads/risers nadal należą. Nie ma filtra sektorów w MVP.


## Ciąg wykonawczy L3–L5

Właściciel sesji `src/integrations/venueSession.ts` jest używany przez prawdziwy LocalVenue; nie jest osobną atrapą zastępującą komponent. Przechowuje najnowszy wybór/revision do czasu importu, tłumi synchroniczne echo mount/replay, zamyka handlery, zwalnia observer/listener/handle i ignoruje późne rezultaty. Setup i aktualizacja nie opierają się już na dodatkowym stanie React `mounted`.

10 testów kontraktowych obejmuje: symulację dwóch setupów/cleanupów StrictMode, import po unmount, najnowszy wybór i retry revision, remount dachu, awarie load/mount/watch/observe, contextloss podczas lotu, błąd podczas rejestracji listenera, wyjątek cleanupu i synchroniczne echo mount. Każdy zwrócony handle zwalniany raz, sprzątanie kontynuowane mimo wyjątku. Świeży read-only review gpt-6-luna nie znalazł potwierdzonej usterki, focused tests10/10; integrator uruchomił pełne43/43 oraz npm ci/lint/typecheck/build.

Te testy używają kontrolowanych factories/handle i nie potwierdzają realnego React StrictMode, natywnego ResizeObserver lub GPU. Nie pozwalają odzyskać zasobów, których zewnętrzny runtime nie udostępnił, gdyby rzucił wewnątrz mount przed zwróceniem handle. Nie ma dowodu takiego błędu. Odbiór Q1–Q8 pozostaje otwarty; bez nowego browser QA w tym ciągu i bez ponawiania znanego timeoutu w pętli.

Cała kolejka zatwierdzonego zakresu: `.ai/EXECUTION_PLAN.md` (38 pozycji). Materiał do lokalnego przeglądu: `docs/REVIEW.md`. Nie dodano nowych funkcji ani zależności.


### Przyrost produktu P1–P3
- Wariant klasyczny: wyróżnienie wybranego rzędu; hover dostępnego fotela, numer/cena, zajęte szare. Sprawdzić również przejście pomiędzy siedziskiem/oparciem, wyjście kursora i powrót po wybraniu miejsca.
- Oba warianty: segmenty dachu; lokalny dodatkowo podzielone ławki, przejścia i tylne podpory. Numeryczny test ciągłej posadzki i wolnych przejść; kontrola 2500 linii do boiska pozostaje zielona.
- Miniatura dostępna także w klasycznym rendererze: render z kamery po ukończeniu lotu, odczyt JPEG w tej samej klatce. Panel wymaga pasującego ID, arrived, !flying i dostępnego 3D. Błąd odczytu oznacza brak miniatury. Zmienić miejsce tuż przed końcem poprzedniego lotu, resetować w locie, wracać i ponawiać ten sam fotel; żaden stary obraz nie powinien być przedstawiony jako nowy.
- Nowy target kamery klasycznej publikowany w useLayoutEffect przed RAF; review źródeł zidentyfikowało i poprawiło okno mieszania nowego wyboru ze starym zegarem lotu. Bez runtime reprodukcji w obecnym środowisku.
- Te kroki pozostają NIEODEBRANE wizualnie. Kontrola CPU w `qa-evidence/geometry-review` nie zastępuje WebGL.

### Nawigacja foteli B3 — 2026-11-24

- Wariant `?renderer=local` korzysta ze wspólnej panelowej nawigacji poprzednie/następne miejsce, ale celowo nie pokazuje kontrolki wycentrowania kamery obcego renderera.
- Chromium WebGL2 potwierdził przejście `101-1-2` → `101-1-3` na planie 2D i `101-1-3` → `101-1-4` po powrocie do 3D, brak recenteru, brak błędów aplikacji i brak poziomego overflow przy 1440×900. Ten przebieg nie zastępuje nadal otwartego, pełnego odbioru geometrii lokalnej sceny.
- Wariant własny potwierdził recenter po dotarciu, szybkie kolejne wybory z ostatnim ID jako wynikiem, stabilny fokus na granicy oraz brak zmiany koszyka. Fallback bez WebGL zachował nawigację i ukrył recenter.
- Dowody: `docs/qa-evidence/b3-seat-navigation-2026-11-24/verification.json` oraz obejrzane zrzuty desktop/mobile. Mobile to emulacja dotyku, nie fizyczne urządzenie.
