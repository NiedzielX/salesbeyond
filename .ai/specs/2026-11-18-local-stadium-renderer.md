---
status: in-progress
created: 2026-11-18
owner: NiedzielX
related:
  - .ai/specs/2026-11-17-functional-stadium-mvp.md
  - .ai/runs/2026-11-18-github-stadium-research.md
---

# Lokalny renderer stadionu — próba integracyjna

## Problem
Właściciel wskazał SeatLayer jako preferowaną bazę i przekazał informację o zgodzie autora na wykorzystanie całości. Dysponuje wyłącznie publicznym GitHubem. Publiczny kod obejmuje integracje frameworków; implementacja silnika jest prywatna, a skompilowany runtime udostępniony na npm. Sam fork repozytorium React nie zawiera więc źródeł sceny 3D.

## Cel i zakres
Sprawdzić lokalny runtime jako wymienny renderer istniejącego MVP, z naszym panelem, danymi i oznaczeniem demo. Wybór sektora/rzędu/miejsca, przelot i powrót pozostają główną ścieżką. Kierunek wizualny: niebieski, uproszczony stadion inspirowany Enea Stadionem. Brak publicznego podziękowania i oznaczenia dostawcy w interfejsie.

### Poza zakresem
Sprzedaż, rezerwacje, płatności, konta, backend, event w zewnętrznej usłudze, publikacja, dokładny bliźniak, fotorealizm, dekompilacja i odtwarzanie prywatnego kodu źródłowego. Dotychczasowego renderera nie usuwać przed oceną próby.

## Wymagania
- R1: Lokalny `ChartDoc` i `expandChart` opisują trzy wybieralne sektory 101–103, po 12 rzędów i 18 miejsc. Adapter zachowuje wzajemnie jednoznaczne mapowanie 648 obecnych ID na ID runtime; ceny i dostępność pochodzą z obecnej domeny.
- R2: Runtime montowany w zwykłym kontenerze DOM, poza sceną R3F. Jeden renderer aktywny naraz, lazy import. React lifecycle kończy się wywołaniem `dispose()` i usunięciem obserwatorów.
- R3: Interfejs renderera: wybranie sektora/rzędu, wybór fotela, lot do fotela, panorama, resize i disposal. `onSeatPick(seatId)` wraca przez adapter ID do obecnego reducera. Niedostępny fotel nie zmienia wyboru. Wymagania czasu przelotu i reduced motion wcześniejszej specyfikacji pozostają kryterium porównania, bez cichego uznania odmiennej animacji za zgodną.
- R4: Dane i zasoby potrzebne do ścieżki MVP są dostarczane przez nasz origin/build. Brak odwołań do obcego API, eventu, checkoutu, autoryzacji ani analityki w przejściu demo. Bez kluczy i bez pozorowanych rezerwacji.
- R5: Zachować jawny opis danych poglądowych i uczciwy komunikat awarii WebGL2. Zachować panel dostępny z klawiatury i dotyku. Nie obiecywać, że zmiana runtime naprawi brak GPU w środowisku QA.
- R6: Nie zmieniać automatycznie stosu React/Vite ani wersji istniejącego Three.js. Kandydat do przypięcia: `@seatlayer/core@0.109.1`, opublikowany 2026-10-26. Statycznie potwierdzono entry point view3d i API potrzebne próbie. Zależności tego pakietu obejmują OGL, Konva, earcut i polygon-clipping; nowy renderer jest osobnym silnikiem w kontenerze DOM, nie elementem sceny Three/R3F. Nie dodawać `@seatlayer/react` ani `@seatlayer/js`, jeśli lokalny core wystarczy.

