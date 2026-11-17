---
date: 2026-11-17
area: stadium-camera
status: active
source: niezależny audyt i test flight-clearance.test.ts
---

## Kontekst
Wybór miejsca wymaga nieprzesłoniętych foteli i płynnego przelotu. Panorama i trybuna mają różną prezentację geometrii.

## Przyczyna
Html z distanceFactor pozostawiony w zbliżeniu powiększa etykietę nad krzesełkami. Słupy odciętego dachu mogą przecinać odcinek lotu. Interpolowanie punktów patrzenia przy przeciwnych kierunkach może przejść przez wektor zerowy i nagle odwrócić orientację.

## Reguła
Pokazuj etykiety sektorów tylko w panoramie. Odsłaniaj przednie słupy razem z dachem dla podejścia do fotela. Interpoluj orientację kwaternionem niezależnie od pozycji; nie mieszaj przeciwnych wektorów patrzenia liniowo.

## Jak sprawdzić
Test wszystkich dostępnych miejsc omija widoczne słupy, a test obrotu przy przeciwległych kierunkach zachowuje jednostkowy kwaternion i ograniczony krok kątowy. Własna reprodukcja: z pełnymi słupami 11 kolizji, po odcięciu 0. W przeglądarce osobno obejrzyj etykiety, klik fotela i lot — test geometrii nie jest odbiorem wizualnym.
