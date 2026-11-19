---
date: 2026-11-19
area: stadium-interaction
status: active
source: przegląd sceny, testy zgodności raycast i pomiar CPU
---

## Kontekst
38 078 foteli to 76 156 instancji siedzisk i oparć. Stare efekty hover przepisywały ich macierze w sektorze, a raycast po broad-phase Three nadal sprawdzał wiele pojedynczych instancji.

## Przyczyna
Kolor i geometria miały jeden cykl aktualizacji. Domyślny InstancedMesh.raycast nie ma drzewa instancji; sama wspólna instancjonowana geometria nie przyspiesza wyboru tak jak rysowania.

## Reguła
Rozdziel stabilne macierze od kolorów i aktualizuj tylko stare/nowe ID, rzędy lub zmieniony koszyk. Indeksuj AABB rzeczywistych macierzy instancji, a kandydatów sprawdzaj dokładnym Mesh.raycast Three, zachowując instanceId, rodzica, strony materiału i near/far. Przebuduj indeks po zmianie geometrii/macierzach; nie używaj go dla dynamicznych transformacji bez odświeżenia. Przy cleanup przywróć poprzedni raycast i nie niszcz współdzielonej geometrii/materialu przez pomocniczy mesh.

## Jak sprawdzić
seatPicking.test.ts porównuje trafienia z oryginalnym Three, skośne promienie, transformacje, cleanup i bufory macierzy. benchmark-seat-picking.mjs liczy rzeczywiste Mesh.raycast, uwzględniając bazowy bounding-sphere culling. Oddziel koszt budowy indeksu od kosztu wskazywania; CPU nie dowodzi FPS ani wyglądu WebGL.