## Kryteria akceptacji
- AC1: Test round-trip ID dla 648 miejsc, brak duplikatów, zgodne sektory/rzędy/ceny/statusy. Błędne ID odrzucane bez zmiany wyboru.
- AC2: Lokalna scena ma boisko, cztery niebieskie trybuny i uproszczony dach albo porównywalną bryłę; dane wybieralnych miejsc zgadzają się z geometrią i kamerą. Zrzuty panoramy/sektora/fotela obejrzane na działającym WebGL2. Brak wizualnej weryfikacji oznacza próbę nieodebraną.
- AC3: Sektor → rząd → miejsce → przelot → widok → powrót działa z obecnym panelem; 18 próbek według wcześniejszej specyfikacji, niedostępne miejsce, reset w locie i 10 kolejnych zmian bez przeładowania.
- AC4: Weryfikacja requestów całej ścieżki od cold startu z pustym cache, łącznie z zależnościami przechodnimi, fontami, teksturami, workerami i lazy chunks: brak zewnętrznych originów wymaganych do działania ani zewnętrznej analityki. Wariant z obcym API nie zalicza próby lokalnej. Sam opis core o braku fetchu chartu nie jest dowodem spełnienia AC4.
- AC5: Unmount/remount, zmiana rozmiaru i StrictMode nie zostawiają drugiego canvasa ani aktywnych callbacków. Reduced motion i utrata kontekstu mają sprawdzoną obsługę.
- AC6: Lint/typecheck/test/build exit 0; UI sprawdzone przy 390×844 i 1440×900. Porównany początkowy rozmiar i lazy chunk oraz zachowanie obu rendererów. Obecnego renderera nie usuwać, jeżeli nowy nie spełnia kryteriów.

## Projekt rozwiązania
1. Najpierw zweryfikować dokładny kontrakt wybranego wydania 0.109.1. Deklaracje 0.112.0: `@seatlayer/core/view3d` → `mountVenue3D(container, {doc, seats, initialState}, options)`; handle: `focusSection`, `focusRow`, `flyToSeat`, `focusOverview`, `setSelection`, `dispose`, callback `onSeatPick`. Istnienie tych API sprawdzono również w opublikowanych deklaracjach 0.109.1. API potwierdzone statycznie, nie uruchomione. Jeśli rzeczywisty kontrakt uniemożliwi mapowanie ID lub lokalne zasoby, nie instalować kolejnych wrapperów jako obejścia; opisać brak i wybrać plan B.
2. Przypięta zależność i adapter w `src/integrations/localVenue.ts`; dane chartu w `src/data/venueChart.ts`. Planowane nazwy, bez implementacji na etapie researchu. Sprawdzić skalę jednostek chartu, orientację osi i wysokość oczu; nie kopiować wprost naszych XYZ do płaskich x/y chartu.
3. Wrapper `src/components/LocalVenue.tsx` montuje niezależny kontener, reaguje na stan domenowy, sprząta runtime. `App.tsx` podłącza go przez wybór renderera; istniejący renderer pozostaje dostępny do porównania.
4. Zweryfikować lokalne assety, ścieżki lazy importów i requesty. Jeżeli potrzebny jest prywatny kod lub niedostępne zasoby, opisać konkretny brak zamiast udawać samodzielny fork.
5. Testy adaptera i bramki, niezależne review, rzeczywisty browser QA. Dopiero na podstawie wyniku decyzja o zastąpieniu sceny, bez publikacji w tym zakresie.

## Ryzyka i otwarte pytania
- Zgoda autora według relacji właściciela; jej zakres nie oznacza dostępności prywatnych źródeł. Nie dopisywać publicznego brandingu. Zachować istniejące wymagane noty cudzych zależności.
- Lokalna powierzchnia API istnieje w npm, ale dokumentacja nazywa bezpośredni core integracją niskopoziomową. Nie uznawać jej za stabilny drop-in R3F.
- Wydanie 0.112.0 za świeże dla reguły 14 dni. Kandydat 0.109.1 jest starszy niż 14 dni i ma potrzebne deklaracje, ale nie przeszedł próby działania. Odmienne funkcje między wydaniami nadal wymagają weryfikacji.
- Cloud browser dotychczas nie tworzył WebGL. Pozostaje ograniczenie odbioru sceny, niezależne od wybranego renderera.
- Jeśli renderer nie odtworzy uproszczonego dachu i układu Enea bez ingerencji w prywatne źródła, porównać z proceduralnym MIT generatorem `whoistorres/stadium-seat-view` zamiast rozszerzać MVP.

## Niezależny przegląd
Read-only review osobnej sesji gpt-6-luna: kierunek lokalnego core jest spójny z potwierdzonym API. Uwzględniono uwagi o callbacku kliknięcia, konkretnej starszej wersji, sprawdzeniu wszystkich zależności sieciowych od cold startu i osobnym silniku/teardown. Nie dodawać publicznych podziękowań; standardowe wymagane pliki cudzych zależności pozostają w pakietach. Integrator sam sprawdził deklaracje i metadane wersji. Dokument następnie zatwierdzony przez właściciela; implementacja poniżej.

