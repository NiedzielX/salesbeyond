---
date: 2026-11-22
area: scene-performance
status: active
source: pomiar instancji widowni i pierścienia zieleni
---

## Kontekst

Scena zawiera dziesiątki tysięcy instancji foteli/widowni i powtarzalne elementy otoczenia. Bufor `instanceMatrix` jest już pełną kanoniczną kopią transformacji.

## Przyczyna

Przechowywanie osobnego `Matrix4.clone()` dla każdej instancji podwaja reprezentację tylko po to, by odtworzyć kilka chwilowo ukrytych elementów. Powtarzalny JSX osobnego mesha dla identycznej geometrii/materialu mnoży draw calle i zasoby.

## Reguła

Dla chwilowej maski przechowuj kopię macierzy dopiero w momencie ukrycia i usuń ją po bitowym przywróceniu. Nie czyść wcześniej oczekujących `updateRanges`. Elementy statyczne o tej samej geometrii/materiale grupuj w `InstancedMesh`; warianty koloru rozdzielaj na minimalną liczbę batchy. Po zapisie oblicz bounds i wyłącz raycast elementów czysto dekoracyjnych.

## Jak sprawdzić

Porównaj cały `Float32Array` przed maską i po sekwencji hide/restore, sprawdź ranges wszystkich zmienionych indeksów oraz bounding box/sphere. Dla otoczenia porównaj każdą pozycję/skalę i liczniki instancji. Heap/init Node to dowód CPU; GPU draw calls, FPS i pamięć urządzenia wymagają osobnego C5.
