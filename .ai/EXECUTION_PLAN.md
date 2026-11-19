# Plan wykonawczy całego MVP

Aktualizacja: 2026-11-18. To kolejka wykonania **już zatwierdzonego zakresu**, nie nowa specyfikacja ani samodzielna akceptacja agenta. Źródła wymagań:

- `.ai/specs/2026-11-17-functional-stadium-mvp.md` — bazowe MVP.
- `.ai/specs/2026-11-18-local-stadium-renderer.md` — zatwierdzona próba nowego renderera.
- Brief i blueprint załączone przez właściciela: panorama → trybuna/sektor → rząd/fotel → płynny lot → perspektywa kibica → karta.

## Aktualny cel po doprecyzowaniu właściciela
Właściciel zlecił pełne doświadczenie kibica i budowę Enei kodem według blueprintu. Aktualny plan produktu: `docs/FAN_EXPERIENCE_ROADMAP.md`. Domyślny katalog ma 38 078 foteli w 19 blokach, ciągłą misę i różne poziomy. Domyślne 2D korzysta z natywnego renderera biblioteki; 3D z własnej geometrii R3F. Plik GLB/BLEND ani zakup skanu nie są blokadą. Poniższe tabele obejmują również historię wcześniejszych, węższych przyrostów. Nie deklarować oficjalnego cyfrowego bliźniaka ani pełnego przeniesienia produktu.

## Cel i granice poprzedniego przyrostu
Demo dla klubów piłkarskich, pierwszy scenariusz inspirowany Enea Stadionem. Własny wygląd, lokalne dane648 miejsc i poglądowe ceny/statusy. Bez fotorealizmu, filmówAI, VIP, backendu, logowania, live inventory, rezerwacji i płatności. Zachować wcześniejszy renderer do uczciwego porównania. Scalanie nie należy do tego planu. Właściciel osobno zlecił wdrożenie na Vercel „sales”; ten krok jest autoryzowany, lecz wymaga dostępu do właściwego zespołu i potwierdzenia projektu w API.

## Sposób wykonania
- Integrator jest jedynym autorem w tym worktree; ograniczony research/review wykonuje tańszy agent read-only. Nie uruchamiać osobnej sesji do każdej drobnej zmiany.
- Po każdym zadaniu: krótki review diffu, potrzebne testy, aktualizacja planu, następne gotowe zadanie. Commit nie jest powodem do zakończenia pracy.
- Po zmianie kodu wykonać bramki projektu; nie powtarzać całego browser QA po samym komentarzu lub dokumentacji. Wymagające GPU kryteria pozostają jawnie otwarte.
- Nie obchodzić ograniczeń przeglądarki ani nie podmieniać odbioru WebGL renderemCPU. Nie mnożyć nowych funkcji, aby zapełnić plan.

Statusy: **done** = dowód w repo/logu; **ready** = możliwe teraz; **doing** = aktualne; **blocked** = konkretna zależność; **conditional** = tylko po ocenie rzeczywistych braków, w zatwierdzonym zakresie.

## Etap1 — podstawa danych i ścieżka kibica
| ID | Zadanie | Stan i dowód | Zależność |
|---|---|---|---|
| D1 | Stabilne648 ID,3 sektory,12×18 | done — stadium/selection tests | — |
| D2 | Ceny, statusy i kanonizacja wyboru | done — test wszystkich foteli | D1 |
| D3 | Jednoznaczny adapter nativeID ↔ domainID | done — venueChart.test.ts | D1 |
| D4 | Metryczne boisko105×68 i lokalne pozycje | done — rzeczywisty kompilator sceny | D3 |
| U1 | Sektor/rząd/fotel/karta/powrót w panelu | done —36 prób desktop/mobile | D2 |
| U2 | Zajęte miejsca, ceny rzędów i zachowany powrót | done — browser QA i testy | U1 |
| U3 | Klawiatura, fokus modala, Escape, brak overflow | done w panelu/fallbacku — QA | U1 |