## Realizacja
Właściciel zatwierdził plan wiadomością „tak. uzyjmy tamtego jako szablonu ale celujmy w nasz wyglad [...] enea to pierwszy cel. dzialaj” 2026-11-18. Rozpoczęto lokalną próbę integracyjną na osobnej gałęzi/worktree. Produkt jest kierowany do klubów piłkarskich; pierwszy scenariusz demonstracyjny: Enea Stadion. Bez deklaracji oficjalnej współpracy.


### Przyrost lokalnego renderera
Zaimplementowano przypięty core0.109.1, lokalny chart/adapter648 ID, własną proceduralną bryłę GLB, przygotowaną scenę i niezależny wrapper DOM. Dokładne pozycje nowej sceny pochodzą z jej chartu i rozstawu .62m; stary demonstracyjny układ R3F pozostaje osobno do porównania. Brak zmian cen/statusów/znaczenia fotela. Nie dodano backendu i kluczy.

Właściciel ponownie wskazał blueprint jako kierunek i oczekuje zgłaszania lepszych rozwiązań. Utrzymano historię panorama→sektor→rząd→fotel→karta. Kadr obejmuje całe własne założenie stadionowe, zamiast domyślnego kadru samych wybieralnych rzędów. Sektor kadruje cały sektor, zmiana rzędu przybliża rząd. Karta ma obsługę miniatury z tej samej kamery po potwierdzonym dotarciu; brak obrazu przy przerwaniu lub braku GPU. Te funkcje wymagają jeszcze odbioru GPU. Nie dodano fotografii AI, filmów ani VIP.

Review wykryło mylenie rozwiązanej Promise lotu z dotarciem do fotela: reprodukcja testowa26/27 przed poprawką,27/27 po. Dodano rozróżnienie arrived, prawdziwy komunikat przerwania i retry. Ponowne review bez nowych potwierdzonych usterek. Log: `.ai/runs/2026-11-18-local-stadium-renderer.md`; QA: `docs/LOCAL_RENDERER_QA.md`.

AC1 potwierdzone testami; AC2–AC5 mają niewykonane części GPU/sieci; AC6 bramki kodu i panel sprawdzone, pełne porównanie scen niewykonane. Cloud nie tworzy WebGL2. Z tego powodu zachowano wcześniejszą scenę jako domyślną, nowa jest dostępna przez `/?renderer=local`. Status pozostaje in-progress. Nie publikowano.


### Dalszy przyrost: własne kolory, geometria i granica zdarzeń
Kontynuacja w tym samym zatwierdzonym zakresie R2/R3/R6, bez nowych zależności i funkcji sprzedaży. Dopasowano przygotowaną siatkę poprzez publiczny kontrakt modelu. Import zarejestrowanego GLB nie zachowywał kolorów trzech trybun, również bez override shell. Własne powierzchnie teraz trafiają do przygotowanej siatki z ich kolorami; GLB pozostaje opcjonalnym eksportem z tych samych powierzchni.

Usunięto tylko generowany beton material5 w zakresach natywnych sektorów naszej syntetycznej konfiguracji; pozostawiono stopnie i podstopnice oraz autorską architekturę. Przeliczono wszystkie bufory i zakresy. Test2500 linii do5 punktów boiska:14→0 przecięć w geometrii dwustronnej. Z włączonym backface-culling baseline także miał0: to nie dowód usterki GPU. Kontrolne rendery CPU nie zastępują AC2.

Mostek zdarzeń odrzuca callbacki odmontowanej instancji, deduplikuje jawne wybory i chroni przed synchronicznymi echami metod kamery. Natywny onViewTargetChange nie służy już do zmiany wybranego fotela; wybór pochodzi z onSeatPick, wbudowane steppery pozostają wyłączone. Zmiany nie modyfikują znaczenia miejsca i panelu.

33/33 testy, lint/typecheck/build zielone. Niezależne review buforów/zakresów/bridge, integrator sprawdził wyniki. Odbiór GPU nadal niewykonany; próba CUA zakończyła się timeoutem protokołu przed stanem strony. Status in-progress, wariant lokalny nadal opt-in. Log: `.ai/runs/2026-11-18-continue-local-renderer.md`.
