---
date: 2026-11-17
area: camera
status: active
source: camera-controls.test.ts, odtworzony problem OrbitControls
---

## Kontekst
Kamera po zaprogramowanym przelocie ponownie oddaje panoramę pod sterowanie OrbitControls.

## Przyczyna
Wyłączenie enabled nie usuwa wewnętrznej sphericalDelta z damping. Po ponownym włączeniu controls.update stosuje resztę poprzedniego gestu do nowej pozycji kamery. Test z prawdziwym OrbitControls odtworzył przesunięcie punktu końcowego.

## Reguła
Przed lotem opróżnij damping przez update bez enableDamping, zachowując i przywracając pozycję, orientację kamery i cel. Nie zmieniaj początku lotu podczas czyszczenia sterownika.

## Jak sprawdzić
Test camera-controls.test.ts: setAzimuthalAngle z damping → pauza → lot do ustalonego punktu → ponowne update; końcowy punkt musi pozostać niezmieniony. Osobno sprawdź to wizualnie po szybkim geście w przeglądarce.