## Etap2 — własny stadion i historia blueprintu
| ID | Zadanie | Stan i dowód | Zależność |
|---|---|---|---|
| G1 | Własna bryła: cztery trybuny, boisko, dach i teren | done kod/CPU; GPU odbiór niżej | D4 |
| G2 | Cztery niebieskie trybuny i biały dach | done w przygotowanych danych/CPU, testkolorów | G1 |
| G3 | Kadr obejmujący cały stadion | done dane bounds/fitPoints; GPU odbiór niżej | G1 |
| G4 | Widoczność punktów boiska z foteli | done konserwatywny test2500 promieni; nie dowód cullinguGPU | G1 |
| G5 | Przejścia i czytelne bloki pozostałych trybun | kod + kontrola CPU: podział ławek, schody z posadzką, poprzeczne przejście; odbiór wyglądu nadal Q1/Q8 | G1 |
| C1 | Osobne wejście do sektora i zbliżenie rzędu | done adapter/testy; GPU odbiór niżej | D3 |
| C2 | Reset/nowy wybór unieważnia stary lot i obraz | done — localVenue.test.ts | C1 |
| C3 | Odróżnienie dotarcia od anulowania, retry | done kod/testy; GPU odbiór niżej | C2 |
| C4 | Miniatura z właściwej kamery na karcie | done kod; blocked odbiór naGPU | C3 |

## Etap3 — niezawodna integracja i uruchomienie
| ID | Zadanie | Stan i dowód | Zależność |
|---|---|---|---|
| L1 | Jawne wybory zamiast spóźnionych obserwacji kamery | done — venueEvents/testy | C2 |
| L2 | Zdarzenia starej instancji nie zmieniają nowej | done — asynchroniczny test disposal | L1 |
| L3 | Spóźniony import, StrictMode/remount i jeden właściciel zasobów | done kod + kontrakt10/10 — venueSession i podłączony LocalVenue; prawdziwy React/GPU nadal Q5 | L2 |
| L4 | Jeden disposal/observer/listener i cleanup także po awarii montowania | done kontrakt — błędy load/mount/watch/observe, contextloss i wyjątek cleanup; wnętrze mount rzucającego przed zwrotem handle poza kontraktem | L3 |
| L5 | Wznowiony mount odtwarza najnowszy wybór dokładnie raz | done kontrakt — aktualny wybór z kolejki, revision retry i roofremount; prawdziwy runtime nadal Q5 | L3 |
| L6 | Komunikat ładowania/gotowości zgodny z faktycznym stanem | done audyt — nie dodawać osobnego subsystemu bez dowodu problemu; onReady nie oznacza pierwszej wyrenderowanej klatki | L3 |
| L7 | Lokalne chunks i własne assety; brak konta/eventu/klucza | done kod/build; pełna siećGPU niżej | G1 |
| L8 | Reprodukowalne uruchomienie, testy, build i bezpieczny wariant porównawczy | done — README/package-lock; finalnie powtórzyć po zmianach | L4 |

## Etap4 — odbiór faktycznej sceny
Te zadania są **blocked**, nie pozostały backlog. Dotychczas WebGL2 niedostępny, ostatnio dodatkowo CUA getTab zwracał timeout przed odczytem strony. HTTP aplikacji działa. Nie zmieniać zabezpieczeń ani odpalać alternatywnego kanału do obchodzenia blokady.

Aktualizacja z `.ai/runs/2026-11-18-live-acceptance.md`: normalne okno pozwoliło sprawdzić kartę101/06/01,65zł, lecz nadal pokazywało BRAK3D. Potem okno zniknęło, a ponowne otwarcie narzędziem zostało **automatycznie odrzucone z powodu wyczerpanego limitu użycia**. Do czasu przywrócenia dostępu nie wykonywać tej akcji przez subagenta, inny interfejs, rawCDP ani pośrednie wykonanie. Dwa równoległe audyty gpt-6-luna źródeł i paczki wykonano bez przeglądarki, bez nowej potwierdzonej usterki.

