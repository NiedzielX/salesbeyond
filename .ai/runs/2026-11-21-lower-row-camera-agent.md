---
started: 2026-11-21
ended: 2026-11-21
agent: lower-row-camera
spec: .ai/specs/2026-11-17-functional-stadium-mvp.md
outcome: success
---

## Zadanie

Przywrócić możliwość dotarcia do dolnych rzędów w domyślnym widoku 3D sektora, w szczególności II-2, ręcznie i przez wybór rzędu. Praca w worktree `salesbeyond-lower-camera`, gałąź `fix/lower-row-camera`, punkt wyjścia `dfb6325`.

## Przebieg

- Sprawdzono kontrakty wyboru, orbitę Drei i przypięty kontroler `three-stdlib`. Kamera sektorowa orbitowała wokół środka bloku przy wyłączonym przesuwaniu; suwak wpływał na kolor wiersza bez zmiany celu kamery.
- W sektorze cel przesuwania jest ograniczony do obwiedni kanonicznych foteli. Korekta przesuwa kamerę i cel o ten sam wektor po aktualizacji tłumienia kontrolera. Minimalny promień 32 i dotychczasowy kąt utrzymują prześwit. W próbie z promieniem 22 przy płytkim kącie kamera znalazła się zbyt blisko i nie objęła pierwszego rzędu.
- Jawny wybór rzędu kadruje jego rzeczywiste pozycje, z dotychczasowym przelotem i obsługą ograniczonego ruchu. Wejście bez wskazania rzędu kadruje cały blok. Rozmiar sceny zmienia obliczenia widoku automatycznego, a ustawiona ręcznie orbita sektora zachowuje pozycję i cel.

## Weryfikacja

- Na `dfb6325` przeszły lint, typecheck, 160 testów oraz test gotowego serwera i build. Build uruchomiono z `--configLoader runner`, żeby nie zapisywać plików w współdzielonym `node_modules`.
- Reprodukcja w rzeczywistym `Camera` i Drei/OrbitControls w StrictMode na CPU, kadr 900 × 555. Po przybliżeniu do 45 przy płytkim kącie w II-2 pierwszy rząd miał współrzędną ekranową NDC y = −2,354. Prawy drag i wybór rzędu 1 zachowały cel `[85.73, 20.94, 0]`.
- Po poprawce dwa przeciągnięcia prawym przyciskiem po 480 px objęły pierwszy rząd przy NDC y = −0,376 i wysokości kamery 4,591. Wybór rzędu 1 ustawił cel `[62, 1.58, 0]` i NDC y = 0. Ten sam tester potwierdził Shift + lewy przycisk, przesuwanie dwoma palcami, zachowanie ręcznego kadru przy aktualizacji dostępności/widowni i zmianie rozmiaru, pozycję oczu i miniaturę po dotarciu, powrót do wskazanego rzędu, panoramę i 114 kadrów rzędów na dwóch proporcjach.
- Zostają dwa testy automatyczne: ruch z rzeczywistym `OrbitControls` i utrzymanie granic oraz kadrowanie pierwszego, środkowego i ostatniego rzędu każdego sektora na czterech proporcjach. `npm run lint`, `npm run typecheck`, `npm test` (162 + 1) i `npm run build -- --configLoader runner` przeszły. Vite ponownie zgłosił ostrzeżenie o dużych porcjach kodu. Istniejący test CPU kontrolera widowni w StrictMode przeszedł dla 57 perspektyw, 62 miniatur i 295 klatek.
- Odbiór przeglądarki, WebGL i rzeczywistych gestów na telefonie pozostaje otwarty zgodnie z wcześniejszą odmową automatycznej kontroli dostępu do przeglądarki.

## Wynik

- W domyślnym 3D w sektorze przesuwaj kadr prawym przyciskiem, Shift + lewym przyciskiem lub dwoma palcami. Suwak ustawia kadr na wybranym rzędzie.

## Lekcje

- Odtwarzaj łącznie rzeczywisty kąt, granicę zoomu i gest przesuwania. Zbyt mały promień płytkiej orbity może umieścić kamerę na poziomie niższych rzędów przed prawidłowym przesunięciem celu. Granice trzeba nakładać po każdej klatce tłumienia, także po zejściu poniżej progu zdarzenia `change`.
