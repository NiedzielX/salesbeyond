---
status: in-progress
created: 2026-11-23
owner: NiedzielX
related:
  - .ai/specs/2026-11-17-functional-stadium-mvp.md
  - .ai/specs/2026-11-21-seatlayer-feature-parity.md
---

# Nawigacja między miejscami i wycentrowanie widoku na murawie

## Problem

Po wejściu w perspektywę fotela kibic musi wrócić do listy miejsc, żeby porównać sąsiednie fotele. Po ręcznym rozejrzeniu się nie ma też jawnej akcji przywracającej kierunek na murawę bez opuszczania bieżącego punktu widzenia. Utrudnia to szybkie porównanie miejsc, szczególnie na telefonie.

## Cel i zakres

Dodać do pełnego doświadczenia kibica:

- wybór poprzedniego i następnego fotela w tym samym ciągłym, fizycznym odcinku rzędu;
- jawne wycentrowanie perspektywy bieżącego fotela na murawie bez przesunięcia punktu oka;
- dostępne sterowanie klawiaturą i dotykiem, spójne z kanonicznym wyborem, URL-em, planem 2D, panelem i sceną 3D.

Funkcja dotyczy własnego renderera `Stadium` i wspólnego panelu/planu 2D. Wariant zgodności `?renderer=local` zachowuje nawigację miejsc w panelu i na planie, ale nie obiecuje wycentrowania kamery obcego renderera; przycisk recenteru jest tam ukryty. Jest to świadoma granica migracyjna, a nie drugi silnik produktu.

### Poza zakresem

- przechodzenie między rzędami, sektorami lub przez alejki;
- automatyczne pomijanie miejsc zajętych — nadal wolno oglądać ich perspektywę;
- zmiana koszyka, filtrów, cen, dostępności, blokady lub polityki pojedynczych miejsc;
- skróty globalne przechwytujące strzałki poza kontrolkami;
- zdjęcia 360°, fotorealizm, płatności, edytor stadionu i panel organizatora;
- nowe zależności, nowy model danych lub zmiana API backendu.

## Wymagania

### R1 — jedna definicja fizycznego sąsiedztwa

Poprzednie/następne miejsce wynika z istniejącego `physicalRowRuns()`. Nawigacja nie może przekraczać granicy sektora, rzędu, nieciągłej numeracji, geometrycznej luki/alejki ani skoku wysokości. Kolejność zawsze rośnie lub maleje według numeru fotela, niezależnie od strony stadionu i kierunku kamery. Na końcu odcinka odpowiednia kontrolka jest nieaktywna; nie ma zawijania. Indeks powstaje z memoizowanego, kanonicznego `inventory`, nie z filtrów, live overlayu ani miejsc aktualnie widocznych w UI. Dostępność, status blokady i filtry nie zmieniają fizycznego sąsiedztwa.

### R2 — kanoniczny wybór bez skutku koszykowego

Akcja wybiera kanoniczny fotel przez istniejącą ścieżkę `selectSeat`/`selectionReducer`. Aktualizuje panel, URL, zapisaną sesję, podświetlenie planu 2D i cel kamery 3D. Nie dodaje ani nie usuwa miejsca z koszyka i nie zmienia holda. Miejsce zajęte pozostaje dostępne do podglądu.

### R3 — wycentrowanie perspektywy

W perspektywie fotela własnego renderera jawna kontrolka natychmiast kieruje kamerę ponownie na ustalony punkt murawy (`[0, 1, 0]`) z bieżącej pozycji oka — tak samo z ograniczeniem ruchu i bez niego. Jednocześnie synchronizuje kwaternion oraz wewnętrzne `yaw`/`pitch`, aby pierwszy gest po recenterze nie powodował skoku. Nie zmienia pozycji kamery, wybranego fotela, koszyka ani holda, nie uruchamia lotu, nie reaktywuje `OrbitControls`, nie wywołuje `onReady` i nie wymusza nowej miniatury. Po ręcznym rozejrzeniu i po wielokrotnym użyciu działa ponownie.

### R4 — dostępny interfejs

W panelu fotela, przed zmienną miniaturą, są stabilnie rozmieszczone i jednoznacznie nazwane przyciski poprzedniego oraz następnego miejsca, a gdy jest dostępny zgodnie z R5 — także wycentrowania widoku. Stan nieaktywny granicy odcinka jest przekazany natywnym `disabled`. Cele dotykowe mają co najmniej 44×44 CSS px na mobile. Po zmianie fotela fokus pozostaje na uruchomionej kontrolce, jeśli nadal jest aktywna; gdy osiągnięta granica ją wyłącza, przechodzi na przeciwną aktywną kontrolkę, a przy odcinku jednofotelowym na stabilny, fokusowalny nagłówek panelu. Stale zamontowany region `aria-live="polite"` i `aria-atomic="true"` ogłasza sektor, rząd i numer bez skoku przewijania.