| ID | Zadanie | Dowód wymagany | Zależność |
|---|---|---|---|
| Q1 | Panorama/sektor/fotel — duży ekran i telefon | obejrzane zrzuty prawdziwegoWebGL | dostępnyGPU/browser |
| Q2 | Kliknięcie sektora i fotela synchronizuje panel |18 próbek + niedostępnyfotel | Q1 |
| Q3 | Płynny przelot2–3s, dach/prześwit i rozglądanie z oczu | rzeczywisty pomiar i obserwacja | Q1 |
| Q4 | Reset w locie,10 zmian, przerwanie i retry | przejście bez błędów i złego obrazu | Q2/Q3 |
| Q5 | Reduced motion, resize, context loss i remount | prawdziwe zachowanie/runtime | L3/Q1 |
| Q6 | Cold start, wszystkie requesty i lokalne lazy assets | brak zewnętrznych originów wymaganych do demo | Q1 |
| Q7 | Miniatura przedstawia wybrany fotel | zdjęcie z tej samej kamery po rzeczywistym dotarciu | C4/Q3 |
| Q8 | Czytelny highlight natywnych sektorów przy naszej bryle | obejrzana scena; nie dodawać filtrów sektorów | G2/Q2 |

## Etap5 — domknięcie i decyzja o wariancie
| ID | Zadanie | Stan | Zależność |
|---|---|---|---|
| F1 | Lint/typecheck/test/build i odtwarzalna instalacja po zmianach | done — npm ci/lint/typecheck/test43/43/build exit0 po integracji | L4/L5 |
| F2 | Niezależny review i poprawki potwierdzonych usterek | done — osobna świeża sesja gpt-6-luna,10/10 focusedtests, bez potwierdzonej usterki | L3/G5 |
| F3 | Porównanie scen i rozmiarów ładowania | część rozmiarów done; zachowanie blocked | Q1–Q8 |
| F4 | Zastąpienie domyślnej sceny tylko po odbiorze | blocked | F3 |
| F5 | Spójny README/QA/spec/log i status wszystkichAC | blocked końcowe zamknięcie po Q/F3/F4; raport bieżącego etapu uaktualniony | F1–F4 |
| F6 | Materiał do przeglądu właściciela i jawne ograniczenia | done lokalny materiał — ZIP608338B, source85e6977, CRC i10 plikówHTTP sprawdzone; bez publikacji i zmiany domyślnego renderera | F1/F2 + raport etapu |

## Bieżąca kolejka produktu — po korekcie właściciela

Przegląd briefu z właścicielem i świeży audyt produktu ujawniły luki mimo zamkniętej listy technicznej. Wcześniejsze stwierdzenie braku gotowych prac nie obejmowało jakości doświadczenia. Poniższy przyrost nadal realizuje zatwierdzone R2/R3/R5/R6; nie dodaje systemu sprzedaży.

| ID | Widoczny rezultat | Stan | Następny dowód |
|---|---|---|---|
| P1 | Wyróżniony rząd w domyślnej scenie, hover fotela z numerem i ceną | kod/testy/review; obraz i raycast nieodebrane | Q1/Q2 na WebGL |
| P2 | Podziały trybun, schody i przejście poprzeczne lokalnej bryły, segmenty skośnego dachu obu scen | kod/testy, obejrzany model CPU | Q1/Q3; CPU nie zastępuje aplikacji |
| P3 | Miniatura z kamery fotela również w domyślnej scenie; zgodność z ID i stanem lotu | kod/testy/review; GPU nieodebrane | Q4/Q7, także wybór tuż przed końcem starego lotu |
| P4 | Aktualny build dostępny na Vercel „sales” | 942fed8 (pełny katalog/2D/koszyk) wdrożone READY na salesbeyond.vercel.app po e03783f | odczytać READY i zasoby każdej nowej rewizji |
| P5 | Cały scenariusz panorama → sektor → rząd → fotel → widok → karta → zmiana miejsca na telefonie i desktopie | blocked przez dostęp do rzeczywistego WebGL/browser | Q1–Q8, bez zastępowania ich buildem |
| P6 | Decyzja o docelowym rendererze i naprawa zauważonych różnic | po P5 | F3/F4, porównane obrazy/lot i wielkości ładowania |
| P7 | Gotowe demo MVP pod linkiem, z odebranym flow i ograniczeniami opisanymi przy wydaniu | po P4/P5/P6 | F5, raport rzeczywistego działania |

Nie traktować P1–P3 jako odebranych tylko dlatego, że kod istnieje. Nie kończyć po zielonym teście, jeżeli kolejne zadanie jest gotowe; nie omijać realnego braku autoryzacji ani blokady przeglądarki. Log bieżącego przyrostu: `.ai/runs/2026-11-18-product-progress-and-vercel.md`.

