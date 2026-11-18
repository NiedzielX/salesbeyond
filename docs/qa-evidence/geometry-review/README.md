# Kontrola geometrii CPU — 2026-11-18

**To nie są zrzuty aplikacji WebGL i nie są fotorealistycznymi kadrami produktu.** Blender4.3.2/CyclesCPU renderuje wyłącznie opaque triangle soup wyeksportowaną z przygotowanej sceny i punkt oczu. Nie ma instancjonowanych foteli, shaderów/chrome WebGL ani rzeczywistego przelotu. Kolory i oświetlenie kontrolnego renderu nie są potwierdzeniem wyglądu w przeglądarce.

- `geometry-overview-after.png`: obecna bryła po zachowaniu autorskich kolorów czterech trybun. Dach zamknięty.
- `geometry-corner-before.png`: dwustronna geometria sprzed zmian (HEAD950d7f7), punkt oczu north-102-row-1:0, spojrzenie na (-52.3,.2,33.8). W tym kontrolnym renderze wygenerowana ścianka zasłania kadr.
- `geometry-corner-after.png`: te same oczy, cel i parametry kamery po dopasowaniu syntetycznej architektury. Różnica pokazuje efekt geometrii, nie zweryfikowane zachowanie natywnego renderera.

Testy promieni są konserwatywne i liczą obie strony trójkątów. Przed14/2500, po0/2500. Z włączonym backface-culling przed też0/2500. Polityka nativeWebGL wymaga odbioru GPU, nie wnioskuj o niej z obrazówCPU. Usuwanie automatycznych ścianek dotyczy wyłącznie naszego demonstracyjnego chartu bez pomierzonych barier.

Reprodukcja obecnego modelu:

```sh
node --experimental-strip-types scripts/export-geometry-review.mjs /tmp/stadium-geometry.json
blender --background --factory-startup --threads 4 --python scripts/render-geometry-review.py -- /tmp/stadium-geometry.json /tmp/stadium-review current
```

Model przed zmianą wyeksportowano z950d7f7 przy użyciu tego samego formatu danych. Surowy JSON to artefakt roboczy poza repo, nie asset aplikacji. Render CPU używa16 próbek, bez denoisingu (instalacja Blendera nie ma OpenImageDenoise). Zrzuty obejrzane przez integratora.


## Przyrost produktu: podziały trybun i dach
`geometry-overview-product.png` i `geometry-corner-product.png`: lokalna geometria po dodaniu schodów/podziałów ławek, poprzecznego przejścia i segmentów skośnego dachu. Eksport 11888 trójkątów i 648 punktów foteli, Blender 4.3.2 Cycles CPU, te same parametry skryptu. Oba obrazy obejrzane przez integratora. Brak instancji krzesełek runtime, materiałów/shaderów WebGL i interfejsu. To nie jest zrzut działającej aplikacji ani odbiór 3D.