### R5 — zachowanie awarii i powierzchni 2D

Poprzednie/następne działa również na planie 2D i przy fallbacku bez WebGL. Recenter jest widoczny w perspektywie fotela własnego renderera 3D, lecz pozostaje `disabled` do zakończenia lotu. Jest ukryty w 2D, po awarii/utracie kontekstu oraz w `?renderer=local`. Żądanie jest jednorazowe, związane z aktualnym ID fotela i obsługiwane wyłącznie przy braku aktywnego lotu; nie może odtworzyć się po remouncie ani powrocie z mapy. Szybkie kolejne poprzednie/następne podczas lotu są dozwolone: ostatni wybór wygrywa, a końcowe ID, oko i miniatura odpowiadają ostatniemu fotelowi. Awaria WebGL nie może blokować nawigacji po danych miejsc.

## Kryteria akceptacji

- **AC1:** test domenowy wybiera poprzedni/następny fotel wewnątrz `physicalRowRuns()` i zwraca brak celu na obu końcach odcinka, przy alei/lukach geometrycznych, osobnym skoku wysokości, zmianie numeracji, rzędu i sektora, dla nieznanego ID i odcinka jednofotelowego; kolejność numerów nie zależy od strony/kierunku kamery.
- **AC2:** test potwierdza, że zajęty fotel jest legalnym celem podglądu, a nawigacja nie mutuje koszyka ani danych dostępności.
- **AC3:** test integracji rzeczywistej kontrolki potwierdza aktualizację kanonicznego ID/sektora/rzędu/numeru, planu i URL oraz brak zmiany koszyka i aktywnego holda. Zapisaną sesję sprawdza osobno: przez kontrolę payloadu albo reload bez parametrów wyboru przy zachowanym storage, aby deep link nie maskował błędu zapisu. Cena/status celu pochodzą z bieżącego overlayu.
- **AC4:** test czystej geometrii kamery potwierdza natychmiastowy kierunek na `[0, 1, 0]`, zsynchronizowane yaw/pitch oraz identyczną pozycję oka z tolerancją `1e-6`. Osobny test rzeczywistego `Camera`/kontrolera potwierdza przypisanie do `angles.current`, utrzymanie pozy przez kolejny render, stabilny pierwszy mały drag, ponowne centrowanie oraz brak skutków `flight/reset/onReady/preview`, także przy reduced motion.
- **AC5:** w Chromium WebGL2 na buildzie produkcyjnym 1440×900 przyciski poprzednie/następne zmieniają fotel bez przejścia przez alejkę; szybka zmiana podczas lotu kończy się ostatnim ID/okiem/miniaturą; recenter jest wyłączony w locie, działa po dotarciu i po rozejrzeniu bez widocznego przesunięcia oka; konsola nie zawiera błędu aplikacji. Publiczny smoke wymaga osobnej autoryzacji deployu.
- **AC6:** w emulacji dotykowej 390×844 kontrolki mają minimum 44×44 CSS px, działają po tapnięciu w obu trybach sterowania sceną, nie powodują poziomego overflow ani skoku scrolla. Klawiaturą Tab/Shift+Tab, Enter i spacja działają w środku i na końcach odcinka, a komunikat podaje sektor/rząd/numer.
- **AC7:** w sesji bez WebGL poprzednie/następne nadal aktualizuje miejsce na planie 2D, a recenter nie jest oferowany. `?renderer=local` zachowuje panelową nawigację w 2D i 3D, bez recenteru. Powrót 2D→3D, remount i utrata kontekstu nie odtwarzają starego żądania recenteru.
- **AC8:** `npm run lint`, `npm run typecheck`, `npm test` i `npm run build` przechodzą; zmiana ma testy przypadków brzegowych i obejrzane zrzuty desktop/mobile.

## Projekt rozwiązania

