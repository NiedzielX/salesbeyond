# Projekt — SalesBeyond Stadium MVP

Status: rozpoznanie na podstawie plików repozytorium i ustaleń właściciela; zatwierdzone przez właściciela 2026-11-17. Poniższa tabela zachowuje historię rozpoznania; aktualizacja zatwierdzonej próby renderera: 2026-11-18.

| Pole | Wartość |
|---|---|
| Cel produktu, użytkownicy | Demo dla przedstawicieli klubu i kibiców: wybrać sektor, rząd i miejsce, płynnie przejść do widoku z fotela. Uproszczone 3D inspirowane Enea Stadionem, dopuszczalne generyczne elementy. |
| Stos i wersje | TypeScript 5.9.3, React/React DOM 19.3.1, Vite 7.3.8, Three.js 0.181.2, R3F 9.8.2, Drei 10.7.9, Tailwind 4.3.5. Testy: node:test. Wersje odczytane z package-lock.json; manifest przypięty do wersji lockfile. Brak bazy i backendu. |
| Polecenia | Instalacja odtwarzalna: npm ci. Lint: npm run lint (ESLint + typescript-eslint). Typecheck: npm run typecheck. Testy: npm test. Build: npm run build. Start: npm run dev. Skan sekretów: brak skryptu. |
| Struktura i granice | src/data/stadium.ts — dane domenowe i pozycje; src/components/Stadium.tsx — geometria, kamera i scena; src/App.tsx — stan wyboru/UI/tour; src/styles.css — styl; src/data/stadium.test.ts — testy danych. |
| Architektura | Istniejące zależności: UI i scena → dane; dane nie importują UI ani Three.js. Brak monorepo i API. Zalecenie dla MVP: wspólne obliczenia miejsc dla sceny i kamery, jeden kontroler kamery. |
| Niezmienniki | Dane demonstracyjne i jawne oznaczenie; brak sprzedaży i płatności; wybór sceny, panelu, widoku i podsumowania spójny. Brak obietnicy dokładności realnego fotela. Nie kupować assetów. |
| Dane wrażliwe / wymogi | Kod nie zawiera formularzy ani mechanizmu trwałego zapisu danych osobowych. Logowanie prywatnego hostingu realizuje platforma Sites; repo nie implementuje własnego logowania. Zewnętrzne Google Fonts usunięto w próbie lokalnego renderera; interfejs korzysta z fontów systemowych. Brak deklaracji zgodności prawnej — wykracza poza obecne MVP. |
| Środowiska i hosting | Dev: Vite. Build statyczny: dist. Hosting istniejący: prywatny Sites; vercel.json zawiera alternatywną konfigurację. Dalsza publikacja tylko na wyraźne polecenie właściciela. Właściciel: użytkownik; aplikacja nie wymaga kluczy API ani sekretów runtime. |
| Stan wyjściowy | npm ci: OK; typecheck: OK; npm test: 4/4; build: OK z ostrzeżeniem o paczce JS 1190,59 kB (gzip 337,37 kB). npm run lint: exit 1, brak skryptu. Brak CI w drzewie. Browser QA: nie sprawdzono w tym rozpoznaniu; poprzednia wersja również nie ma potwierdzonej kontroli. |

## Ustalenia od właściciela

- Priorytet: funkcjonalne MVP; dopuszczalna generyczna bryła z inspiracją Enea Stadionem.
- Poza zakresem: fotorealistyczne obrazy, filmy AI, maski do postprodukcji, VIP, backend, rezerwacje i płatności.
- Istniejący autotour może pozostać; nie uzasadnia rozszerzania zakresu.
- Tańsze modele do ograniczonych zadań; integrator weryfikuje ich wyniki.
- Specyfikację zatwierdza właściciel; zgoda na wykonanie planu nie zatwierdza automatycznie nieprzedstawionego dokumentu.

## Ustalenia zatwierdzone ze specyfikacją

1. Zachować obecny stos i node:test. Przypiąć istniejące zależności do wersji z lockfile, bez ich aktualizacji.
2. Do lintu użyć lokalnego TypeScript ESLint (dokładne wersje sprawdzone przed dodaniem, wydania starsze niż 14 dni). Alternatywa: pozostawić lint jawnie niedostępny; nie udawać, że typecheck zastępuje lint.
3. Pracować na gałęziach i przygotowywać zmiany do review; nie scalać ani ponownie publikować bez osobnego zlecenia.

