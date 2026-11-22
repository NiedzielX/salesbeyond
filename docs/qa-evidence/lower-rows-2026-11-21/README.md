# Dostęp do dolnych rzędów — 2026-11-21

Reprodukcja dotyczy II-2 po zbliżeniu na sektor i obniżeniu kąta kamery. Wcześniej target pozostawał na środku bloku, pan był wyłączony, a jawny wybór rzędu nie zmieniał kadru. Pierwszy rząd wypadał poza ekranem.

Poprawka pozwala przesuwać kadr wewnątrz granic sektora prawym przyciskiem, Shift + lewym przyciskiem lub dwoma palcami. Suwak zmienia rząd, a jawny przycisk „Pokaż rząd 01 w 3D” ustawia lub przywraca kadr także wtedy, gdy suwak już zaczyna na pierwszym rzędzie. Panorama i nieruchomy punkt oczu na fotelu zachowują dotychczasowe zasady. Dolny limit promienia orbity w sektorze wynosi 32 m; po korekcie z 2026-11-22 kontrolowane ręczne zejście zatrzymuje oko na około 2.59 m, powyżej murawy i paneli.

[Wynik kontrolera](row-one-endpoint-proof.json) pochodzi z rzeczywistych komponentów Camera, R3F, Drei i Three uruchomionych w StrictMode z atrapą renderera. Odtwarza wejście do II-2 z `row=1,rowFocused=false`, następnie aktywację tego samego numeru i `rowFocused=true`. Pierwszy rząd po ręcznym zejściu ma `NDC y≈−.185` przy wysokości oka około 2.585 m, a po jawnej aktywacji trafia na środek (`y=0`). Sprawdzono też Shift + przeciągnięcie, dwupalcowe przesuwanie, zachowanie ręcznej pozycji po pollingu i resize, widok z fotela i 114 kadrów rzędów w 19 blokach. Testy domenowe obejmują dodatkowo cztery proporcje ekranu.

Odtworzenie z katalogu repo:

```sh
node --experimental-strip-types --input-type=module < docs/qa-evidence/lower-rows-2026-11-21/probe-controller.mjs
```

To test kontrolera CPU: bez przeglądarki, WebGL, pikseli ani pomiaru FPS. Nie potwierdza działania fizycznego dotyku i trafień foteli na telefonie. Rzeczywisty odbiór desktop/mobile pozostaje otwarty z powodu wcześniejszej automatycznej odmowy dostępu do przeglądarki; nie użyto alternatywnego kanału.

Pełne bramki i niezależny review: `.ai/runs/2026-11-21-lower-row-camera-and-beyond.md`.

Wdrożono source `36f9388` na [salesbeyond.vercel.app](https://salesbeyond.vercel.app), production READY. [Dowód HTTP/API](deployment-proof.json) potwierdza nowe zasoby, API service, 19 bloków/38 078 miejsc i II-3/1998; brak error/fatal w 15-minutowym oknie. To odczyt dostarczenia wersji, nie odbiór interakcji.

Korektę endpointu rzędu 1 i niższej orbity wdrożono 2026-11-22 z source `2f904ec`: production `dpl_3eJc86HiySgQJoX8ZpQmi73badLE`, READY na [salesbeyond.vercel.app](https://salesbeyond.vercel.app). [Nowy dowód dostarczenia](deployment-proof-2026-11-22.json) potwierdza przycisk, instrukcję gestów, moduł kamery, API i brak błędów runtime; nadal nie zastępuje odbioru ekranu.

Po kolejnym screenie właściciela rozszerzono ręczny pan nieco poniżej pierwszego fotela: target zatrzymuje się na 0.75 m, a oko na około 1.755 m. [Dowód kontrolera](lower-pan-proof-2026-11-22.json) pokazuje przesunięcie rzędu 1 z `NDC y=-5.738` do `y=0.034`; test obejmuje bezpieczną wysokość wszystkich 19 bloków. Automatyczny fokus rzędu nadal celuje w jego kanoniczną wysokość, a POV nie używa tego ograniczenia.

Source `b96f203` wdrożono jako production `dpl_3HK5cpiMxFrCxLo2bxD9JdBbQAsA`, READY na głównym aliasie. [Dowód wdrożenia](lower-pan-deployment-proof-2026-11-22.json) potwierdza assety, marker nowej granicy, API i brak błędów runtime; nie zastępuje wizualnego odbioru WebGL.