## Poprzedni materiał do review
Paczka `salesbeyond-mvp-review-85e6977.zip` zawiera poprzedni kod i pozostaje historycznym materiałem. Nie zawiera przyrostu P1–P3. Nie nazywać jej aktualnym wdrożeniem. Pierwszy aktualny przyrost e03783f wdrożony na salesbeyond.vercel.app (production, READY); wcześniejsze ZIP pozostają historyczne.


## Aktualny przyrost A — autorska Enea i natywne 2D

| Zadanie | Stan / dowód |
|---|---|
| A1: połączona misa, różne poziomy, gęsty katalog, membranowy dach i kratownice | Kod; obejrzane rendery CPU w docs/qa-evidence/authored-enea, nie odbiór WebGL |
| A2: wszystkie fotele w 2D/3D i dokładny chart | Test rzeczywistego expandChart: 38 078 ID/pozycji i sekcji, błąd maks. ok. 3e-14 m |
| A3: natywny renderer 2D, synchronizacja wyboru i fallback | Kod + testy kontraktu zdarzeń/cyklu życia; odbiór w aplikacji otwarty |
| A4: kadr bloku od strony boiska i wspólne punkty oczu | Testy projekcji dla wszystkich bloków i proporcji .6/.95/1.6/2.4 |
| A5: bieżący deploy Vercel | 06cd758, production READY, salesbeyond.vercel.app; zasoby HTTP 200, szczegóły w logu |
| A6: pełny browser QA desktop/telefon | Blocked: automatyczna kontrola odrzuciła ponowne otwarcie, brak dowodu zdjęcia wcześniejszej blokady. Bez obejść |
| A7: kolejne funkcje fan experience | Filtry cen/dostępności, liczniki i propozycja grupy przed dodaniem: kod/testy; wielokrotny wybór odtwarzany w 2D/3D. Dalej reguły wydarzenia i kontrakt hold/handoff |


## Przyrost S — wyszukiwanie kibica i oznaczanie koszyka
S1 cena/dostępność + liczniki bez wyłączania podglądu: kod/testy. S2 zakres blok/trybuna/cały stadion: kod/testy. S3 jawna propozycja 2–6 miejsc przed dodaniem: kod/testy alejek, łuków, budżetu i limitu. S4 wiele ID koszyka + aktywny podgląd w natywnym 2D/R3F/SVG: kod/testy progressive restore bez echa. S5 deploy: 2600d4f production READY, salesbeyond.vercel.app; zasoby HTTP 200. S6 browser QA: dotychczasowa blokada dostępu nadal nierozwiązana; nie ponawiano kanału. Log: .ai/runs/2026-11-18-fan-seat-search.md.


## Przyrost P — wznowienie wyboru
P1 zapis samych ID/preferencji i oddzielne klucze pełnego/legacy: kod/testy. P2 odtworzenie kanonicznych cen/statusów i obsługa awarii zapisu: kod/testy. P3 kontrola koszyka przed podsumowaniem: kod/testy zmiany ceny/zajętości, bez fake holda. P4 link do fotela i aktualizacja adresu przy nawigacji: kod/testy. P5 kopiowanie/ręczna alternatywa i komunikaty: kod, odbiór UI otwarty. P6 deploy a8010c1 production READY, salesbeyond.vercel.app, zasoby HTTP 200. Log .ai/runs/2026-11-19-fan-session.md. Dalej pozostałe reguły wydarzenia i rzeczywisty backend hold/handoff; nie zastępować go procesową Map w statycznym hostingu.


## Większy etap Q — polityka + interakcje
Q-S1: wspólny evaluator dodatków/grup, fizyczne single, stany wydarzenia i liczniki — kod/testy. Q-S2: BVH trafień, stabilne transformacje i delty kolorów — kod/testy/diagnostyka CPU, bez browser proof. Q-S3: backend hold/handoff — konkretny przejrzany kontrakt docs/SEAT_HOLD_CONTRACT.md, brak połączonego Supabase; nowy zasób/sekrety wymagają operacji infrastrukturalnej. Q-S4: końcowe bramki i większy deploy w toku; Q-S5: browser QA nadal dotychczasowa blokada, bez prób obejścia. Log .ai/runs/2026-11-19-sustained-fan-mvp.md. Nie kończono po samych patchach/testach; oba przyrosty integrowane razem.
