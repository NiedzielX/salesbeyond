# Dostęp do dolnych rzędów — 2026-11-21

Reprodukcja dotyczy II-2 po zbliżeniu na sektor i obniżeniu kąta kamery. Wcześniej target pozostawał na środku bloku, pan był wyłączony, a jawny wybór rzędu nie zmieniał kadru. Pierwszy rząd wypadał poza ekranem.

Poprawka pozwala przesuwać kadr wewnątrz granic sektora prawym przyciskiem, Shift + lewym przyciskiem lub dwoma palcami. Suwak kadruje wybrany rząd. Panorama i nieruchomy punkt oczu na fotelu zachowują dotychczasowe zasady. Dolny limit promienia orbity w sektorze wynosi 32 m; w kontrolnym płytkim ujęciu oko zatrzymuje się na wysokości 4.59 m.

[Wynik kontrolera](controller-proof.json) pochodzi z rzeczywistych komponentów Camera, R3F, Drei i Three uruchomionych w StrictMode z atrapą renderera. Pierwszy rząd II-2 po dwóch przesunięciach znalazł się w kadrze (`NDC y≈−.376`), a po wyborze suwakiem na środku (`y=0`). Sprawdzono też Shift + przeciągnięcie, dwupalcowe przesuwanie, zachowanie ręcznej pozycji po pollingu i resize, widok z fotela i 114 kadrów rzędów w 19 blokach. Testy domenowe obejmują dodatkowo cztery proporcje ekranu.

Odtworzenie z katalogu repo:

```sh
node --experimental-strip-types --input-type=module < docs/qa-evidence/lower-rows-2026-11-21/probe-controller.mjs
```

To test kontrolera CPU: bez przeglądarki, WebGL, pikseli ani pomiaru FPS. Nie potwierdza działania fizycznego dotyku i trafień foteli na telefonie. Rzeczywisty odbiór desktop/mobile pozostaje otwarty z powodu wcześniejszej automatycznej odmowy dostępu do przeglądarki; nie użyto alternatywnego kanału.

Pełne bramki i niezależny review: `.ai/runs/2026-11-21-lower-row-camera-and-beyond.md`.

Wdrożono source `36f9388` na [salesbeyond.vercel.app](https://salesbeyond.vercel.app), production READY. [Dowód HTTP/API](deployment-proof.json) potwierdza nowe zasoby, API service, 19 bloków/38 078 miejsc i II-3/1998; brak error/fatal w 15-minutowym oknie. To odczyt dostarczenia wersji, nie odbiór interakcji.
