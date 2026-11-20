# Enea — szczegóły konstrukcji, 2026-11-20

Własna geometria proceduralna. Obejrzane obrazy kontrolne Cycles/CPU:

- [Bryła przed zmianą](../authored-enea/authored-enea-roof.png) i [ten sam kadr po zmianie](authored-enea-roof.png): czytelniejsze żebra membrany, przestrzenna kratownica przy otworze i poziomy elewacji. Sylwetka i pozycje foteli zachowane.
- [Panorama według kamery aplikacji](authored-enea-overview.png): pełny dach mieści się w kadrze.
- [Blok II-3](authored-enea-sector.png): sektor kadrowany od boiska; pobliska połowa dachu wycięta tą samą płaszczyzną co w scenie.
- [Perspektywa fotela w rzędzie 27 bloku II-3](authored-enea-seat.png): widoczne boisko i dach przeciwnej połowy. Dokładne ID jest w eksporcie JSON, wybrane ze środka rzeczywistego rzędu.
- [Elewacja niższej trybuny](authored-enea-exterior.png): podziały kondygnacji i odsłonięta konstrukcja zewnętrzna.

Porównano szczegóły z publicznym obrazem referencyjnym oferty CGTrader wskazanej przez właściciela. Nie pobierano sprzedawanego modelu ani tekstur. Proporcje pozostają autorską interpretacją, bez pomiarowego potwierdzenia zgodności z Eneą.

Bufory są te same, których używa `Stadium.tsx`; katalog nadal ma 38 078 foteli/19 bloków. Architektura ma 59 946 trójkątów w 11 scalonych częściach (wcześniej 44 970/8); to nie jest pomiar wydajności GPU. Nowy test promieni z 171 reprezentatywnych foteli potwierdza, że dach, kratownice i elewacja nie zasłaniają środka boiska. Nie bada zasłaniania przez innych widzów.

Eksport korzysta z `overviewPosition`, `sectorFrame`, `eyePosition` i `roofCutawayNormal`; kadr aplikacji ma pionowy FOV 43°. Blender używa pionowego dopasowania sensora. Zachowane kadry historyczne odpowiadają wcześniejszemu obiektywowi 40 mm. Narzędzie CPU odtwarza tylko architekturę, fotele i uproszczone boisko; nie odtwarza UI, shaderów/oświetlenia R3F, drzew, hovera ani dynamicznej dostępności.

```sh
node --experimental-strip-types scripts/export-authored-stadium.mjs /tmp/enea-review.json
blender -b -t 4 --python scripts/render-authored-stadium.py -- /tmp/enea-review.json /tmp/enea-review
```

Opcjonalne nazwy po katalogu wynikowym ograniczają rendery: `roof bowl overview sector seat exterior`.

**To nie są screenshoty przeglądarki ani zaliczony odbiór WebGL.** Automatyczna kontrola wcześniej odrzuciła dostęp do przeglądarki; nie próbowano obejścia. Rzeczywista panorama, lot, dotyk i płynność na desktopie/telefonie nadal wymagają odbioru.
