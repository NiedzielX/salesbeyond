# Częściowe uploady kolorów foteli — 2026-11-22

`probe-webgl-attributes.mjs` uruchamia rzeczywisty `Three.WebGLAttributes` 0.181.2 z atrapą wyłącznie wywołań GL. Pełny sektor C2 ma 3877 foteli i dwie siatki (siedzisko/oparcie).

```sh
node --experimental-strip-types docs/qa-evidence/seat-color-upload-2026-11-22/probe-webgl-attributes.mjs
```

Pierwsza alokacja wysyła pełne bufory koloru (93 048 bajtów). Następny hover jednego fotela wysyła 24 bajty łącznie zamiast ponownie 93 048. Dwie aktualizacje zakolejkowane przed renderem pozostają zachowane i są scalane przez Three; macierze instancji nie zmieniają wersji.

To dowód zachowania CPU/adaptera WebGL, bez rzeczywistego kontekstu GPU, obrazu i pomiaru FPS.
