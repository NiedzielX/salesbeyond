# Kontrola własnej geometrii Enei — CPU, 2026-11-18

Obejrzano dwa obrazy: [dach](authored-enea-roof.png) i [otwarta misa](authored-enea-bowl.png). Widać połączone narożniki, różne wysokości i poziomy trybun, gęste niebieskie fotele, biały napis oraz łukową membranę i konstrukcję stalową.

To render Blendera/Cycles na CPU własnych buforów eneaModel i wszystkich 38 078 foteli kanonicznego katalogu. Oświetlenie i boisko odtworzono na potrzeby kontroli geometrii. Nie są to zrzuty aplikacji R3F, dowód zgodności shaderów, zachowania kamery, UI ani wydajności WebGL. Nie potwierdzają dokładności wobec rzeczywistego stadionu. Model/tekstury ze sprzedawanego skanu nie są wykorzystywane.

Odtworzenie (Blender 4.3.2 jako narzędzie developerskie, nie zależność aplikacji):

```sh
node --experimental-strip-types scripts/export-authored-stadium.mjs /tmp/authored-enea.json
blender --background --factory-startup --threads 4 --python scripts/render-authored-stadium.py -- /tmp/authored-enea.json /tmp/authored-enea-preview
```

Przeglądarka pozostaje zablokowana przez automatyczną kontrolę dostępu. Nie użyto alternatywnego kanału do obejścia odmowy; odbiór 2D/3D na desktopie i telefonie jest niewykonany.