Nie są potrzebne pytania o dane klientów lub integracje: nie wchodzą do MVP. Brak ustalonej konwencji etykiet i PR — stosować zwięzły opis celu, spec/log, dowody weryfikacji, ryzyka; nie dodawać nieistniejących etykiet.


## Przyrost zatwierdzony 2026-11-18

Produkt dla klubów piłkarskich, Enea Stadion jako pierwszy scenariusz demonstracyjny. Blueprint Omnya określa kolejność doświadczenia, znaleziony projekt dostarcza opcjonalną bazę techniczną. Bez fotorealizmu i rozbudowy sprzedaży.

Lokalny wariant `/?renderer=local` używa przypiętego `@seatlayer/core@0.109.1` (niskopoziomowy runtime OGL) we własnym kontenerze DOM. React/Vite/Three pozostają w poprzednich wersjach. Nie mieszać dwóch kontrolerów ani canvasów: jeden wariant aktywny, oba ładowane osobno. Splaytree przypięte override do3.2.3, ponieważ automatycznie rozwiązane3.2.4 było młodsze niż14dni; zgodność z zakresem polygon-clipping ^3.1.0 sprawdzona.

Dane, własna kolorowa siatka i eksport GLB: `src/data/venueChart.ts`, `venueShell.ts`. Integracja i przygotowana scena: `src/integrations/`. Nowy fizyczny układ wynika z chartu; adapter zachowuje648 domenowych ID/cen/statusów, stary demonstracyjny układ jest nadal używany tylko w starej scenie. Moduły danych używają typów runtime bez importu jego implementacji do głównego interfejsu.

Próba nie zastąpiła domyślnej sceny: realne WebGL2 jest niedostępne w cloud. Bramki43/43, a browser QA dotyczy panelu/fallbacku. Nie deklarować zatwierdzonego wyglądu, czasów lotu, miniatur ani pełnej niezależności od sieci. Szczegóły: `docs/LOCAL_RENDERER_QA.md` i aktywna specyfikacja `.ai/specs/2026-11-18-local-stadium-renderer.md`.


Ciągłe wykonanie (korekta właściciela2026-11-18): plan38 pozycji w `.ai/EXECUTION_PLAN.md`, nie kończyć po drobnych przyrostach. L3–L5 resource-owner wykonane w `venueSession.ts`, podłączone do LocalVenue i sprawdzone10 kontraktami. Całość43 testy. Granice testów i instrukcja lokalnego review: `docs/LOCAL_RENDERER_QA.md`, `docs/REVIEW.md`. Nowego zakresu nie dodano; gotowe prace podjęto bez ponownego pytania, GPU zadania pozostają jawnie blocked.


## Aktualizacja celu i modelu danych 2026-11-18
Właściciel doprecyzował pełne doświadczenie kibica, bez edytora/panelu organizatora. Aktualny plan: `docs/FAN_EXPERIENCE_ROADMAP.md`. Domyślna scena zawiera 38 078 foteli w 19 blokach, z połączonymi narożnikami i różnymi poziomami trybun. Wszystkie są rekordami wspólnego katalogu 2D/3D/panelu/koszyka. Zachowano 648 wcześniejszych ID. Podgląd zajętego fotela jest dozwolony, dodanie go do koszyka jest odrzucane.

Właściciel odrzucił czekanie na BLEND/GLB. Model tworzony kodem z `eneaLayout.ts` i `eneaModel.ts` odpowiada kierunkowi blueprintu i referencjom Enei, bez zakupu/importu skanu. Nie jest zweryfikowanym cyfrowym bliźniakiem ani oficjalnym planem miejsc. Dane i ceny pozostają demonstracyjne; brak serwera holdów/płatności.

Domyślna mapa 2D używa prawdziwego createRenderer z @seatlayer/core, chartu wszystkich foteli i jawnych map ID; SVG służy jako fallback po błędzie inicjalizacji. Domyślne 3D to własna geometria R3F, a `?renderer=local` zachowuje historyczny eksperyment natywnego 3D z 648 miejscami. Nie przeniesiono całego produktu. Moduły danych importują jedynie typy pakietu, właściwy runtime mapy jest ładowany dopiero przy użyciu 2D.

Wcześniejsze sekcje opisują historię węższego wariantu integracyjnego. Aktualny stan weryfikacji: kontrole kodu i rendery CPU przechodzą; odbiór nowych 2D/3D w przeglądarce pozostaje otwarty z powodu odrzucenia dostępu przez automatyczną kontrolę. Log: `.ai/runs/2026-11-18-authored-enea-stadium.md`.


