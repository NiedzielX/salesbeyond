---
date: 2026-11-17
area: three-interactions
status: active
source: regression test interaction.test.ts; @react-three/fiber applyProps
---

## Kontekst
Sektor wyłącza raycast po wejściu na trybunę. Powrót do panoramy ustawiał raycast na undefined.

## Przyczyna
R3F applyProps pomija wartości undefined, więc wcześniejsza funkcja ignorująca przecięcia pozostaje aktywna. Udało się odtworzyć regresję testem z prawdziwym Mesh, Raycaster i applyProps: panorama → sektor → fotel → panorama.

## Reguła
Przywracaj konkretną implementację Mesh.prototype.raycast po wyłączeniu interakcji, zamiast przypisywać undefined. Dla fotela z siedziskiem i oparciem obsługuj zdarzenie wspólnego rodzica, aby obie geometrie wybierały ten sam instanceId.

## Jak sprawdzić
npm test: interaction.test.ts musi wykazać przecięcia w obu panoramach i brak przecięć pośrednich. W browser QA dodatkowo kliknij sektor po resecie i wybierz fotel klikając oparcie; tego kroku wizualnego nie wykonano przy awarii relay.