1. `src/domain/seatNavigation.ts` — mały, czysty helper budujący indeks miejsc z `physicalRowRuns()` i zwracający poprzedni/następny cel bez powielania reguł alejki. Testy w `src/domain/seatNavigation.test.ts` realizują AC1–AC2.
2. `src/components/cameraControls.ts` — czysta funkcja wyliczająca orientację oraz zsynchronizowane yaw/pitch na cel bez zmiany pozycji; test geometrii w `src/domain/camera-controls.test.ts` realizuje pierwszą część AC4.
3. `src/components/Stadium.tsx` — nowy licznik/żądanie recenteru przekazane do `Camera`; obsługa tylko w ustabilizowanym widoku fotela, bez zmiany `reset`, `flight` i `eyePosition`. Test kontrolera R3F lub równoważny harness realizuje drugą część AC4, włącznie z pierwszym dragiem i brakiem callbacków ubocznych.
4. `src/App.tsx` — jednorazowy indeks sąsiadów z memoizowanego `inventory`, użycie istniejącego `selectSeat`, bieżącego overlayu do ceny/statusu, stabilne kontrolki/fokus/status i stan recenteru. Nie używać `previewFromList`, ponieważ jego dodatkowe przewinięcie nie jest tu potrzebne.
5. `src/styles.css` — kompaktowy układ desktop/mobile i cele dotykowe ≥44 px.
6. Aktualizacja `docs/FAN_EXPERIENCE_ROADMAP.md` i `docs/LOCAL_RENDERER_QA.md`; weryfikacja AC5–AC7 najpierw na produkcyjnym buildzie, a publiczny smoke dopiero po osobno zatwierdzonym deployu. Dowód trafia do `docs/qa-evidence/`.

Kolejność implementacji: czerwone testy domeny → helper nawigacji → czerwony test kamery → recenter kontrolera → integracja React → style i a11y → pełne bramki → niezależny review → browser QA → dokumentacja/realizacja.

## Ryzyka i otwarte pytania

- B3 zależy od odbioru kamery A1. Implementację źródłową można przygotować po zatwierdzeniu, ale status `implemented` jest niedozwolony bez rzeczywistego WebGL/browser QA.
- Nie wolno wyliczać sąsiada przez samo `number ± 1`; rozjechałoby to zachowanie z regułami grup i alejek.
- Zwiększenie istniejącego `reset` uruchomiłoby zwykłą nawigację i mogłoby przesunąć oko. Recenter musi mieć osobny sygnał.
- Stan live może zmienić cenę/dostępność celu. Wybór używa bieżącego overlayu do prezentacji, ale kanoniczna tożsamość nadal pochodzi z katalogu stadionu.
- Fizyczny telefon nie jest dostępny w automatycznym środowisku; 390×844 jest emulacją dotykową i musi być tak raportowane.

## Niezależny przegląd

Przeprowadzony 2026-11-23 przez osobną sesję `gpt-6.2-sol` bez kontekstu autora, read-only. Review wskazał synchronizację kwaternionu z yaw/pitch, jednoznaczną macierz dostępności recenteru i jednorazowe żądanie, stabilny fokus/status na granicach oraz wykonalne testy integracji URL/sesji/koszyka/holda. W drugim przebiegu doprecyzowano podział AC4 na czystą geometrię i harness prawdziwego `Camera`, osobną weryfikację sesji bez maskowania deep linkiem oraz warunkową obecność recenteru. Wszystkie must-fix wprowadzono. Dodano też rekomendacje o kanonicznym indeksie `inventory`, stabilnym layoucie, dokładnym 44×44 CSS px, `?renderer=local`, szybkim retargetowaniu i rozdzieleniu build QA od autoryzowanego deployu. Właściciel zatwierdził specyfikację 2026-11-23 słowami: „Zatwierdzam specyfikację B3 i deploy poprawek A1–A3 na production.” Po rozpoczęciu implementacji status zmieniono na `in-progress`.

## Realizacja

Rozpoczęto 2026-11-23 po jawnym zatwierdzeniu właściciela. Kod i lokalny odbiór produkcyjnego buildu zakończono 2026-11-24: domena sąsiedztwa, wspólna ścieżka wyboru, dostępny interfejs i jednorazowy recenter mają testy oraz browser QA w WebGL2, fallbacku i `?renderer=local`. Niezależny review odtworzył i pomógł zamknąć race spóźnionego zakończenia lotu; finalny sanity check nie znalazł dalszych must-fix. Dowody: `docs/qa-evidence/b3-seat-navigation-2026-11-24/verification.json`; przebieg: `.ai/runs/2026-11-23-b3-implementation.md`. Status pozostaje `in-progress` do osobno autoryzowanego publicznego smoke B3 wymaganego przez AC5.
