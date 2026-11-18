# QA funkcjonalnego MVP

Status: kontrole kodu i browser QA panelu/fallbacku wykonane; renderowanie i interakcje 3D NIEZWERYFIKOWANE (WebGL niedostępny w cloud). Specyfikacja pozostaje in-progress.

## Automatyczne

`npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
Test regresji Three.js/R3F sprawdza przywrócenie raycast po resecie. Testy danych i domeny sprawdzają 648 miejsc, ceny/statusy/ID, stan wyboru, wspólne pozycje rzędów i kamery, interpolację lotu i brak zmiany oczu przy rozglądaniu, anulowanie callbacków autotour.

## Scenariusze odbioru (3D pozostaje do wykonania)

Właściciel wyraźnie zezwolił na lokalny Vite zamiast managed preview. Uruchomiono `npm run dev -- --port 5173 --strictPort`, otwarto http://localhost:5173/ w cloud Chrome. Na zwykłym komputerze: `npm run dev`. Nie zmieniano ustawień bezpieczeństwa przeglądarki.

1. Rozmiary 390×844 i 1440×900. Obejrzeć zrzuty panoramy/sektora/fotela. Porównać szerokość dokumentu z viewportem; brak poziomego przewijania i krytycznych błędów konsoli.
2. W widoku sektora etykiety HTML mają zniknąć i odsłonić siatkę krzeseł. Dla sektorów 101–103 i rzędów 1/6/12 wybrać pierwsze i ostatnie dostępne miejsce: 18 prób. Skontrolować podsumowanie, cenę i widok boiska, brak geometrii przecinającej kamerę. Lot bez cięcia.
3. Po powrocie do panoramy ponownie kliknąć sektor w 3D (regresja raycast). W sektorze wybrać fotel osobno kliknięciem siedziska i oparcia. Kliknąć w scenie fotel z innego rzędu niż w panelu; wrócić i sprawdzić numer rzędu. Kliknięcie zajętego miejsca nic nie wybiera.
4. Obrócić panoramę szybkim gestem i natychmiast wybrać sektor; sprawdzić, że bezwładność nie przesuwa końca lotu. Po zmianie orientacji telefonu panorama ma mieścić bryłę stadionu, a widok z fotela zachować kierunek patrzenia. Dziesięć zmian miejsca, trzy resety panoramy. Brak przeładowania i niespójności biletu. Rozglądanie z fotela nie zmienia pozycji obserwatora.
5. Sektor 103/rząd 12/miejsce 2: przednia konstrukcja jest odsłonięta i nie przecina lotu. W widoku z fotela obrócić kamerę w stronę kierunku panoramy (około yaw 41°, pitch 32°), następnie reset: brak nagłego odwrócenia. W czasie lotu kliknąć reset i zmienić sektor; końcowa kamera odpowiada ostatniemu wyborowi. Powtórzyć przy prefers-reduced-motion.
6. Autotour: start, stop/Escape/ręczny wybór/drag, odczekać do końca 24 s. Brak spóźnionego nadpisania wyboru.
7. Klawiatura: Tab, Shift+Tab, Enter/Space w sektorach i miejscach; strzałki na suwaku rzędu; powrót. Widoczny fokus i możliwość dalszej nawigacji.
8. Na telefonie po wyborze miejsca scena ma być widoczna; przy awarii 3D zamiast niej widoczne podsumowanie. Zasymulować brak WebGL w osobnej sesji QA bez zmiany ustawień użytkownika. Komunikat zamiast sceny; panel nie może udawać wyrenderowanego widoku.
9. W przeglądarce bez pełnego ekranu odmowa ma pokazać status, bez otwarcia modala O projekcie; tour zatrzymany. Dach dostępny tylko w panoramie. Sprawdzić dach, pełny ekran i modal O projekcie, stale widoczny napis DEMO. W modalu Tab i Shift+Tab pozostają wewnątrz; Escape zamyka modal i zwraca fokus do przycisku.
10. W sesji QA wymusić utratę kontekstu GPU: scena zastąpiona komunikatem, zatrzymany tour, panel nadal pozwala sprawdzić dane miejsc. Kontrola samego listenera jest testem jednostkowym, nie zastępuje tego kroku w przeglądarce.

## Ograniczenie infrastruktury 2026-11-17

`sites-preview start /workspace/worktrees/salesbeyond-process` zakończyło się błędem `relay could not open browser port 4173: timed out waiting for relay readiness`. `sites-preview status`: stopped. Przeglądarka się uruchamia, ale nie uzyskano lokalnego URL ani zrzutów aplikacji. Nie uznaje się kontroli wizualnej za wykonaną.


## Wynik realnego browser QA panelu, 2026-11-17

Przeglądarka: cloud Chromium; normalna zmiana rozmiaru okna i zoomu, bez emulacji urządzenia ani DevTools. Z DOM potwierdzono dokładne viewporty CSS 1440×900 i 390×844.

| Kontrola | Wynik |
|---|---|
| Poziomy overflow | Brak w obu rozmiarach: szerokość dokumentu 1421 ≤ 1440 i 380 ≤ 390 |
| 18 wyborów na desktopie | Pass: sektory 101–103 × rzędy 1/6/12 × skrajne dostępne fotele, podsumowanie zgodne |
| 18 wyborów na telefonie | Pass: te same kombinacje, zgodne dane i ceny; brak overflow |
| Ceny | 101/103: 65 lub 75 zł; 102: 85 lub 95 zł zgodnie z rzędem |
| Zajęte miejsca | Przyciski disabled, co najmniej jedno w każdym badanym rzędzie |
| Kolejne zmiany i reset | 36 wyborów i powrotów bez reload, co najmniej 6 resetów panoramy |
| Klawiatura | Home/End i strzałki zmieniają rząd; Enter wybiera fotel i wraca; rząd zachowany |
| Modal | Tab/Shift+Tab pozostają wewnątrz, Escape zamyka, fokus wraca do O projekcie |
| Fallback na telefonie | Panel/podsumowanie widoczne po wyborze; na zapisanym bilecie panelTop = 91 px |
| Odświeżenie | Interfejs wraca do panoramy, można ponownie wybrać sektor i fotel |
| Zrzuty | Obejrzano, zapisano w docs/qa-evidence/desktop-1440x900.jpg i mobile-390x844.jpg |

Wykryte i naprawione w browser QA:
- Canvas fallback z efektem `onUnavailable` montował się zawsze jako dzieci HTML canvas i sam wyłączał scenę. Zastąpiono czystym, neutralnym tekstem; renderer po poprawce rzeczywiście rozpoczyna inicjalizację.
- Ukryte mobilnie br sklejało „swójpunkt” i „widok.Wielkie”. Dodano jawne spacje.

Niezaliczone: panorama stadionu, klik fotela w 3D, wizualna kolizja lotu i autotour. W konsoli faktyczny błąd: WebGL context could not be created; GL_VENDOR/GL_RENDERER Disabled. Wewnętrzna strona diagnostyki GPU i DevTools są blokowane polityką narzędzia/przeglądarki — nie obchodzono blokad. Testy UI wykonano w rzeczywistym stanie bez WebGL. Znane błędy konsoli inicjalizacji WebGL i rozszerzenia przeglądarki nie są raportowane jako czysta konsola aplikacji.


## Pełny katalog /2D/koszyk — nowe kroki odbioru
Kod objął7614 miejsc bieżącego generycznego modelu. To nie jest oficjalny plan Enei. Nowy przyrost NIEODEBRANY w przeglądarce:
- Każda z4 trybun, każdy blok i pierwszy/środkowy/ostatni rząd: podgląd pierwszego i ostatniego fotela, zajętego i wolnego; zgodność ID/panelu/kamery/karty.
- Plan2D: sektory z klawiatury/dotyku, zoom/pan, przeciągnięcie nie wybiera fotela, wybór zajętego fotela. Przełączenie2D↔3D zachowuje ten sam fotel. AwariaWebGL: działający plan i panel, bez fałszywego widoku3D.
- Koszyk:10 różnych foteli, duplikat, limit, usunięcie/czyszczenie, zajęty fotel można obejrzeć, ale nie dodać. Podsumowanie ma zgodne ceny i jawne demo. Brak rezerwacji/płatności.
- Grupa2–6: jedna trybuna/sektor/rząd, fizyczne sąsiedztwo, zajęte/alejka/budżet wykluczają kandydatów. Istniejący wybór nie jest nadpisywany; limit10 jest atomowy.
- Podsumowanie/info: Tab/Shift+Tab, Escape, powrót fokusu i brak scrolla poziomego na390×844 i1440×900.
- Reset z fotela dowolnej trybuny: dach/podpory nie pojawiają się przed końcem lotu. Numerycznie znaleziono364 przecięcia przy starym wyświetlaniu podpór; nowa granica widoczności używa flying. Nie jest to pomiar płynności GPU.
