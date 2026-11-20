---
started: 2026-11-20T19:19:04Z
ended: 2026-11-20T19:29:00Z
agent: seat_camera_ground_fix
spec: .ai/specs/2026-11-17-functional-stadium-mvp.md
outcome: partial
---

## Zadanie

Odtworzyć zgłoszone zapadanie się kamery po wyborze miejsca i poprawić potwierdzoną przyczynę w kontrolerze R3F. Zakres R4/R6 i AC4 zatwierdzonej specyfikacji.

## Przebieg

- Potwierdzony odrębny worktree `/workspace/worktrees/salesbeyond-camera-ground`, gałąź `fix/seat-camera-ground`, baza `9f36318`.
- Przejrzano ścieżki animacji, zmiany rozmiaru, podglądu, punktów oczu oraz zainstalowany kod Drei, R3F i three-stdlib.
- Drei wykonuje `OrbitControls.update()` z priorytetem −1 pod warunkiem `enabled`. Przylot do fotela zachowuje wyłączoną orbitę. R3F utrzymuje stworzony aparat przy odtworzeniu obiektu opcji `camera`, a podczas resize przelicza projekcję. WebGLRenderer aktualizuje macierz świata niepodpiętej kamery przy renderowaniu miniatury.
- Przelot `I-1-46-29` → `101-1-10` przecinał podłogi piętnastu stopni. Pierwsze przecięcie występowało na wysokości 26,22 jednostki. Różnica wysokości i prosty tor prowadziły za widoczną geometrię trybuny.
- Przelot pomiędzy podglądami foteli biegnie teraz po krzywej kwadratowej od strony boiska. Odchylenie poziome rośnie z odległością przelotu. Profil wysokości, punkt oczu, orientacja i czas 2,4 s pozostają zgodne z AC4.

## Weryfikacja

- Baza `9f36318`: lint, typecheck, testy 153 + 1 i build zakończone kodem 0.
- `node --experimental-strip-types --test --test-name-pattern='zmiana podglądu' src/domain/flight-clearance.test.ts` przed poprawką odtworzył przecięcie `Stepped bowl` dla `I-1-46-29` → `101-1-10` w próbce 8.
- `node --experimental-strip-types --test src/domain/flight-clearance.test.ts src/domain/camera-controls.test.ts` po poprawce zaliczył 7 testów. Nowa regresja używa czterech tras i widocznych geometrii Enei, sprawdza wysokość zgodną z poprzednim przebiegiem, punkt docelowy i tryb ograniczonego ruchu.
- Test diagnostyczny CPU na 171 fotelach z 19 sektorów zbadał 29 070 uporządkowanych transferów. Oryginalna prosta kolidowała z geometrią w 2387 przypadkach. Po zmianie próbki krzywych dały 0 przecięć.
- Tymczasowy test CPU montował rzeczywisty `Camera` w zainstalowanym R3F z Three i Drei oraz ręcznie przesuwał zegar klatek. Trasa `I-1-46-29` → `101-1-10` na 144 klatkach miała 15 przecięć stopni przed zmianą, 0 po zmianie. Po obu przebiegach miniatura odczytała kamerę na wysokości 2,76 jednostki. Tryb ograniczonego ruchu dotarł w pierwszej klatce.
- Drugi test kontrolera wykonał 272 wywołania renderowania dla bezpośredniego linku `102-1-9`, zmiany proporcji 900×555 → 350×550, aktualizacji ceny tego ID i dwóch szybkich zmian podczas lotu. Aparat pozostał ten sam, obie miniatury miały punkt oczu na 2,76 i kierunek na środek boiska, a orbita po dotarciu była wyłączona.
- `npm run lint`, `npm run typecheck`, `npm test` (154 + 1), `npm run build` i `git diff --check` zakończone kodem 0. Vite ponownie zgłosił ostrzeżenie o rozmiarze paczek. Instalację pominięto w worktree ze współdzielonymi zależnościami.

## Wynik

Potwierdzono i naprawiono przecinanie geometrii przy kolejnych podglądach. Zasłyszane zapadanie się pod samą murawę pozostaje niepotwierdzone. W próbkach przelotów z panoramy wykryto osobno 20 przecięć pozostawionej membrany na 684 trasy, a w 684 próbkach przelotów z właściwego sektora uzyskano 0 przecięć. Zmiana widoczności dachu podczas lotu pozostaje do decyzji integratora. Odbiór obrazu WebGL pozostaje otwarty z powodu obowiązującej odmowy uruchomienia przeglądarki.

## Lekcje

Dla zgłoszeń o zapadaniu się kamery sprawdź osobno tor względem widocznej geometrii i wysokość końcową. Zamontowanie rzeczywistego kontrolera w R3F z zegarem klatek i atrapą renderera pozwala porównać kolejność aktualizacji i odczyt pozycji przez zrzut.