## Wyszukiwanie kibica i wiele ID wyboru 2026-11-19
Filtry ceny/dostępności i liczniki działają nad pełnym katalogiem; nie usuwają dostępu do podglądu ani koszyka. Dobór grupy ograniczony do aktywnego bloku, a poza blokiem do trybuny/całego stadionu. GroupFinder pokazuje propozycję z ceną przed dodaniem, a chosenIds łączy koszyk z wizualnym zaznaczeniem domyślnego 2D/R3F/SVG. Podgląd nie jest zakupem; domenowy limit koszyka nadal 10. 65 testów, lint/typecheck/build. Kod 2600d4f opublikowany na Vercel, production READY; odbiór UI pozostaje otwarty. Log: .ai/runs/2026-11-18-fan-seat-search.md.


## Wznowienie i bezpośredni podgląd 2026-11-19
fanSession.ts waliduje wersjonowany zapis samych ID i preferencji, oddzielnie full/legacy; useFanSession bootstrapuje stan przed efektem zapisu. Zapis lokalny nie jest rezerwacją. Wyczyszczenie usuwa wybór także po refresh; nieznane/zajęte/wykraczające poza limit ID odpadają, a ceny wracają z katalogu. Podsumowanie kanonizuje koszyk ponownie. Link seat wskazuje podgląd, nie koszyk, a adres aktualizuje się po zmianie fotela/powrocie. SeatShare ma kopiowanie z alternatywą ręczną. 72 testy + lint/typecheck/build; właściwy lifecycle/clipboard/WebGL wymagają browser QA. Stan wdrożenia w .ai/runs/2026-11-19-fan-session.md.


## Polityka demo i koszt interakcji 2026-11-19
Kod 4d285ec łączy opcjonalną preferencję nowych izolowanych foteli, wspólną walidację grup/dodatków, stany open/closed/sold-out oraz spójne liczniki. To statyczny event demo; nie odczyt wspólnej dostępności. Katalog reguł/topologia jest budowany raz, a kolejne koszyki korzystają z tego samego indeksu. W R3F macierze instancji są stałe, kolory zmieniają tylko dotknięte ID, a lokalny BVH wybiera kandydatów do normalnego Mesh.raycast Three. 87 testów, lint/typecheck/build i CPU evidence; odbiór browser nadal otwarty. Supabase Free figuruje jako integracja bez połączonych projektów; kontrakt następnej warstwy w docs/SEAT_HOLD_CONTRACT.md, bez utworzonego zasobu/holdów. Log .ai/runs/2026-11-19-sustained-fan-mvp.md.


## Wykonywalny backend holdów 2026-11-19
SQL/API/transport klienta przygotowane i sprawdzone na izolowanym PostgreSQL 17.6 (również równoległe połączenia), 112 testów JS oraz lint/typecheck/build. Migracja prywatnych tabel i service-role-only RPC w database/001-seat-holds.sql. Serwer Web API przez api/seat-api.ts, jawnie wyłączony bez SEAT_HOLDS_ENABLED=1 i prywatnych zmiennych. Frontend nadal korzysta z danych demo; Supabase niepołączony, publiczne holdy nieaktywne. Plan Free blokuje quota, dostęp do organizacji „N” potwierdzony pluginem, próba utworzenia Free odrzucona przez limit NiedzielX. Właściciel wybiera współdzielenie istniejącej bazy w osobnym schemacie albo inne konto. Szczegóły wdrożenia i ograniczeń: docs/SEAT_HOLD_CONTRACT.md.


## Połączona usługa i poprawki zgłoszone 2026-11-20
Właściciel wybrał prywatny sb_hold w istniejącym Supabase Frankfurt. Migracje i seed 38 078 zastosowane, credentials wstawiła integracja Vercel bez ujawniania wartości. HTTP Vercel → DB potwierdza dwie sesje, idempotencję, własność i zwolnienie. Dodano odczyt current własnej sesji dla odzyskania holda po utracie odpowiedzi. React panel quote → confirm → hold → release/expiry i wznowienie; plan pozostaje poglądowy. Funkcja region fra1. Poprawiono start zwykłego adresu w panoramie, pierwszy layout bez lotu, rzeczywisty kliknięty rząd / brak automatycznego row6 i zachowanie części dachu przy wyborze sektora. Pełny dach w panoramie. Odbiór WebGL nadal niezrealizowany z powodu wcześniejszej blokady przeglądarki; CPU/testy/HTTP nie zastępują go.
