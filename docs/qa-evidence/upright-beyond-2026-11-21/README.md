# Beyond na pionowych powierzchniach — 2026-11-21

Korekta po wskazaniu właściciela: napis znajduje się na obu stronach istniejącego szarego prostokąta przy każdej bramce oraz w trzech miejscach na każdym z dwóch szarych boków przy murawie. Poprzednie napisy na podłożu usunięto. Wymiary i położenie paneli bramkowych pozostają takie same.

- [Panel przy bramce](goal-panel.png)
- [Bok przy murawie](pitch-side.png)

Oba obrazy obejrzano. To kontrolne rendery geometrii CPU w Blenderze, z tego samego `createBeyondAdvertising()` co aplikacja. Nie są zrzutami aplikacji ani odbiorem WebGL na telefonie i desktopie; wcześniejsza blokada automatycznego dostępu do przeglądarki pozostaje nierozwiązana.

Odtworzenie z katalogu repozytorium:

```sh
node --experimental-strip-types scripts/export-authored-stadium.mjs /tmp/upright-beyond.json
blender -b -t 4 --python scripts/render-authored-stadium.py -- /tmp/upright-beyond.json /tmp/upright-beyond goalAd sideAd
```

Litery powstają z lokalnego fontu już dostarczanego przez Three.js; brak nowej zależności i zdalnego pobierania fontu. Przegląd kodu i wyniki pełnych bramek są w logu `.ai/runs/2026-11-21-lower-row-camera-and-beyond.md`.
