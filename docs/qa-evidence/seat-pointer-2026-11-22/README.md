# Własność zdarzeń foteli — 2026-11-22

`probe-r3f.mjs` używa rzeczywistego reconciler-a `@react-three/fiber` 9.8.2 z atrapą renderera, bez przeglądarki, WebGL i sieci. Odtwarza dwa instanced meshe fotela i siedem zdarzeń wskazujących.

Uruchomienie: `node docs/qa-evidence/seat-pointer-2026-11-22/probe-r3f.mjs`.

Oczekiwany wynik: zagnieżdżone grupy zdarzeń wykonują 28 wywołań `raycast`, pojedynczy właściciel 14, a nieinteraktywny widok 0. Ślad aktywnych zdarzeń i `instanceId` pozostaje taki sam po usunięciu zewnętrznej grupy.

`deployment-proof.json` wiąże commit źródłowy ze snapshotem produkcyjnym i zapisuje status aliasu, assetów, API oraz skanu błędów runtime. Nie jest dowodem wizualnego odbioru WebGL.
